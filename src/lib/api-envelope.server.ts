import { CORS_HEADERS } from "./public-api.server";

export interface EnvelopeMeta {
  [key: string]: unknown;
}

/** Standard success envelope: { data, meta }. */
export const dataResponse = (data: unknown, meta: EnvelopeMeta = {}) =>
  Response.json(
    { data, meta: { apiVersion: "1", ...meta } },
    { status: 200, headers: { ...CORS_HEADERS, "Cache-Control": "public, max-age=300" } },
  );

/** Standard failure envelope: { error: { code, message } }. */
export const envelopeError = (
  status: number,
  code: string,
  message: string,
  extra: Record<string, string> = {},
) =>
  Response.json(
    { error: { code, message } },
    { status, headers: { ...CORS_HEADERS, "Cache-Control": "no-store", ...extra } },
  );

/** Applies the per-visitor API quota; returns an enveloped 429 when exceeded. */
export async function checkEnvelopeLimit(): Promise<Response | null> {
  const { enforceRateLimit, getClientIp, RateLimitError } = await import("./rate-limit.server");
  try {
    await enforceRateLimit(getClientIp(), "api");
    return null;
  } catch (error) {
    if (error instanceof RateLimitError) {
      return envelopeError(429, "rate_limited", error.message, {
        "Retry-After": String(error.retryAfterSeconds),
      });
    }
    return null;
  }
}
