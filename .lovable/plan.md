# Server-side rendering toggle

Add a visible on/off switch that controls how every page loads: pre-built on the server (default) or built entirely in the visitor's browser.

## What the visitor sees

- A small switch in the site footer, labelled "Server-side rendering", with a short hint: "Off builds pages in your browser instead."
- The choice is remembered per browser and applies to every page, including the search page, library, and all agent pages.
- With it **on** (default), pages arrive fully formed from the server — fastest first paint, best for sharing and search engines.
- With it **off**, the server sends a light shell with a loading placeholder and the page assembles in the browser.
- Flipping the switch reloads the current page once so the new mode takes effect immediately.

## How it works

The remembered choice is stored in a cookie, so the server can read it on the very first request — a browser-only store would arrive too late.

- New `src/lib/render-mode.ts`: cookie name, allowed values, a browser-safe reader/writer, and a shared default of "on".
- New server function (`src/lib/render-mode.functions.ts`) reads the cookie from the incoming request during rendering and returns the mode.
- `src/routes/__root.tsx`: the root loader resolves the mode and puts it in route context. When the mode is "off", the root component wraps `<Outlet />` in `<ClientOnly>` with a neutral skeleton fallback, so no page content is produced on the server. Page titles, descriptions, and social tags still come from each route's `head()` and are unaffected in both modes.
- New `src/components/render-mode-switch.tsx` using the design system's `WaSwitch` (its own `change` event via ref, not React `onChange`), rendered inside `SiteFooter`. Writing the cookie then calling a single reload keeps server and client in agreement and avoids a hydration mismatch.
- Search, download, share links, captcha, and rate limiting are untouched; only where the first HTML is assembled changes.

## Notes and trade-offs

- This is a runtime switch layered on top of the framework's rendering, not a change to the build configuration — per-route build-time rendering flags cannot be flipped by a user at runtime.
- Turning it off makes pages slower to appear and less useful to search engines; the switch keeps "on" as the default and the hint says so.
- Verification: typecheck, then load the homepage and library with the switch on and off, confirming server HTML contains page content when on and only the shell when off.
