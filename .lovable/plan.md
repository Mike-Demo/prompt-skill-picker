# Switch the app typeface to Nebula Sans

Nebula Sans is a humanist sans-serif released under the SIL Open Font License, self-hostable via the official Fontsource package — no external font CDN needed.

## What changes

- Every piece of text in the app (headings, prompt box, skill cards, footer, licenses page) renders in Nebula Sans instead of the current default system sans stack.
- Icons, spacing, colors and layout stay exactly as they are.

## How it's done

1. Install `@fontsource/nebula-sans` (weights 400, 500, 600, 700 — the ones the UI actually uses).
2. Add its `@import` lines to the existing top import block in `src/styles.css`, above `@theme`.
3. Define `--font-sans: "Nebula Sans", ui-sans-serif, system-ui, sans-serif;` inside the `@theme inline` block so every Tailwind `font-sans` utility and the base body font resolve to it.
4. Add a Nebula Sans credit to the `/licenses` page — a new typeface section in `src/lib/licenses.ts` naming Nebula Entertainment & Broadcasting LLC, SIL Open Font License 1.1, linking to nebulasans.com, with a note that it is based on Adobe's Source Sans — and render it on `src/routes/licenses.tsx` alongside the existing credit lists.

No changes to `__root.tsx`, no remote stylesheet link, and the font is bundled so there's no flash of unstyled text from a third-party request.

## Verification

- `bunx tsgo --noEmit` stays clean.
- Playwright screenshot of `/`, `/library` and `/licenses` to confirm the new typeface renders and nothing reflows badly.

## Rollback

Revert the two edited files and uninstall the package; the app returns to the default sans stack.
