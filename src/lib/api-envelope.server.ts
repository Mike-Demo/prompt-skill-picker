import { errorResponse, jsonResponse } from "./public-api.server";

export interface EnvelopeMeta {
  [key: string]: unknown;
}

/** Standard success envelope: { data, meta }. */
export const dataResponse = (data: unknown, meta: EnvelopeMeta = {}) =>
  jsonResponse({ data, meta: { apiVersion: "1", ...meta } });

/** Standard failure envelope: { error: { code, message } }. */
export const envelopeError = (
  status: number,
  code: string,
  message: string,
  extra: Record<string, string> = {},
) => errorResponse(status, code, message, extra);
