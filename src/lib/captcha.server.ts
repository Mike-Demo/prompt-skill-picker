import { getCookie, setCookie } from "@tanstack/react-start/server";
import { getClientIp, recordCaptchaFailure } from "./rate-limit.server";

const COOKIE = "skillfinder_verified";
const TTL = 5 * 60 * 1000;

async function signature(value: string): Promise<string> {
  const secret = process.env["HCAPTCHA_SECRET_KEY"];
  if (!secret) throw new Error("Verification is temporarily unavailable. Please try again later.");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const bytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, "0")).join("");
}

export async function requireCaptcha(): Promise<void> {
  const cookie = getCookie(COOKIE) ?? "";
  const [expiry, provided] = cookie.split(".");
  const expiresAt = Number(expiry);
  if (!provided || !Number.isFinite(expiresAt) || expiresAt <= Date.now() || expiresAt > Date.now() + TTL) {
    throw new Error("Please complete the human verification and try again.");
  }
  const expected = await signature(`${expiry}:${getClientIp()}`);
  if (provided.length !== expected.length) throw new Error("Please complete the human verification and try again.");
  let difference = 0;
  for (let i = 0; i < expected.length; i++) difference |= expected.charCodeAt(i) ^ provided.charCodeAt(i);
  if (difference !== 0) throw new Error("Please complete the human verification and try again.");
}

export async function verifyCaptcha(token: string): Promise<void> {
  const secret = process.env["HCAPTCHA_SECRET_KEY"];
  const sitekey = process.env["HCAPTCHA_SITEKEY"];
  if (!secret || !sitekey) throw new Error("Verification is temporarily unavailable. Please try again later.");
  const response = await fetch("https://api.hcaptcha.com/siteverify", {
    method: "POST",
    body: new URLSearchParams({ secret, sitekey, response: token, remoteip: getClientIp() }),
    signal: AbortSignal.timeout(10000),
  });
  const result: unknown = await response.json();
  if (!response.ok || typeof result !== "object" || result === null || !("success" in result) || result.success !== true) {
    await recordCaptchaFailure();
    throw new Error("Human verification failed or expired. Please try again.");
  }
  const expiry = String(Date.now() + TTL);
  setCookie(COOKIE, `${expiry}.${await signature(`${expiry}:${getClientIp()}`)}`, {
    httpOnly: true, secure: import.meta.env.PROD, sameSite: "strict", path: "/", maxAge: TTL / 1000,
  });
}