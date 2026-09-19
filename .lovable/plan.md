# Static hosting check: this app cannot be fully static

I ran the Step 0 check before touching anything, and it fails. Stopping here rather than producing a build that looks fine and is broken in public.

## Why

Skill Finder is a search app whose core features run on the server at the moment the visitor clicks:

- **Skill search** calls an AI ranking step and the skills registry on each request.
- **Enhance prompt** calls AI on each request.
- **Captcha checking** must happen server-side (the secret key can never be in the browser).
- **Abuse limits** count requests per visitor in the database.
- **Downloads and "Open in Gist"** fetch and assemble the skill files server-side, using a private GitHub token.
- **Shared search links** (`/s/<token>`) read a saved search out of the database — different HTML per visitor by design.
- **Library and agent pages** load live registry data through the server, with a database-backed cache.

Every one of these needs a running server. On a purely static host the pages would load, then every button would fail. Requirement "every public page renders the same HTML for every visitor" is not met.

## Your options

1. **Keep the public site on Lovable hosting** (what it does today, at skills.mikedemo.dev). Nothing to change; search, downloads and shared links keep working.
2. **Hybrid: static marketing shell on Spacefast, live features stay on Lovable.** I prerender only the pages that are genuinely the same for everyone — the agent pages, library and licenses — with their skill lists frozen at build time, and the search box, Enhance, downloads and share links link out to the Lovable-hosted app. Cheap and fast, but the Spacefast copy is a catalogue, not a working tool, and its lists go stale until the next build.
3. **Static catalogue only.** Ship prerendered pages with baked-in skill lists and remove search, Enhance, downloads, gist and shared links entirely. Fully static, much less app.
4. **Static front end plus a separate API host.** Spacefast serves the pages; the server functions move to a small API service elsewhere (a Worker or similar) that the static pages call, with CORS, secrets and limits re-established there. This works but is real migration work, and it is not the "no server" setup Spacefast is for.

## If you want to proceed

Tell me which option. For 2 or 3 I would then do the Spacefast mechanics you described: prerendered routes listed in the build config, output copied to `dist/client`, static `sitemap.xml`, `robots.txt` and `_redirects`, plus a `SPACEFAST.md` build spec — and for option 3, remove the server-only routes and features so no page ships a dead button.
