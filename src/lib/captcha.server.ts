// hCaptcha server-side verification.
// Uses HCAPTCHA_SECRET_KEY / HCAPTCHA_SITEKEY when configured; falls back to
// hCaptcha's official test pair (always passes) so local development works
// without keys.
const TEST_SECRET = "0x0000000000000000000000000000000000000000";
const TEST_SITEKEY = "10000000-ffff-ffff-ffff-000000000001";

export function getCaptchaSitekey(): string {
  return process.env["HCAPTCHA_SITEKEY"] ?? TEST_SITEKEY;
}

interface SiteverifyResponse {
  success: boolean;
  "error-codes"?: string[];
}

export async function verifyCaptchaToken(token: string): Promise<void> {
  const secret = process.env["HCAPTCHA_SECRET_KEY"] ?? TEST_SECRET;

  const body = new URLSearchParams({ secret, response: token });
  const response = await fetch("https://hcaptcha.com/siteverify", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    throw new Error(`Captcha verification failed (HTTP ${response.status}). Please try again.`);
  }

  const result = (await response.json()) as SiteverifyResponse;
  if (!result.success) {
    const codes = result["error-codes"]?.join(", ");
    throw new Error(
      codes ? `Captcha verification failed: ${codes}. Please retry the captcha.` : "Captcha verification failed. Please retry the captcha.",
    );
  }
}
