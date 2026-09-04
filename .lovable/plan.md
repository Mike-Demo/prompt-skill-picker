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
| Grok | no brand icon — use a solid fallback (`fa-bolt`) |
| Perplexity | no brand icon — use a solid fallback (`fa-magnifying-glass`) |
| Superhuman Go | no brand icon — use a solid fallback (`fa-envelope`) |

Grok, Perplexity and Superhuman have no Font Awesome brand glyph at any tier, so they get neutral solid icons rather than a hand-drawn logo substitute. If you would rather they carry real logos, that needs their official SVG marks supplied separately.

Icons render at the same size and inherit the button's text color, so the buttons keep their current look — just with a mark in front of the label.

## Technical notes

- `src/routes/index.tsx`: delete the `<Link to="/claude-skills">` block in the header and drop the now-unused `Sparkles` import only if the Enhance button no longer needs it (it does, so the import stays).
- `src/components/agent-nav.tsx`: add an `icon` field to each entry in the `LINKS` array and render `<i className={icon} aria-hidden="true" />` before the label.
- No changes to routes, data loading, or the sitemap.
