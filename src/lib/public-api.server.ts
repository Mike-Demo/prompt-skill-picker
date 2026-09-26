import { enforceRateLimit, getClientIp, RateLimitError } from "./rate-limit.server";
import type { SkillLibraryEntry, SkillLibraryResponse } from "./skills.functions";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export interface PublicSkill {
  id: string;
  name: string;
  description: string;
  source: string;
  installs: number;
  installCommand: string;
  url: string | null;
}

export const toPublicSkill = (entry: SkillLibraryEntry): PublicSkill => ({
  id: entry.id,
  name: entry.name,
  description: entry.description,
  source: entry.source,
  installs: entry.installs,
  installCommand: `npx skills add ${entry.source} --skill ${entry.skillId}`,
  url: entry.htmlUrl,
});

export const jsonResponse = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  Response.json(body, {
    status,
    headers: { ...CORS_HEADERS, "Cache-Control": "public, max-age=300", ...extra },
  });

export const errorResponse = (status: number, code: string, error: string, extra: Record<string, string> = {}) =>
  Response.json(
    { error, code },
    { status, headers: { ...CORS_HEADERS, "Cache-Control": "no-store", ...extra } },
  );

export const optionsResponse = () => new Response(null, { status: 204, headers: CORS_HEADERS });

/** Applies the per-visitor API quota; returns a 429 response when exceeded. */
export async function checkApiLimit(): Promise<Response | null> {
  try {
    await enforceRateLimit(getClientIp(), "api");
    return null;
  } catch (error) {
    if (error instanceof RateLimitError) {
      return errorResponse(429, "rate_limited", error.message, {
        "Retry-After": String(error.retryAfterSeconds),
      });
    }
    return null;
  }
}

export function libraryPayload(response: SkillLibraryResponse, skills: PublicSkill[]) {
  return { count: skills.length, stale: response.stale, skills };
}
