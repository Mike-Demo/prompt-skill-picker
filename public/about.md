# About Skill Finder

Skill Finder helps people discover, compare, and download open "agent skills" — SKILL.md instruction files that teach AI coding agents (Claude Code, Cursor, GitHub Copilot, ChatGPT, and others) how to do specific tasks well.

## How it works

Describe what you want your agent to do. Skill Finder searches the open skills registry (skills.sh) and GitHub, ranks the matches, and lets you bundle the ones you pick into a single zip of markdown files you can drop into your agent's skills directory.

Every skill in the catalogue is ranked by install count from the open registry, so the most battle-tested instructions float to the top. Each listing shows a one-command install string and a link to the skill's SKILL.md source.

## For AI agents

Skill Finder is built to be used by agents as well as humans. A free, read-only JSON API and an MCP server expose the whole catalogue with no API key and no authentication. Machine-readable entry points live in `llms.txt`, `/.well-known/agent-skills/`, and `/openapi.json`.

## Who makes it

Skill Finder is made by Mike Demopoulos (Demo) — https://mikedemo.dev. The source is public at https://github.com/Mike-Demo/prompt-skill-picker. Demo's own agent skills collection (27 skills: job search, partnerships, content, dev workflows) is at https://github.com/Mike-Demo/agent-skills.

## Contact

- Email: hey.demo@mikedemo.email
- GitHub: https://github.com/Mike-Demo/prompt-skill-picker
