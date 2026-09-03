# Footer + attribution page

Bring the PretendPro Office Suite footer into Skill Finder, and give the favicon its required CC0 credit.

## Footer

A new shared footer component with the same content and Font Awesome icons as PretendPro:

- "Made by MikeDemo" and "© {current year}"
- Open Source link (Font Awesome code icon) pointing to a new in-app `/licenses` page
- Social links: LinkedIn, X, Threads — same URLs, same brand icons, same hover colors, opening in a new tab

Differences from PretendPro, because this app is structured differently:

- No locale prefix on links (this app has no locales), so the license link is `/licenses`
- Privacy and Terms links are dropped — this app has no such pages and you asked for copyright, socials, and the license link

Because the icons must match exactly, the Font Awesome stylesheet is loaded from the CDN in the root route's head.

Placement: rendered once in the root layout below the page content, so it appears on the search page, the library page, and the new licenses page. On the search page the footer sits above the sticky "N selected — Download zip" bar so it is never covered.

## Licenses page (`/licenses`)

A new page, styled like the rest of the app, with:

- **Assets** — the favicon credit: "Human Resources 4" collection from SVG Repo, CC0 License, uploader SVG Repo, with links to the collection, the license, and svgrepo.com
- **Open source libraries** — the project's actual runtime dependencies (React, TanStack Router/Start/Query, Tailwind CSS, shadcn/ui + Radix UI, lucide-react, JSZip, Vercel AI SDK, Zod, hCaptcha React component) each with author and license, linking to the license source
- **Data source** — the skills.sh registry and GitHub raw content the app reads skill files from
- A back link to the search page

The page gets its own title/description metadata and stays `noindex` like the rest of the app.

## Technical notes

- New `src/components/site-footer.tsx` (Font Awesome `<i>` icons, `<footer>` element, `aria-label`s on every link, `rel="noopener noreferrer"` on externals)
- New `src/routes/licenses.tsx` with `createFileRoute("/licenses")`; license data lives in a typed array in `src/lib/licenses.ts` so the page stays presentational
- `src/routes/__root.tsx`: add the Font Awesome CDN `<link>` to `head().links`, and render `<SiteFooter />` after `<Outlet />`
- `src/routes/index.tsx`: bottom padding adjusted so the sticky download bar does not overlap the footer
- Verify with `bunx tsgo --noEmit` and a browser check of `/`, `/library`, and `/licenses`

## Rollback

All additive except three small edits (`__root.tsx`, `index.tsx` padding). Reverting this change removes the footer and the licenses route; nothing else in the app depends on them.
