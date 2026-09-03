# Shareable searches, recent history, and open-in-CodePen/Gist

## What you get

1. Every search is saved with its prompt and ranked results, and gets a short shareable link like `/s/ab12cd34` that anyone can open for 72 hours. Opening it replays the exact prompt and results — no AI call, no captcha, no cost.
2. Under the search box, a "Recent searches" list of your own past searches (kept in your browser), each linking to its shared URL.
3. On every skill card, two extra actions: **Open in CodePen** and **Open in Gist**, which put the skill's `SKILL.md` into a live CodePen pen or a real public GitHub Gist.

## How it works

### Saved searches

A new `saved_searches` table stores the prompt, the ranked result list, a random share token, and an expiry 72 hours out. After a successful search the server writes the row and returns the token; the page updates its URL to the share link so copying the address bar just works, and a "Copy share link" button sits next to the results header.

Opening `/s/<token>` loads the stored row through a public read (rate-limited, no captcha) and renders the same result cards, including download and CodePen/Gist actions. Expired or unknown tokens show a friendly "this link has expired — run a new search" state with a link back to the search page. Expired rows are cleaned up opportunistically on write, so nothing accumulates.

Skill ids from a shared search are re-added to the download allowlist when the shared page loads, so the zip download keeps working from a shared link.

### Recent searches

The browser keeps the last 8 searches (prompt + token + timestamp) in local storage, filters out anything older than 72 hours, and shows them as compact links. A "Clear" control empties the list. Nothing personal leaves the browser.

### Open in CodePen

CodePen accepts a prefilled pen via a POST form, so an "Open in CodePen" button submits the skill's markdown as the pen content (markdown rendered in the HTML pane with the skill name as the title). This is a client-side form post to CodePen — no server work, no secrets.

### Open in Gist

GitHub removed anonymous gist creation, so this needs a GitHub token you provide. A server function fetches the skill's `SKILL.md`, creates a public gist named `<skill-id>.md` under the token's account, and returns the gist URL, which opens in a new tab. It is rate-limited like the download path (10/min) and only accepts skill ids the server already surfaced. If the token is missing, the button shows a short "not configured" message instead of failing silently.

I'll request the token as a secret named `GITHUB_GIST_TOKEN` (a fine-grained or classic PAT with only the `gist` scope) before wiring this up.

## Technical details

- Migration: `public.saved_searches` (`id uuid pk`, `token text unique`, `prompt text`, `results jsonb`, `created_at`, `expires_at`), index on `token` and on `expires_at`; `GRANT ALL ... TO service_role` only, RLS enabled with no permissive policies — all access goes through server functions using the admin client (consistent with the existing abuse tables).
- `src/lib/saved-search.server.ts` — `saveSearch(prompt, results)` → token, `loadSavedSearch(token)` → `{ prompt, results }` or null, plus expiry pruning.
- `src/lib/skills.functions.ts` — `searchSkills` also returns `{ token, results }`; new `getSavedSearch({ token })` (GET, `guard("library")`-style limit, no captcha) and `createSkillGist({ id })` (POST, `guard("download")`).
- `src/lib/gist.server.ts` — `createGist(filename, content)` against `https://api.github.com/gists` with `GITHUB_GIST_TOKEN` read inside the handler.
- `src/routes/s.$token.tsx` — new route reusing a shared `SkillResultCard` component extracted from `src/routes/index.tsx`; `noindex, nofollow`, head title includes the prompt.
- `src/lib/recent-searches.ts` — local-storage read/write/prune helpers (client-safe, no side effects at import).
- `src/components/skill-actions.tsx` — CodePen form post + Gist button.
- Typecheck gate `bunx tsgo --noEmit`, then a Playwright pass: run a search, follow the share link in a fresh context, confirm results render without an AI call.

## Rollback

All additive. Reverting the new files plus the `searchSkills` return-shape change and the card extraction in `src/routes/index.tsx` restores current behaviour; the migration is additive and can be left in place or dropped.

## Assumptions and risks

- Fact: the existing search returns `SkillSuggestion[]`; storing it verbatim as JSON is enough to replay a result page.
- Fact: CodePen's prefill API is a documented POST form; no key needed.
- Assumption (medium confidence): a `gist`-scope PAT is acceptable to you as the gist owner. All gists created by the app will show under that account.
- Risk: markdown in a CodePen pen is not "runnable" — it's a viewable/editable snippet. If you'd rather it render as HTML, say so and I'll convert the markdown before posting.
