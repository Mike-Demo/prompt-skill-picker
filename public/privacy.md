# Privacy — Skill Finder

Skill Finder is designed to collect as little as possible. There are no accounts, no sign-ups, and no advertising profiles.

## What we don't collect

We don't ask for your name, email, or any account details. The public JSON API and the MCP server need no API key, so there are no credentials to store, leak, or revoke. If you use the optional "bring your own OpenAI key" mode for AI-ranked search, your key lives only in your browser's memory, is sent per request, and is never logged or stored on our servers.

## What keeps the service running

Two lightweight things: (1) private, self-hosted analytics (umami-lite) recording anonymous page views — no cross-site tracking, no ad-tech; and (2) per-IP rate-limit counters so one visitor can't degrade the service for everyone else. Rate-limit data expires automatically (windows older than one day are deleted).

## Your browser

Recent searches and UI preferences are stored in your browser's localStorage and never sent to us. Clearing your browser storage removes them.

## Third parties

Skill listings link out to skills.sh and GitHub; following those links is subject to their privacy policies. If you enable the OpenAI-key mode, your prompts go directly to OpenAI's API under their terms.

## Contact

hey.demo@mikedemo.email with any privacy question.
