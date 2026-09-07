/**
 * Shared definitions for the server-side rendering toggle.
 *
 * The choice is stored in a cookie so the server can read it on the very first
 * request; a browser-only store would arrive too late to affect the first HTML.
 */
export const RENDER_MODE_COOKIE = "skillfinder_ssr";

export const RENDER_MODES = ["on", "off"] as const;

export type RenderMode = (typeof RENDER_MODES)[number];

export const DEFAULT_RENDER_MODE: RenderMode = "on";

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export function isRenderMode(value: string | null | undefined): value is RenderMode {
  return value === "on" || value === "off";
}

/** Parses the mode out of a raw `Cookie` header (or `document.cookie`). */
export function parseRenderModeCookie(cookieHeader: string | null | undefined): RenderMode {
  if (!cookieHeader) return DEFAULT_RENDER_MODE;
  for (const part of cookieHeader.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name !== RENDER_MODE_COOKIE) continue;
    const value = decodeURIComponent(rest.join("=")).trim();
    if (isRenderMode(value)) return value;
  }
  return DEFAULT_RENDER_MODE;
}

/** Browser-only: persists the mode for future requests. */
export function writeRenderModeCookie(mode: RenderMode): void {
  if (typeof document === "undefined") return;
  document.cookie = `${RENDER_MODE_COOKIE}=${mode}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
}
