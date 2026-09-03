# Plan: Open the site to indexing, block scraper bots

## Goal
Let search-engine crawlers and major AI indexers discover and index the public pages, while blocking known resource-hogging scraper bots. Keep automated *use* of the tool (agents running searches / downloading zips) blocked via the existing hCaptcha + rate-limiting layer — robots.txt can only govern crawlers fetching pages, not agents impersonating browsers.

## Current state (verified)
- `public/robots.txt` = `User-agent: *` / `Disallow: /` → blocks every crawler.
- All four route files set `{ name: "robots", content: "noindex, nofollow" }`: `index.tsx` (`/`), `library.tsx` (`/library`), `licenses.tsx` (`/licenses`), `s.$token.tsx` (`/s/$token`).
- No sitemap exists.

## Changes

### 1. Rewrite `public/robots.txt`
- Explicit `User-agent: <scraper>` / `Disallow: /` blocks for known content-scraping / SEO-aggregator bots that consume resources without aiding discovery: `AhrefsBot`, `SemrushBot`, `MJ12bot`, `DotBot`, `PetalBot`, `Bytespider`, `Sogou web spider`, `Baiduspider`, `BLEXBot`, `DataForSeoBot`, `ZoominfoBot`.
- `User-agent: *` with empty `Disallow:` → allows everything else, which covers search engines (Googlebot, Bingbot, DuckDuckBot, YandexBot, Baiduspider-normal) **and** the major AI indexers (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, Applebot-Extended, CCBot) by default.
- Add `Sitemap: https://skills.mikedemo.dev/sitemap.xml`.

### 2. Remove `noindex, nofollow` meta from the public pages
Remove the `{ name: "robots", content: "noindex, nofollow" }` line from:
- `src/routes/index.tsx` (`/`)
- `src/routes/library.tsx` (`/library`)
- `src/routes/licenses.tsx` (`/licenses`)
- `src/routes/s.$token.tsx` (`/s/$token`) — made crawlable per your choice.

### 3. Create `src/routes/sitemap[.]xml.ts`
- `BASE_URL = "https://skills.mikedemo.dev"`.
- Static entries only: `/` (priority 1.0, weekly), `/library` (0.8, weekly), `/licenses` (0.5, monthly).
- No `<lastmod>` (no authoritative page-specific timestamp exists — omit rather than fake one).
- No dynamic `/s/$token` entries: those are 72-hour, user-specific, and not statically linked (recent-searches is localStorage-only), so enumerating ephemeral tokens would churn the sitemap. They remain crawlable (no noindex) if a crawler ever follows a link.
- No Supabase query needed (no public, durable, link-worthy dynamic content). Plain XML response, `Cache-Control: public, max-age=3600`.

## Notes / caveats
- **robots.txt cannot stop "AI bots that use the site on behalf of a user."** Those agents don't identify themselves and look like browser traffic; the hCaptcha gate + per-IP rate limiting already defend the search/download endpoints. This plan handles the crawler/discovery side; the agent-abuse side stays as-is.
- `Sogou web spider` user-agent contains a space and must be written verbatim.
- `vite.config.ts` must NOT enable `tanstackStart({ sitemap })` — it would shadow the server route.

## Rollback
Revert `public/robots.txt` to `User-agent: * / Disallow: /`, re-add the noindex meta line to the four routes, and delete `src/routes/sitemap[.]xml.ts`.
