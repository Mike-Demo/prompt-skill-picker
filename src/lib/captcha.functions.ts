import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const captchaConfig = createServerFn({ method: "GET" }).handler(() => {
  return { sitekey: process.env["HCAPTCHA_SITEKEY"] ?? null };
});

export const completeCaptcha = createServerFn({ method: "POST" })
  .inputValidator((value: unknown) => z.object({ token: z.string().min(1).max(10000) }).parse(value))
  .handler(async ({ data }) => {
    const { enforceRateLimit, getClientIp } = await import("./rate-limit.server");
    await enforceRateLimit(getClientIp(), "captcha");
    const { verifyCaptcha } = await import("./captcha.server");
    await verifyCaptcha(data.token);
    return { verified: true };
  });