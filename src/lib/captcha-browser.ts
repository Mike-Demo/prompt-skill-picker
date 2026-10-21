let verifiedUntil = 0;
let pending: Promise<void> | null = null;

export function captchaVerified(): void {
  verifiedUntil = Date.now() + 4 * 60 * 1000;
}

export function ensureCaptcha(): Promise<void> {
  if (Date.now() < verifiedUntil) return Promise.resolve();
  if (pending) return pending;
  pending = new Promise<void>((resolve, reject) => {
    window.dispatchEvent(new CustomEvent("skillfinder:captcha", {
      detail: { resolve, reject },
    }));
  }).finally(() => { pending = null; });
  return pending;
}