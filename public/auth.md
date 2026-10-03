---
title: "Authentication — Skill Finder"
description: "How AI agents authenticate with the Skill Finder API and MCP server."
canonical: "https://skills.mikedemo.dev/auth.md"
last-updated: "2026-10-03"
---

# Authentication — Skill Finder

Skill Finder's agent surfaces are public and read-only. There are no API keys, no OAuth flows, and no accounts to create.

## Discover

- REST API: `GET https://skills.mikedemo.dev/api/public/v1/skills?q=react&limit=10`
- MCP server: `https://skills.mikedemo.dev/mcp` (Streamable HTTP)
- Machine-readable spec: `https://skills.mikedemo.dev/openapi.json`
- This file: `https://skills.mikedemo.dev/auth.md`

## Pick a method

There is exactly one method: **no authentication**. Every agent-facing endpoint is anonymous and read-only.

- `GET /api/public/v1/skills` — search the catalogue
- `GET /api/public/v1/skills/{id}` — one skill's details (URL-encode the id; it contains slashes)
- `GET /api/public/v1/skills/agent/{agent}` — curated skills for one agent
- `GET /api/public/v1/capabilities` — supported features, limits, and discovery documents
- `POST /mcp` — MCP tools `search_skills`, `get_skill`, `list_agents`

## Register

Nothing to register. No developer portal accounts, no key issuance.

## Claim / Exchange / Use the access_token

Not applicable — there are no tokens. Call the endpoints directly.

## Errors

Versioned API responses use a consistent envelope. Success: `{ "data": ..., "meta": { ... } }`. Failure: `{ "error": { "code": "...", "message": "..." } }` with an appropriate HTTP status. There is no `WWW-Authenticate` challenge because no credentials are ever required.

## Rate limits

Anonymous use is rate-limited per IP. Exceeding a limit returns HTTP `429` with a `Retry-After` header; back off and retry. See `https://skills.mikedemo.dev/api/public/v1/capabilities` for current limits.

## Revocation

Not applicable — there is nothing to revoke.

## Interactive AI search

The homepage's AI-ranked search (`POST /api/search`, `POST /api/enhance`) is a separate, visitor-facing feature. It is rate-limited per visitor and optionally accepts the visitor's own OpenAI key, which is sent per request, never logged, and never stored. Agents should prefer the keyless JSON API or MCP server above.
