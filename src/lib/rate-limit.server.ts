// Ad-hoc per-IP rate limiting and temporary abuse blocking.
//
// The durable counters live in `rate_limit_events` / `ip_blocks`, but the whole
// decision (block check, window counts, attempt record, retention trim) runs in
// a single `check_rate_limit` database call to keep the cost per request low.
// IPs are hashed with a server-side salt before storage, so raw addresses are
// never persisted.
import { getRequest } from "@tanstack/react-start/server";

export type RateLimitAction = "search" | "enhance" | "download" | "library" | "gist" | "api";

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
  download: [
    { seconds: 60, max: 10 },
    { seconds: 24 * 60 * 60, max: 200 },
  ],
  // Publishing a gist writes to GitHub under the project's own token, so it
  // gets its own, much tighter quota than a read-only download.
  gist: [
    { seconds: 60, max: 2 },
    { seconds: 24 * 60 * 60, max: 20 },
  ],
  // The library is served from a shared server cache, so its limit is enforced
  // in memory and never writes a database row.
  library: [
    { seconds: 60, max: 20 },
    { seconds: 60 * 60, max: 200 },
  ],
  // Read-only public JSON API for agents, served from the shared cache.
  api: [
    { seconds: 60, max: 30 },
    { seconds: 24 * 60 * 60, max: 500 },
  ],
};

/** Actions counted in memory instead of in the database. */
const IN_MEMORY_ACTIONS: ReadonlySet<RateLimitAction> = new Set<RateLimitAction>(["library", "api"]);

const ACTION_LABELS: Record<RateLimitAction, string> = {
  search: "search again",
  enhance: "enhance again",
  download: "download again",
  library: "reload the library",
  gist: "publish another gist",
  api: "call the API again",
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
  const headers = getRequest().headers;
  const direct = headers.get("cf-connecting-ip");
  if (direct) return direct;
  const forwarded = headers.get("x-forwarded-for");
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

// ---------------------------------------------------------------------------
// In-memory sliding window for cheap, cache-backed actions.
// ---------------------------------------------------------------------------

const MEMORY_MAX_KEYS = 5000;
const memoryHits = new Map<string, number[]>();

function pruneMemory(): void {
  if (memoryHits.size <= MEMORY_MAX_KEYS) return;
  for (const key of memoryHits.keys()) {
    memoryHits.delete(key);
    if (memoryHits.size <= MEMORY_MAX_KEYS) break;
  }
}

function enforceInMemory(key: string, action: RateLimitAction): void {
  const now = Date.now();
  const longest = Math.max(...LIMITS[action].map((w) => w.seconds));
  const hits = (memoryHits.get(key) ?? []).filter((at) => at > now - longest * 1000);

  for (const window of LIMITS[action]) {
    const used = hits.filter((at) => at > now - window.seconds * 1000).length;
    if (used < window.max) continue;
    memoryHits.set(key, hits);
    throw new RateLimitError(
      `Too many requests. You can ${ACTION_LABELS[action]} in ${window.seconds}s.`,
      window.seconds,
      false,
    );
  }

  hits.push(now);
  memoryHits.set(key, hits);
  pruneMemory();
}

// ---------------------------------------------------------------------------
// Durable limiter
// ---------------------------------------------------------------------------

interface Verdict {
  allowed: boolean;
  blocked: boolean;
  retry_after_seconds: number;
}

function parseVerdict(value: unknown): Verdict | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  if (typeof record["allowed"] !== "boolean") return null;
  return {
    allowed: record["allowed"],
    blocked: record["blocked"] === true,
    retry_after_seconds:
      typeof record["retry_after_seconds"] === "number" ? record["retry_after_seconds"] : 60,
  };
}

/**
 * Rejects blocked callers and callers over their quota. Throws RateLimitError.
 * Fails open when the abuse store is unreachable, so an outage cannot lock
 * everyone out.
 */
export async function enforceRateLimit(ip: string, action: RateLimitAction): Promise<void> {
  let ipHash: string;
  try {
    ipHash = await hashIp(ip);
  } catch {
    return;
  }

  if (IN_MEMORY_ACTIONS.has(action)) {
    // Key by action as well as visitor, so each action keeps its own window:
    // a burst of API calls must not starve the library pages, or vice versa.
    enforceInMemory(`${action}:${ipHash}`, action);
    return;
  }

  let verdict: Verdict | null = null;
  try {
    const db = await admin();
    const { data } = await db.rpc("check_rate_limit", {
      _ip_hash: ipHash,
      _action: action,
      _windows: LIMITS[action].map((w) => ({ seconds: w.seconds, max: w.max })),
    });
    verdict = parseVerdict(data);
  } catch {
    return;
  }

  if (!verdict || verdict.allowed) return;
  if (verdict.blocked) {
    throw new RateLimitError(BLOCKED_MESSAGE, verdict.retry_after_seconds, true);
  }
  throw new RateLimitError(
    `Too many requests. You can ${ACTION_LABELS[action]} in ${verdict.retry_after_seconds}s.`,
    verdict.retry_after_seconds,
    false,
  );
}
