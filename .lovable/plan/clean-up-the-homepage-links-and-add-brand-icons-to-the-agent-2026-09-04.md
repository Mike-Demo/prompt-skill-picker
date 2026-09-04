# Clean up the homepage links and add brand icons to the agent buttons

## What changes

1. Remove the "Claude Code skills" link from the homepage header. The agent button row below it already covers Claude, so the link is a duplicate. The "Browse the full skill library" link stays.

2. Give each agent button its own brand icon where Font Awesome has one.

Font Awesome Free 7.3.1 is already loaded sitewide, and its brands family (free) ships icons for four of the seven agents:

| Agent | Icon |
| --- | --- |
| Claude | `fa-brands fa-claude` |
| ChatGPT | `fa-brands fa-openai` |
| GitHub Copilot | `fa-brands fa-copilot` (or `fa-github`) |
| Microsoft Copilot | `fa-brands fa-microsoft` |
| Grok | `fa-brands fa-x-twitter` (Grok is xAI / X's model; no standalone "grok" glyph) |
| Perplexity | user-uploaded SVG (you'll provide the file) |
| Superhuman Go | user-uploaded SVG (you'll provide the file) |

Perplexity and Superhuman will use your uploaded SVGs instead. Place each under `src/assets/` (e.g. `src/assets/perplexity.svg`, `src/assets/superhuman.svg`) and import them so they inherit the button's text color.

Icons render at the same size and inherit the button's text color, so the buttons keep their current look — just with a mark in front of the label.

## Technical notes

- `src/routes/index.tsx`: delete the `<Link to="/claude-skills">` block in the header and drop the now-unused `Sparkles` import only if the Enhance button no longer needs it (it does, so the import stays).
- `src/components/agent-nav.tsx`: add an `icon` field to each entry in the `LINKS` array (Font Awesome class string for the five with glyphs; the imported Perplexity and Superhuman SVG components) and render it before the label. Both SVGs are imported from `src/assets/` and rendered inline, sized to match the Font Awesome icons and inheriting the button's text color.
- Place the uploaded SVGs under `src/assets/perplexity.svg` and `src/assets/superhuman.svg`.
