import { createMiddleware } from "@tanstack/react-start";
import { ensureCaptcha } from "./captcha-browser";

export const captchaAction = createMiddleware({ type: "function" })
  .client(async ({ next }) => {
    await ensureCaptcha();
    return next();
  });