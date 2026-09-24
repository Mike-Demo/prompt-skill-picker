# Skill Finder -> Spacefast migration spec

Decisions (confirmed by owner, 2026-09-24):
- **AI**: no server-side AI key. Two modes, visitor's choice:
  1. **Bring your own OpenAI key** — stored only in the visitor's browser, sent per request to `/api/search` and `/api/enhance`, forwarded to OpenAI, never logged or stored.
  2. **In-browser model** — small local model (WebLLM/transformers.js, WebGPU) for keyword expansion and Enhance; ranking falls back to registry install counts. Slower first load (model download), no cost.
  Without either, search still works using the literal prompt + install-count ordering.
- **Home**: Spacefast becomes the only home. Lovable copy retired after cutover + 1 week.
- **Shared links**: carried over via one-off export/import at cutover.

## Architecture

```text
Browser (optional local model, optional user OpenAI key)
  -> Spacefast CDN: dist/client (prerendered pages, /* -> /index.html)
  -> /api/* Spacefast Functions (functions/api/*.ts)
       -> Spacefast database
       -> skills.sh, GitHub raw/API, hCaptcha, OpenAI (only with visitor key)
```

## Route mapping

| Current server function | Spacefast route | Guard |
|---|---|---|
| searchSkills | POST /api/search `{prompt, captchaToken, openaiKey?, queries?}` | captcha, 3/min 30/day |
| enhancePrompt | POST /api/enhance `{prompt, captchaToken, openaiKey}` | captcha, 3/min 30/day (skipped entirely in local-model mode) |
| getCaptchaSitekey | GET /api/captcha-sitekey | none |
| fetchSkillFiles | POST /api/skill-files `{ids}` | 10/min 200/day, allowlist |
| createSkillGist | POST /api/gist `{ids}` | 2/min 20/day, allowlist |
| getSavedSearch | GET /api/saved/:token | library limit |
| listSkills | GET /api/library | 20/min 200/hour |
| listAgentSkills | GET /api/agents/:agent | 20/min 200/hour |
| getRenderMode | removed (SSR switch removed) | - |
| sitemap route | static public/sitemap.xml | - |

Errors: `{ error, code, retryAfter? }`, 429 carries `Retry-After` so the cooldown/auto-retry UI keeps working. `openaiKey` is never persisted; a 401 from OpenAI returns `code: "invalid_openai_key"`.

## Database (portable SQL; confirm Spacefast engine first)

```sql
CREATE TABLE saved_searches (
  token TEXT PRIMARY KEY, prompt TEXT NOT NULL, results TEXT NOT NULL,
  created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL);
CREATE INDEX saved_searches_expires ON saved_searches(expires_at);

CREATE TABLE registry_cache (
  cache_key TEXT PRIMARY KEY, payload TEXT NOT NULL, fetched_at INTEGER NOT NULL);
CREATE INDEX registry_cache_fetched ON registry_cache(fetched_at);

CREATE TABLE rate_limit_hits (
  bucket TEXT PRIMARY KEY, count INTEGER NOT NULL, window_start INTEGER NOT NULL);
CREATE INDEX rate_limit_window ON rate_limit_hits(window_start);

-- atomic consume (one statement):
INSERT INTO rate_limit_hits(bucket, count, window_start) VALUES (?, 1, ?)
ON CONFLICT(bucket) DO UPDATE SET count = count + 1 RETURNING count;
```

Hourly cron: delete expired saved searches, rate windows older than 1 day, cache rows older than 7 days.

## Secrets on Spacefast

HCAPTCHA_SITEKEY, HCAPTCHA_SECRET_KEY, GITHUB_GIST_TOKEN (gist scope), RATE_LIMIT_SALT (new random). No AI key. Enable outbound HTTP to skills.sh, github.com, api.github.com, raw.githubusercontent.com, hcaptcha.com, api.openai.com.

## Build

- vite.config.ts: Spacefast TanStack plugin; prerender `/`, `/library`, `/licenses`, nine agent pages; autoStaticPathsDiscovery off; never `nitro.preset = "static"`.
- `scripts/copy-static-output.mjs` -> dist/client; build = `vite build && node scripts/copy-static-output.mjs`.
- public/_redirects: `/api/*` to functions, then `/*  /index.html  200`.
- Guard module-scope timers/caches so prerender doesn't hang.

## Phases

1. Extract search/registry/captcha/limit logic into runtime-neutral `src/core/` (no Lovable/Supabase imports); AI calls take a provider interface (openai-with-user-key | none).
2. Create Spacefast DB + atomic limit statement; tests.
3. Write functions/api/*; curl each on a Spacefast preview.
4. Front end: typed API client replacing RPC calls; settings panel for "Your OpenAI key" and "Use in-browser model"; remove SSR switch.
5. Prerender + build checks (index.html per route, deep links, query params).
6. E2E on Spacefast preview: search (3 modes), enhance, captcha, zip, gist, shared link, library, agent pages, cooldown.
7. Cutover: lower DNS TTL, freeze new shares on Lovable, export valid `saved_searches` rows (`expires_at > now()`) as JSON, import to Spacefast, switch DNS, keep Lovable live one week.

## Rollback

Point DNS back to Lovable. Shares created on Spacefast after cutover are lost on rollback (72h max).

## Risks

- Visitor OpenAI keys pass through the worker: HTTPS only, never logged; state this in the UI.
- In-browser model: large download, needs WebGPU; ranking quality lower than today.
- Function time limit must allow ~30s search; unconfirmed.
- Database engine, backups and cron syntax on Spacefast unconfirmed.
