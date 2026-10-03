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
