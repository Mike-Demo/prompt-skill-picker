// Ad-hoc per-IP rate limiting and temporary abuse blocking.
//
// The backend has no built-in rate-limiting primitive, so limits are counted
// from rows in `rate_limit_events`. IPs are hashed with a server-side salt
// before storage, so raw addresses are never persisted.
import { getRequestHeader } from "@tanstack/react-start/server";

export type RateLimitAction = "search" | "enhance" | "download" | "library";
type Outcome = "allowed" | "limited" | "captcha_failed";

interface Window {
  readonly seconds: number;
  readonly max: number;
}

const LIMITS: Record<RateLimitAction, readonly Window[]> = {
  search: [
    { seconds: 60, max: 3 },
    { seconds: 24 * 60 * 60, max: 30 },
  ],
  enhance: [
    { seconds: 60, max: 3 },
    { seconds: 24 * 60 * 60, max: 30 },
  ],
  download: [{ seconds: 60, max: 10 }],
  library: [{ seconds: 60, max: 20 }],
};

const BLOCK_WINDOW_SECONDS = 10 * 60;
const BLOCK_DURATION_SECONDS = 60 * 60;
const CAPTCHA_FAILURES_TO_BLOCK = 5;
const LIMIT_REJECTIONS_TO_BLOCK = 20;
const EVENT_RETENTION_HOURS = 24;
const CLEANUP_CHANCE = 0.02;

const ACTION_LABELS: Record<RateLimitAction, string> = {
  search: "search again",
  enhance: "enhance again",
  download: "download again",
  library: "reload the library",
};

export const BLOCKED_MESSAGE =
  "Access temporarily paused due to unusual activity. Please try again later.";

export class RateLimitError extends Error {
  readonly retryAfterSeconds: number;
  readonly blocked: boolean;

  constructor(message: string, retryAfterSeconds: number, blocked: boolean) {
    super(message);
    this.name = "RateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
    this.blocked = blocked;
  }
}

/** Resolves the caller's IP from proxy headers; falls back to a shared bucket. */
export function getClientIp(): string {
  const direct = getRequestHeader("cf-connecting-ip");
  if (direct) return direct;
  const forwarded = getRequestHeader("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return first && first.length > 0 ? first : "unknown";
}

async function hashIp(ip: string): Promise<string> {
  const salt = process.env["RATE_LIMIT_SALT"] ?? "skill-finder-default-salt";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}:${ip}`));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

function since(seconds: number): string {
  return new Date(Date.now() - seconds * 1000).toISOString();
}

async function pruneOldEvents(): Promise<void> {
  if (Math.random() > CLEANUP_CHANCE) return;
  const db = await admin();
  await db
    .from("rate_limit_events")
    .delete()
    .lt("created_at", since(EVENT_RETENTION_HOURS * 60 * 60));
}

/** Records an attempt outcome. Failures here never block the request. */
export async function recordOutcome(
  ip: string,
  action: RateLimitAction,
  outcome: Outcome,
): Promise<void> {
  try {
    const db = await admin();
    await db
      .from("rate_limit_events")
      .insert({ ip_hash: await hashIp(ip), action, outcome });
    await pruneOldEvents();
  } catch {
    // Telemetry must not break the user-facing action.
  }
}

async function activeBlockSeconds(ipHash: string): Promise<number> {
  const db = await admin();
  const { data } = await db
    .from("ip_blocks")
    .select("blocked_until")
    .eq("ip_hash", ipHash)
    .maybeSingle();
  if (!data) return 0;
  const remaining = Math.ceil((new Date(data.blocked_until).getTime() - Date.now()) / 1000);
  return remaining > 0 ? remaining : 0;
}

async function countEvents(
  ipHash: string,
  seconds: number,
  outcomes: readonly Outcome[],
  action?: RateLimitAction,
): Promise<number> {
  const db = await admin();
  let query = db
    .from("rate_limit_events")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .in("outcome", outcomes as string[])
    .gte("created_at", since(seconds));
  if (action) query = query.eq("action", action);
  const { count } = await query;
  return count ?? 0;
}

/**
 * Blocks the caller for an hour once recent captcha failures or limit
 * rejections cross the abuse thresholds.
 */
async function maybeBlock(ipHash: string): Promise<number> {
  const [captchaFailures, limitRejections] = await Promise.all([
    countEvents(ipHash, BLOCK_WINDOW_SECONDS, ["captcha_failed"]),
    countEvents(ipHash, BLOCK_WINDOW_SECONDS, ["limited"]),
  ]);

  const reason =
    captchaFailures >= CAPTCHA_FAILURES_TO_BLOCK
      ? "repeated captcha failures"
      : limitRejections >= LIMIT_REJECTIONS_TO_BLOCK
        ? "repeated rate limit breaches"
        : null;
  if (!reason) return 0;

  const db = await admin();
  const blockedUntil = new Date(Date.now() + BLOCK_DURATION_SECONDS * 1000).toISOString();
  await db
    .from("ip_blocks")
    .upsert({ ip_hash: ipHash, reason, blocked_until: blockedUntil }, { onConflict: "ip_hash" });
  return BLOCK_DURATION_SECONDS;
}

/**
 * Rejects blocked callers and callers over their quota. Throws RateLimitError;
 * otherwise records the allowed attempt.
 */
export async function enforceRateLimit(ip: string, action: RateLimitAction): Promise<void> {
  let ipHash: string;
  try {
    ipHash = await hashIp(ip);
  } catch {
    return;
  }

  let blockedSeconds = 0;
  try {
    blockedSeconds = await activeBlockSeconds(ipHash);
  } catch {
    // If the abuse store is unreachable, fail open rather than lock everyone out.
    return;
  }
  if (blockedSeconds > 0) throw new RateLimitError(BLOCKED_MESSAGE, blockedSeconds, true);

  for (const window of LIMITS[action]) {
    const used = await countEvents(ipHash, window.seconds, ["allowed"], action);
    if (used < window.max) continue;

    await recordOutcome(ip, action, "limited");
    const newBlock = await maybeBlock(ipHash);
    if (newBlock > 0) throw new RateLimitError(BLOCKED_MESSAGE, newBlock, true);

    const retryAfter = window.seconds <= 60 ? window.seconds : 60 * 60;
    throw new RateLimitError(
      `Too many requests. You can ${ACTION_LABELS[action]} in ${retryAfter}s.`,
      retryAfter,
      false,
    );
  }

  await recordOutcome(ip, action, "allowed");
}

/** Records a captcha failure and blocks the caller when failures pile up. */
export async function recordCaptchaFailure(ip: string): Promise<void> {
  try {
    await recordOutcome(ip, "search", "captcha_failed");
    await maybeBlock(await hashIp(ip));
  } catch {
    // Never mask the original captcha error.
  }
}
