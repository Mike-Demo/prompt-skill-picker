# Make Skill Finder agent-friendly (Silicon Friendly audit)

Goal: move from L0 to L2, with a start on L3, by giving AI agents a documented, read-only way into the skill catalogue. The human search stays behind hCaptcha.

## What the audit found vs. reality
- Meta description, OG and Twitter tags already exist on every page. The auditor couldn't see them. Only structured data (JSON-LD) is missing.
- The "no_captcha" failure is intentional for AI search, since it costs money. We keep that gate and give agents a free path that doesn't need it.

## Changes
1. **`/llms.txt`** (static file): what the site is, the key pages (library, the 9 agent pages, licenses) and the agent API. This is the one-file quick win to reach L2.
2. **Read-only JSON API** (no captcha, rate-limited per visitor, served from the existing cache):
   - `GET /api/public/skills?q=&limit=`: keyword filter over the cached library. No AI calls.
   - `GET /api/public/skills/agent/:agent`: the curated list for one agent page.
   - Both return JSON with id, name, source, installs, install command and URL. Too many requests get a 429 with a Retry-After header.
3. **OpenAPI spec** at `/openapi.json`, documenting those two endpoints.
4. **API docs page** at `/docs/api`, a readable version of the spec. It gets proper page tags, a link in the footer, and an entry in the sitemap.
5. **Agent card** at `/.well-known/agent.json` (also served at `/agent.json`): name, description, links to the API and llms.txt.
6. **JSON-LD** in page heads: `WebSite` + `SearchAction` on the homepage, and `CollectionPage` / `ItemList` on the library and agent pages.
7. **Updates** to robots.txt (link llms.txt, allow `/api/public/skills`) and the sitemap.

## Out of scope for now
- An MCP server (L4). It's a possible follow-up once the API exists.
- Removing the captcha from AI search.

## Technical details
- Server routes live under `src/routes/api/public/` and reuse `listSkillLibrary` / `listAgentSkillLibrary` plus `consumeRateLimit` with a new `"api"` bucket (30/min, 500/day).
- Input is checked with zod: `q` is at most 100 characters, `limit` is 1-50, and `agent` must be one of `AGENT_KEYS`.
- JSON-LD goes in through `head().scripts` with `type: "application/ld+json"`.
- Checks: typecheck, curl each endpoint (200, JSON shape, 429 path), confirm `/llms.txt` and `/.well-known/agent.json` return 200, and confirm JSON-LD appears in the SSR HTML.
- Rollback: everything is new files and new routes; delete them to revert.
