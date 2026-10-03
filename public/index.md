---
title: "Skill Finder — discover and bundle agent skills"
description: "Search the open agent-skills registry, get AI-ranked suggestions, and download picks as a zip. Free JSON API and MCP server, no key required."
canonical: "https://skills.mikedemo.dev/"
last-updated: "2026-10-03"
---

# Skill Finder — discover and bundle agent skills

Skill Finder helps people discover, compare, and download open "agent skills" (SKILL.md instruction files) for AI coding agents such as Claude Code, Cursor, GitHub Copilot, and ChatGPT. Skills come from the open skills registry (skills.sh) and GitHub.

Describe what you want your agent to do. We search the open skills registry, rank the matches, and bundle the ones you pick into a zip of markdown files.

## For AI agents

- llms.txt: https://skills.mikedemo.dev/llms.txt
- Agent API docs: https://skills.mikedemo.dev/docs/api
- OpenAPI spec: https://skills.mikedemo.dev/openapi.json
- MCP server: https://skills.mikedemo.dev/mcp (Streamable HTTP, no authentication; tools: `search_skills`, `get_skill`, `list_agents`)
- REST search: https://skills.mikedemo.dev/api/public/v1/skills?q=react&limit=10
- One skill: https://skills.mikedemo.dev/api/public/v1/skills/mattpocock%2Fskills%2Fgrill-me (URL-encode the id)
- Skills for one agent: https://skills.mikedemo.dev/api/public/v1/skills/agent/claude
- Capabilities and limits: https://skills.mikedemo.dev/api/public/v1/capabilities
- Auth model: https://skills.mikedemo.dev/auth.md (no authentication — public read-only API)
- Pricing: https://skills.mikedemo.dev/pricing.md (free, no paid tiers)
- Agent discovery: https://skills.mikedemo.dev/.well-known/agent-skills/index.json
- Agent card: https://skills.mikedemo.dev/.well-known/agent-card.json
- MCP server card: https://skills.mikedemo.dev/.well-known/mcp/server-card.json
- Agentic Resource Discovery: https://skills.mikedemo.dev/.well-known/ard.json

## Browse

- Skill library: https://skills.mikedemo.dev/library
- Claude skills: https://skills.mikedemo.dev/claude-skills
- Cursor skills: https://skills.mikedemo.dev/cursor-skills
- GitHub Copilot skills: https://skills.mikedemo.dev/github-copilot-skills
- ChatGPT skills: https://skills.mikedemo.dev/chatgpt-skills
- Microsoft Copilot skills: https://skills.mikedemo.dev/mcp-skills
- Grok skills: https://skills.mikedemo.dev/grok-skills
- Perplexity skills: https://skills.mikedemo.dev/perplexity-skills
- Superhuman Go skills: https://skills.mikedemo.dev/superhuman-go-skills
- WordPress skills: https://skills.mikedemo.dev/wordpress-skills

## About

Skill Finder is a free tool by Mike Demopoulos (MikeDemo). More: https://skills.mikedemo.dev/about
