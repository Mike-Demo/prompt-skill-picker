---
title: "Pricing — Skill Finder"
description: "Skill Finder pricing: free, no paid tiers."
canonical: "https://skills.mikedemo.dev/pricing.md"
last-updated: "2026-10-03"
---

# Pricing — Skill Finder

Skill Finder is free. There are no paid tiers, no usage-based billing, and no premium features.

## Free — $0

- Unlimited browsing and searching of the skill library
- Unlimited use of the read-only JSON API (`/api/public/v1/*`) — no key required
- Unlimited use of the MCP server (`/mcp`) — no authentication required
- Download skill bundles as zip files

Fair-use rate limits apply per IP to keep the service stable for everyone; exceeding a limit returns HTTP `429` with a `Retry-After` header.

The optional AI-ranked homepage search is also free, rate-limited per visitor (30 requests/minute, 500/day). It can optionally use the visitor's own OpenAI key, which is sent per request, never logged, and never stored.

## Feature breakdown

| Capability | Included |
|---|---|
| Browse and search the skill library | Yes |
| Read-only JSON API (`/api/public/v1/*`), no key | Yes |
| MCP server (`/mcp`), no auth | Yes |
| Download skill bundles as zip | Yes |
| Agent Skills discovery index (`/.well-known/agent-skills/`) | Yes |
| Machine-readable docs (`llms.txt`, `openapi.json`, `*.md`) | Yes |
| Accounts, seats, or API keys to manage | None — nothing to manage |

## Limits

- Public API: 60 requests/minute per IP (see `/api/public/v1/capabilities` for current limits)
- AI-ranked search: 30 requests/minute, 500/day per visitor
- Catalogue size: 1,200+ skills, refreshed from the upstream registry
- Downloads: skill bundles are generated per request as zip files

## Paid tiers

There are none — no Pro, Team, or Enterprise plans, and no usage-based billing. If that ever changes, this page and the `/pricing` page will describe the tiers before any charges exist.

## Questions

- **Do I need a credit card?** No — there is nothing to buy.
- **Can I use the API in a commercial product?** Yes. See the [Licenses](/licenses) page for the terms that apply to the site content and the catalogue data.
- **Will the free API stay free?** The public read-only API and MCP server are free with no announced end date.
