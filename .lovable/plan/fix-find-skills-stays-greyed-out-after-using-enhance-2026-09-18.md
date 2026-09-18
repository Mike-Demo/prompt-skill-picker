# Fix: "Find skills" stays greyed out after using Enhance

## Root cause

After a successful Enhance, the hCaptcha widget considers its token used and fires `onExpire` (and the widget visually resets). The page's `onExpire` handler sets `captchaToken` to `null`, and the "Find skills" button is disabled whenever `captchaToken` is null — even though the server deliberately remembers the verified token for 5 minutes so one captcha solve covers Enhance + the following Search. So the button greys out and the user is forced to solve the captcha again, which the 5-minute server cache was specifically built to avoid.

## Fix (src/routes/index.tsx only)

- Track a separate `captchaVerified` flag alongside the raw token:
  - Set it in `onVerify` together with the token.
  - Clear it only on a fresh widget error, on captcha reset after a completed **search**, or when the user hasn't acted within the server's 5-minute cache window (a timer started at verify time).
  - Do **not** clear it in `onExpire` — expiry after a verified solve is exactly the case the server cache covers.
- "Find skills" (and `submit`) gate on `captchaVerified` instead of `captchaToken !== null`; the last known token is still sent, and the server accepts it from its cache.
- Enhance keeps the flag set so the button stays enabled; a completed search still resets the widget and clears the flag, forcing a fresh solve for the next search (unchanged behavior).
- If a search with a cached token is rejected anyway (edge cases: cache evicted, worker restart), the existing error callout already tells the user to confirm the captcha again, and the flag is cleared so the widget must be re-solved.

## Verification

- `bunx tsgo --noEmit` clean.
- Playwright: type a prompt, solve captcha, click Enhance, confirm the textarea updates and "Find skills" stays enabled, click it, confirm results render without a second captcha solve. Also confirm a plain search (no enhance) still requires and consumes one solve as today.

## Rollback

Single-file change; revert `src/routes/index.tsx`.
