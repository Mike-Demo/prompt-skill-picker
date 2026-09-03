# Enhance Prompt button (behind hCaptcha)

## Goal

Add an "Enhance with AI" button next to "Find skills" that rewrites the user's draft prompt into a clearer, more detailed search brief before they submit it. Like search, enhancing is a paid AI call, so it is gated behind the same hCaptcha check.

## Behavior

- Button sits next to "Find skills" (with a sparkle icon), enabled only when the prompt has 3+ characters **and** the captcha is solved — same gating as search.
- Clicking it calls AI to rewrite the prompt (more specific: names the user, tasks, inputs/outputs, constraints) and replaces the textarea content with the improved version. The user can still edit it before searching.
- The button shows a spinner while enhancing; gateway errors (rate limit, credits) surface verbatim in the same error box search uses.
- Captcha UX: hCaptcha tokens are single-use, and today a search consumes the token and resets the widget. To avoid forcing the user to solve the captcha twice (once to enhance, once to search), the server remembers a successfully verified token for 5 minutes, so **one captcha solve covers Enhance + the following Search**. A fresh search without enhancing still works exactly as today.

## Changes

1. **`src/lib/captcha.server.ts`** — add a small in-memory cache of recently verified tokens (token → expiry, ~5 min TTL, pruned on write). `verifyCaptchaToken` checks the cache first and records new successes. No interface change for callers.
2. **`src/lib/skills-ranking.server.ts`** — add `enhancePrompt(prompt)`: one AI call (existing gateway provider and model) with a system prompt that rewrites the draft into a sharper skill-search brief, returning plain text (no structured output needed). Result trimmed and length-capped.
3. **`src/lib/skills.functions.ts`** — add `enhancePrompt` server function: input `{ prompt (3–2000 chars), captchaToken }`, verifies the captcha (cache-aware), returns `{ enhanced: string }`.
4. **`src/routes/index.tsx`** — add the "Enhance" button with its own `useMutation`; on success set the textarea to the enhanced text; disable both buttons while either mutation is pending; surface enhance errors in the existing error area.

## Technical notes

- Token cache lives in module scope of `captcha.server.ts`; tokens are hashed before storage and never logged.
- The cache only affects the 5-minute window between enhance and search — it does not weaken protection, since every uncached token still goes through hCaptcha siteverify, and expired entries are dropped.
- No new dependencies; reuses the existing AI gateway helper, model, and UI components.
- Verification: `bunx tsgo --noEmit`, then a Playwright run through the full flow — solve captcha, enhance, confirm the textarea updates, search with the same solve, confirm results render.

## Rollback

Fully additive: revert the four touched files to restore current behavior.
