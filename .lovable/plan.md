# Skill Finder

A single-page app: describe what you want to do, get AI-ranked skill suggestions from the public skills.sh registry, tick the ones you want, and download them as a zip of `.md` files.

Note: I did not run the `npx skills use ... find-skills` command. Fetching and executing instructions from a remote repo isn't something I'll do blindly. Instead I read the CLI's source directly and confirmed the real search API it uses, so the app talks to the same registry the CLI does.

## What was verified

- `npx skills find` calls `https://skills.sh/api/search?q=...&limit=...` (source: `src/find.ts` in vercel-labs/skills).
- A live call returns `{ skills: [{ id, skillId, name, installs, source }] }` — e.g. `vercel-labs/agent-skills/vercel-react-best-practices`, 684k installs.
- The registry response does not include skill descriptions or bodies; those come from the source GitHub repo's `SKILL.md`.

## User flow

1. User types a prompt: "help me write better React components and review PRs".
2. App shows a ranked list of suggested skills — name, owner/repo, install count, one-line description, "why this matches", and a link to the skill on GitHub.
3. Each row has a checkbox; a sticky footer shows "N selected — Download zip".
4. Download produces `skills.zip` containing flat files: `vercel-react-best-practices.md`, etc. (each file is the skill's full `SKILL.md`).

## How it works

```text
prompt ──> [server fn] AI expands prompt into 3-6 search queries
       ──> skills.sh /api/search per query (deduped, merged)
       ──> fetch each candidate's SKILL.md from GitHub raw
       ──> AI ranks + writes match rationale
       ──> ranked list to UI
selection ──> [server fn] returns chosen SKILL.md contents
          ──> client zips with JSZip and triggers download
```

### Technical details

- `src/lib/skills.functions.ts` — two `createServerFn` endpoints:
  - `searchSkills({ prompt })`: AI query expansion, registry search, markdown fetch, AI ranking (structured output with Zod: `skillId`, `score`, `reason`).
  - `fetchSkillMarkdown({ ids })`: returns `{ filename, content }[]` for the ticked skills.
- `src/lib/skills-registry.server.ts` — registry client and GitHub `SKILL.md` resolver. Resolves the file path by reading the source repo's git tree once per repo (cached in-memory) and matching `**/<skillId>/SKILL.md`, since layouts differ between repos. Skills whose markdown can't be resolved are still listed, marked "no markdown available", and excluded from selection.
- `src/lib/ai-gateway.server.ts` — Lovable AI provider helper; AI ranking uses Lovable AI (no key setup needed from you).
- Zip is built client-side with `jszip` in `src/lib/zip.ts`, so no backend file handling.
- UI in `src/routes/index.tsx` (replaces the placeholder home page) using shadcn/ui: prompt textarea + search button, skeleton loading state, result cards with `Checkbox`, sticky selection bar, empty/error states. Mobile-first, responsive.
- Errors from the AI gateway (rate limit, credits) are surfaced in the UI verbatim rather than swallowed.
- Route-level `head()` with an app-specific title and description.

### Risks and limits

- The registry API is undocumented and could change shape; the fetch is defensive and shows a clear error if it does.
- Ranking quality depends on the registry's fuzzy search finding candidates at all; query expansion mitigates but doesn't eliminate this.
- Rollback: the whole feature is additive across the listed new files plus `src/routes/index.tsx`; reverting those restores the blank template.
