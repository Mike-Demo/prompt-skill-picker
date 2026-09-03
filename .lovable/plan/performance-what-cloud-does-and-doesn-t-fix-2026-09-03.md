# Performance: what Cloud does and doesn't fix

## Short answer on Cloud

Enabling Cloud would not make the app faster on its own. Cloud adds a database, auth, storage and secrets — it doesn't speed up code that's already running. The current slowness is not a missing backend; it's the number of outside network calls each page makes.

Cloud only helps performance indirectly, in one specific way: it gives a place to **persist** the skill data the app currently re-fetches on every cold start. That's a real win but it's the last step, not the first.

## Where the time actually goes (confirmed in the code)

- **Library page**: 14 topic searches against the registry, then up to 60 skills enriched in parallel. Each enrichment tries up to 8 candidate file URLs on GitHub before giving up, so one page load can fire several hundred outbound requests.
- **Search**: three steps in sequence — an AI call to expand the prompt into keywords, then registry searches, then a second AI call to rank. The two AI round-trips are the bulk of the wait and they run back to back.
- **Caching**: the registry, repo-tree and document caches are plain in-memory maps. They vanish on every new server instance, so most visitors pay full price. There is no HTTP caching on the responses either.
- Fonts, icons and the bundle are already fine — the app self-hosts Nebula Sans and ships no heavy media.

## Plan, in priority order

**1. Cut the fan-out (biggest win, no new services)**
- Resolve each skill's `SKILL.md` with a single request instead of walking up to 8 candidate paths: query the repo tree once per repository (already cached) and match the skill folder from it, falling back to raw paths only when the tree is unavailable.
- Cap concurrency with a small worker pool so one page load can't open hundreds of sockets at once.
- Drop library enrichment from 60 skills to the ~24 actually shown above the fold, and load the rest on demand.

**2. Make the library page feel instant**
- Give the library route a server-side response cache with a short TTL and `Cache-Control` headers, so repeat visits and other users hit a warm response.
- Stream the page shell immediately and let the skill list resolve into it, instead of blocking the whole route on the slowest GitHub request.

**3. Shorten the search wait**
- Kick off registry searches from the raw prompt in parallel with the keyword-expansion AI call, then merge — removes one full AI round-trip from the critical path.
- Show ranked results progressively rather than waiting for the whole ranking to finish.

**4. Only then consider Cloud (optional)**
- If the above still isn't enough, Cloud gives a `skills_cache` table so descriptions and markdown survive restarts, plus a shared allowlist so a download works even when it lands on a different instance than the search did (a known limitation today).
- This is the only part that needs Cloud, and it's worth doing mainly for the allowlist correctness benefit, not for raw speed.

## Verification

- Measure before/after: time-to-first-byte and full render for `/` and `/library`, and count of outbound requests per load.
- `bunx tsgo --noEmit` clean; Playwright pass over `/`, `/library`, `/licenses` with a real search and zip download.

## Confidence and risk

- High confidence that the GitHub fan-out and the double AI round-trip dominate the wait — both are visible directly in the code paths.
- Medium confidence on exact seconds saved until measured.
- Rollback: each step is an isolated change to one service module; reverting any single step restores current behaviour without touching the UI.
