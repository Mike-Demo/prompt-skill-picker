# Fix search and grow the library

## What's actually wrong

The upstream skills registry (`skills.sh/api/search`) is currently not responding. Verified just now:

- `https://skills.sh/api/search?q=react` never returns — the connection hangs until it is killed (tested repeatedly, with and without redirects, on both `skills.sh` and `www.skills.sh`). The registry's own homepage also loads too slowly to finish a search.
- `https://skills.sh/` itself answers (redirects to `www`), and GitHub's API answers normally, so this is specific to the registry's search endpoint, not general connectivity.
- The live library page at `skills.mikedemo.dev/library` currently renders **zero** skill cards after 20 seconds, with no error message and no console errors.

Our code makes that outage look like a broken app:

- `searchRegistry` calls `fetch` with no timeout, so a hanging registry means the search request spins forever — the spinner/skeletons never resolve and no error is ever shown.
- Every failed topic query is swallowed (`.catch(() => [])`), so a partial or empty registry response silently becomes a short library instead of an error.
- The library is cached only in the worker's memory for 30 minutes; when the process recycles, a bad upstream window leaves the page empty.

The "only 14 skills" number is a second, separate limit: the library is built from 10 topic queries, deduped, capped at 24 candidates, then filtered down to only those whose `SKILL.md` could be resolved on GitHub. Realistically that lands in the mid-teens even on a good day.

## What to change

### 1. Never hang, always explain

- Give every registry and GitHub fetch an explicit timeout (AbortSignal), with one short retry on timeout/5xx.
- When a search can't reach the registry, surface a plain message ("The skills registry isn't responding right now — try again in a minute") instead of endless skeletons, plus a retry button.
- Same treatment on the library and each agent page, so an empty result reads as "registry unavailable", not "no skills".

### 2. Survive registry outages with a stored cache

- Add a `registry_cache` table in the backend keyed by query, holding the registry response plus a fetched-at timestamp.
- Reads go: in-memory → stored cache (fresh) → live registry → on failure, stale stored cache with a small "showing recent results" note.
- This makes the library and agent pages keep working through upstream outages and cuts registry/GitHub traffic.

### 3. A bigger library

- Broaden the topic list (roughly 24 topics instead of 10) and raise the per-query limit.
- Raise the entry cap so the library targets ~60-80 skills rather than 24 candidates.
- Keep the install-count ranking and the "Most used / A-Z" toggle unchanged; add "N skills" to the header so the size is visible.
- Skills whose markdown can't be resolved stay excluded from download but no longer silently shrink the count — the resolver also gets the stored cache, so a GitHub hiccup doesn't drop them.

## Technical notes

- `src/lib/skills-registry.server.ts`: add `fetchWithTimeout` (timeout + single retry), route `searchRegistry` and the GitHub tree/raw fetches through it, and back both with the stored cache. Distinguish "no results" from "request failed" by throwing a typed `RegistryUnavailableError`.
- `src/lib/skills-library.server.ts`: expand `TOPICS`, raise `MAX_ENTRIES`, and let `loadLibrary` return partial results with an `unavailable` flag rather than an empty array.
- `src/lib/skills.functions.ts`: library/agent/search responses gain a status field so the UI can tell the difference between empty and unavailable.
- `src/routes/index.tsx`, `src/routes/library.tsx`, `src/components/agent-skills-page.tsx`: render the unavailable state with `WaCallout variant="warning"` and a retry action, using existing tokens only.
- Migration for `public.registry_cache` with GRANTs; it holds only public registry data and is written from the server via the service role, with no anon read policy.

## Risk and rollback

The registry outage is upstream — these changes make the app degrade gracefully and stay usable from cache, but live-fresh results depend on `skills.sh` recovering. Every change is additive to the listed files plus one migration; reverting those files restores current behavior.
