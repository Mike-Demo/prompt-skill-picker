# Developers — Skill Finder

Everything an agent or developer needs to build on Skill Finder: the REST API, the MCP server, discovery documents, and versioning policy.

## REST API

- Base: `https://skills.mikedemo.dev/api/public/v1`
- No API key, no authentication. Rate limited to 60 requests/minute per IP.
- Machine-readable spec: `https://skills.mikedemo.dev/openapi.json`

Key endpoints:

- `GET /api/public/v1/skills?q={query}&limit=10` — search the catalogue
- `GET /api/public/v1/skills/{id}` — one skill's details (URL-encode the id)
- `GET /api/public/v1/skills/agent/{agent}` — curated skills for one agent
- `GET /api/public/v1/capabilities` — supported features, limits, and discovery documents

Versioned responses use a consistent envelope: success is `{ "data": ..., "meta": { ... } }`; failure is `{ "error": { "code": "...", "message": "..." } }`.

## MCP server

- Endpoint: `https://skills.mikedemo.dev/mcp` (Streamable HTTP)
- Tools: `search_skills`, `get_skill`, `list_agents`
- Server card: `https://skills.mikedemo.dev/.well-known/mcp/server-card.json`

## Discovery documents

- `/.well-known/ard.json` — Agentic Resource Discovery catalog (v1.0)
- `/.well-known/ai-catalog.json` — AI Catalog manifest
- `/.well-known/agent-card.json` — agent card
- `/.well-known/agent-skills/` — Agent Skills discovery index
- `/.well-known/api-catalog` — RFC 9727 API catalog
- `/llms.txt` — agent guide to this site

## Versioning and deprecation policy

- The current API version is **v1** (`/api/public/v1/*`). Breaking changes ship as a new versioned path; v1 keeps working.
- Unversioned paths (`/api/public/skills*`) are legacy. They still work and return the same data in a flatter shape.
- If an endpoint is ever deprecated, the deprecation will be announced on this page and in the changelog, with the replacement path documented before the old one stops working.
- The catalogue data refreshes from the upstream registry; result ordering and install counts change over time.

## Authentication

None required. See `/auth.md` for the full walkthrough.
