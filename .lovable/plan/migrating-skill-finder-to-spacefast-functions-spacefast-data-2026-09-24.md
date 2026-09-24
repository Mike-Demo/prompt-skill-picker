# Migrating Skill Finder to Spacefast (Functions + Spacefast database)

This is a design document only. Nothing is built, published, or moved until you approve a follow-up build step. Confidence notes are marked **[fact]** (checked in the code), **[assumption]** (from the Spacefast docs, confirm in their dashboard), or **[unknown]**.

## 1. Architecture and request flow

```text
Browser
  -> Spacefast CDN: static pages from dist/client (prerendered, then hydrated)
  -> /api/* -> Spacefast Functions (functions/ folder, one file per route)
        -> Spacefast database (saved searches, registry cache, rate limits)
        -> skills.sh registry, GitHub (raw + API), hCaptcha, AI provider
```

Today every server action is a built-in RPC call running on Lovable's server **[fact]**. On Spacefast those become plain HTTP endpoints the pages call with `fetch` **[assumption: Spacefast does not run TanStack's server build]**.

## 2. Route mapping (10 server actions today) [fact]

| Today | New Spacefast route | Protection |
|---|---|---|
| searchSkills | POST /api/search | captcha + search limit (3/min, 30/day) |
| enhancePrompt | POST /api/enhance | captcha + enhance limit (3/min, 30/day) |
| getCaptchaSitekey | GET /api/captcha-sitekey | none (public value) |
| fetchSkillFiles | POST /api/skill-files | download limit (10/min, 200/day), id allowlist |
| createSkillGist | POST /api/gist | gist limit (2/min, 20/day), id allowlist |
| getSavedSearch | GET /api/saved/:token | library limit |
| listSkills | GET /api/library | library limit (20/min, 200/hour) |
| listAgentSkills | GET /api/agents/:agent | library limit |
| getRenderMode | removed | static site has no per-request rendering; the SSR switch goes away |
| sitemap route | static public/sitemap.xml | none |

Request and response shapes stay identical (same zod schemas, moved into a shared module both sides import). Every route validates input and returns plain JSON with a stable error shape `{ error, code, retryAfter? }` so the existing cooldown/auto-retry UI keeps working.

## 3. Database schema (Spacefast database)

**[unknown]** which engine Spacefast's database is (SQLite-style or Postgres). The DDL below is portable SQL; Postgres-only features (jsonb, timestamptz, row security) are replaced by text JSON, ISO/epoch timestamps, and checks in the worker code.

- `saved_searches`: token (primary key), prompt, results (JSON text), created_at, expires_at (created + 72h); index on expires_at.
- `registry_cache`: cache_key (primary key), payload (JSON text), fetched_at; index on fetched_at.
- `rate_limit_hits`: bucket (hashed IP + action + window), count, window_start; index on window_start.

Since the database is only reachable from the worker, access control moves from row policies into the route code. Existing rows: shared links expire in 72h and cache rebuilds itself, so a **fresh start is acceptable**; an optional one-off export/import script is included for saved searches still valid at cutover.

The "consume one rate-limit hit" routine currently runs atomically in the database **[fact]**; on Spacefast it must be a single upsert-and-return statement, otherwise concurrent requests can overshoot limits.

Pruning: a Spacefast cron (hourly) deletes expired saved searches, old rate-limit windows, and cache rows older than 7 days.

## 4. Secrets and environment

| Today [fact] | On Spacefast |
|---|---|
| LOVABLE_API_KEY (AI) | **Does not work outside Lovable.** Needs your own AI provider key (e.g. Google or OpenAI), new cost |
| HCAPTCHA_SITEKEY, HCAPTCHA_SECRET_KEY | copy over |
| GITHUB_GIST_TOKEN | copy over (classic token with gist scope) |
| RATE_LIMIT_SALT | new random value (resets per-visitor counters, harmless) |

The worker's outbound-internet permission must be enabled for skills.sh, GitHub, hCaptcha and the AI provider **[assumption]**.

## 5. Build setup

- `vite.config.ts`: add Spacefast's TanStack Start plugin; prerender every public route (home, library, licenses, nine agent pages) with auto-discovery off. `/s/:token` is served by the `/index.html` fallback and loads its data in the browser.
- `scripts/copy-static-output.mjs`: copies prerendered output into `dist/client`; build script becomes `vite build && node scripts/copy-static-output.mjs`.
- `public/_redirects` (`/*  /index.html  200`, after `/api/*`), static sitemap, robots pointing at it.
- Watch for a build that writes all pages and then hangs (module-level timers/caches in the registry and ranking code) and guard them.
- `SPACEFAST.md` recording install/build commands and output folder.

## 6. Phased checklist

1. **Shared logic**: move search/ranking/registry/captcha/limits code into a runtime-neutral folder with no Lovable-specific imports. Check: current app still works.
2. **Database**: create the three tables and the atomic limit statement on Spacefast. Check: insert/read/expire tests.
3. **Functions**: one route per row in section 2. Check: call each with curl against a Spacefast preview.
4. **Front end**: replace RPC calls with a small typed API client; remove the SSR switch. Check: typecheck, every page loads.
5. **Prerender + build**: section 5. Check: one index.html per route, deep links and query params restore.
6. **End-to-end on a Spacefast preview URL**: search, enhance, captcha, zip download, gist, shared link, library, each agent page, cooldown auto-retry.
7. **Cutover**: lower DNS TTL a day early, switch skills.mikedemo.dev (you do DNS), keep Lovable live for a week.

## 7. Rollback

Lovable hosting stays untouched throughout. Rollback = point DNS back. Shared links created on Spacefast during the trial would not exist on Lovable (72h expiry limits the impact).

## 8. Risks and trade-offs

- **Two copies of the backend** if you keep editing in Lovable: Lovable's preview runs the old server code, Spacefast runs the new routes. Mitigation: make the new routes the only version and have Lovable's preview call them too — but then Lovable preview depends on Spacefast.
- **AI cost** moves to your own provider bill.
- **Cold starts / time limits**: a search makes several AI and registry calls (up to ~8s timeouts each) **[fact]**; Spacefast function time limits must allow ~20-30s **[unknown]**.
- **In-memory caches** (keyword cache, skill allowlist) don't survive across worker instances; the durable database fallback already exists for the allowlist **[fact]**.
- **Backups**: confirm Spacefast database backup/export options before cutover **[unknown]**.
- **SEO**: static prerender keeps titles and share tags; the SSR switch is removed.

Estimated effort: a multi-session migration, not a single change.

## Open questions before building

1. Which AI provider (and key) should Spacefast use?
2. Keep editing in Lovable afterwards, or treat Spacefast as the new home?
3. Carry over live shared links, or fresh start?
