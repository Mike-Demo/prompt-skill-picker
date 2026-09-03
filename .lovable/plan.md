# Auto-retry after cooldown + cost/performance tuning

Three changes: cooldowns recover on their own, search reuses work instead of repeating it, and the app stops paying for round trips it doesn't need.

## 1. Auto-retry when a cooldown ends

Today a rate-limited action shows a countdown and a disabled button; the user has to click again.

- **Library page:** when the countdown reaches zero, the library load retries itself and the inline "too many requests" message is replaced by the fresh results. No click needed.
- **Download buttons (both pages):** on expiry, the pending download re-runs automatically for the same selection.
- **Search page:** when the countdown reaches zero the search re-runs automatically **if** a valid captcha token is still available. Because the captcha widget resets after every attempt, in the common case there is no token left — there the button re-enables with the label "Find skills" and a one-line hint asking the user to confirm the captcha again. That is a hard limit of captcha-gated actions, not something the retry logic can work around.
- A countdown that expires without anything to retry simply clears.

## 2. Keep search snappy

- **Cache the keyword-expansion call** per normalised prompt (lowercased, trimmed, whitespace-collapsed) in a bounded in-memory cache with a 30-minute lifetime. Repeat and near-repeat searches skip that AI call entirely.
- **Return fewer skills:** candidate pool drops from 24 to 12 and the ranked list from 12 to 8. That cuts the document fetches per search roughly in half and shrinks the ranking prompt, which is the largest AI cost in the app.
- **Trim the ranking prompt** to id, name and description (install counts don't influence relevance) for fewer tokens per search.

## 3. Cost savings elsewhere

- **Rate limiting in one database call instead of four.** Each guarded request currently issues a block lookup, one or two counting queries and an insert. These collapse into a single security-definer function that checks the block, counts the windows and records the attempt, returning the verdict. Same limits, same behaviour, a quarter of the database traffic.
- **Stop writing a row for every library view.** The library is served from a shared cache, so its per-IP limit moves to an in-memory counter and writes no rows at all. Search, enhance and download keep their durable counters.
- **Longer library cache:** 5 minutes to 30 minutes, so the registry and GitHub fan-out runs at most twice an hour instead of twelve times.
- **Fewer library topic queries:** 14 broad searches to 8, which already saturate the 24-entry catalogue.
- **Deterministic event cleanup** instead of the current 2%-chance prune on writes: retention trimming moves into the same database function, keyed off the oldest row age, so the table stays small without random extra deletes.

## Technical notes

- `src/hooks/use-cooldown.ts`: `useCooldown` gains an optional `onExpire` callback fired once when the countdown hits zero; the countdown interval is cleared on expiry rather than ticking forever.
- `src/routes/library.tsx`: `onExpire` calls `library.refetch()`; download cooldown re-invokes the last download.
- `src/routes/index.tsx`: `onExpire` re-submits when `captchaToken` is non-null, otherwise clears `busy` and shows the captcha hint.
- `src/lib/skills-ranking.server.ts`: new module-level `Map<string, { queries: string[]; expiresAt: number }>` with a size cap for `expandQueries`; `MAX_CANDIDATES` 24 → 12; ranked slice 12 → 8; catalog string drops installs.
- New migration: `public.check_rate_limit(_ip_hash text, _action text, ...)` security-definer function returning `{ allowed, retry_after_seconds, blocked }`, `GRANT EXECUTE ... TO service_role` only. `src/lib/rate-limit.server.ts` calls it via `rpc` and keeps `RateLimitError`, `getClientIp`, and `recordCaptchaFailure` semantics unchanged. Existing tables, indexes and the intentional "RLS enabled, no policies" posture stay as they are.
- `src/lib/skills-library.server.ts`: `CACHE_TTL_MS` 5 → 30 minutes, `TOPICS` trimmed to 8.
- Typecheck gate `bunx tsgo --noEmit`, then a browser pass over `/` and `/library` confirming a cooldown recovers without a click.

## Risk and rollback

Confidence is high on the caching and count reductions (measurable and local). The auto-retry on the search page is the weakest part, since captcha re-confirmation cannot be automated — assumption, stated plainly, not verified. Rollback is a revert of the touched files; the migration is additive, so the old query-based limiter path can be restored without dropping anything.
