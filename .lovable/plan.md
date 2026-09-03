# Rate limiting and abuse blocking

Note up front: this backend has no built-in rate-limiting primitive, so this is an ad-hoc implementation. You chose durable storage, so the first step is enabling Cloud (database) for this project.

## What gets protected

| Action | Limit per IP |
| --- | --- |
| Find skills (AI search) | 3 per minute, 30 per day |
| Enhance (AI rewrite) | 3 per minute, 30 per day |
| Download zip | 10 per minute |
| Library listing | 20 per minute (already 5-min cached) |

Exceeding a limit returns a clear message with the seconds remaining, shown inline in the existing error area — no silent failures.

## Auto-blocking bad actors

An IP is temporarily blocked for 1 hour when, inside a 10-minute window, it accumulates:
- 5+ failed captcha verifications, or
- 20+ rate-limit rejections.

Blocked requests are refused immediately for every endpoint, before any AI or GitHub call is made. Blocks expire on their own; no permanent bans, so a real user who tripped it recovers automatically.

## What the user sees

- Friendly message when limited: "You can search again in 42s."
- Friendly message when blocked: "Access temporarily paused due to unusual activity. Try again later."
- Buttons disable during the cooldown with a live countdown, so the limit is visible before it is hit.

## Technical notes

Backend (Cloud):
- Table `rate_limit_events` — `id`, `ip_hash`, `action`, `outcome` (`allowed` | `limited` | `captcha_failed`), `created_at`; indexed on `(ip_hash, action, created_at)`.
- Table `ip_blocks` — `ip_hash` (PK), `reason`, `blocked_until`, `created_at`.
- Both are server-only: `GRANT ALL ... TO service_role` and no `anon`/`authenticated` grants, RLS enabled with no permissive policies, so browsers cannot read or write abuse data.
- A `cleanup` delete of events older than 24h runs opportunistically on write to keep the table small.

Server:
- `src/lib/rate-limit.server.ts` — `checkRateLimit(action, ip)` returns `{ allowed, retryAfterSeconds }` by counting recent rows; `recordOutcome`, `isBlocked(ip)`, `maybeBlock(ip)`.
- The client IP comes from request headers inside the handler (`cf-connecting-ip`, falling back to the first entry of `x-forwarded-for`), then is SHA-256 hashed with a server-side salt before storage — raw IPs are never persisted.
- All four server functions in `src/lib/skills.functions.ts` call `isBlocked` then `checkRateLimit` first; captcha failures are recorded as `captcha_failed` before the error is rethrown.
- Uses the privileged server client inside handlers only (never imported at module scope).

Frontend:
- `src/routes/index.tsx` and `src/routes/library.tsx` surface the returned `retryAfterSeconds` as a countdown on the affected button.

Rollback: the change is additive — reverting `rate-limit.server.ts`, the guard lines in the server functions, and the countdown UI restores current behaviour; the two tables can be left in place harmlessly.

Risks: IP-based limits punish shared networks (offices, mobile carriers) — 1/minute is strict, and several people behind one NAT will collide. Say the word if you'd rather start at 3/minute.
