# Hosting Skill Finder on Spacefast

Step 0 (the static check) fails as written, but Spacefast is not static-only — so there is a real path. Here is what I found and what I recommend.

## Why a pure static build would be broken

Skill Finder's core features run at the moment a visitor clicks:

- Skill search (AI ranking + live skills registry), and Enhance prompt (AI)
- Captcha checking, which must stay server-side because the secret key can never be in the browser
- Per-visitor abuse limits, counted in the database
- Downloads and "Open in Gist", which assemble skill files server-side using a private GitHub token
- Shared search links (`/s/<token>`), which read a saved search from the database — different content per visitor by design
- Library and agent pages, which load registry data through the server with a database-backed cache

Prerendering all of these produces pages that load and then fail on every button. So "same HTML for every visitor" is not met.

## What Spacefast actually supports

Static serving, plus **Functions** — a worker shipped alongside the site — plus its own database, environment variables and crons. But the worker only comes from one of three layouts: an OpenNext build of a Next.js app, a hand-written `handler.ts` at the root, or a `functions/` folder of route files. Spacefast lists TanStack Start as a **static** framework (output `dist/client`); there is no adapter that runs this app's server build, and publishing an output that contains a compiled server bundle is rejected outright.

So the app's existing server code cannot simply be lifted over. The server side has to be rewritten in the shape Spacefast's Functions expects.

## Your options

**1. Recommended — leave the public site on Lovable hosting.** It already works end to end at skills.mikedemo.dev, with no migration and nothing to keep in sync.

**2. Static pages on Spacefast plus a Spacefast worker (full features, real work).** Prerender all public pages into `dist/client`, and rewrite each server action as a route file under `functions/` — search, enhance, captcha check, downloads, gist, saved searches, library and agent data. The page code switches from Lovable's built-in server calls to plain HTTP calls to those routes. Keys (AI, captcha, GitHub) move into Spacefast environment variables, and the worker needs its outbound-HTTP capability turned on. The database can either stay on Lovable Cloud (reached over HTTPS from the worker) or move to Spacefast's own database, which means porting the saved-searches, cache and rate-limit tables. This is a genuine migration, not a config change: expect the search, download and share flows to need re-verification afterwards, and two copies of the backend logic if Lovable stays the editing environment.

**3. Static catalogue only on Spacefast (cheap, much less app).** Prerender the agent pages, library and licenses with their skill lists frozen at build time, and remove search, Enhance, downloads, gist and shared links from that copy so nothing ships a dead button. Lists go stale between builds.

**4. Hybrid.** Same prerendered catalogue on Spacefast, but the search box and download buttons link out to the Lovable-hosted app instead of being removed. Fastest to ship; the Spacefast copy is a shop window.

## If you pick 2, 3 or 4

The mechanics you specified apply to all three: every public non-parameterized route listed under `tanstackStart.pages` with `prerender: { enabled: true, autoStaticPathsDiscovery: false }`; keep the normal SSR/Nitro build (never `nitro: { preset: "static" }`); a small idempotent `scripts/copy-static-output.mjs` that copies `.output/public` into `dist/client`, wired into the build script; static `public/sitemap.xml`, `robots.txt` pointing at it, and `public/_redirects` with `/*  /index.html  200`; the existing generated sitemap route deleted; head metadata confirmed inside each route's `head()`; and a `SPACEFAST.md` recording install command, build command and output directory. Then typecheck, full build, check one `index.html` per route, and open each prerendered page to confirm it renders and query-param state restores after hydration.

Two Spacefast specifics worth noting: `@spacefast/vite-plugin/tanstack-start` is their own entry point for this framework and can compile `_redirects`/`_headers` and fail the build if it would ship nothing usable; and prerendered pages must be checked for a build that writes every file and then hangs — a leftover timer (module-scope timers, TanStack Query `gcTime`, module-scope clients) holds the build process open, fixed with lazy creation, `.unref()`, or a `TSS_PRERENDERING` guard.

Tell me which option and I'll build it. Nothing touches GitHub, DNS, or publishing.
