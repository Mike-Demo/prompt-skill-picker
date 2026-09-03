import type { SkillSuggestion } from "./skills.functions";

/** Shared searches stay retrievable for three days, then expire. */
const TTL_MS = 72 * 60 * 60 * 1000;
const TOKEN_BYTES = 6;
const PRUNE_CHANCE = 0.05;

export interface SavedSearch {
  prompt: string;
  results: SkillSuggestion[];
  expiresAt: string;
}

function randomToken(): string {
  const bytes = new Uint8Array(TOKEN_BYTES);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** owner/repo/skill-id share codes are hex-only, so keep validation strict. */
export function isWellFormedToken(token: string): boolean {
  return /^[0-9a-f]{4,32}$/.test(token);
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/**
 * Persists a completed search so it can be replayed from a link without
 * re-running the AI. Returns the share token, or null when the write fails —
 * a failed save must never break the search that produced it.
 */
export async function saveSearch(
  prompt: string,
  results: readonly SkillSuggestion[],
): Promise<string | null> {
  try {
    const db = await admin();
    const token = randomToken();
    const expiresAt = new Date(Date.now() + TTL_MS).toISOString();

    const { error } = await db
      .from("saved_searches")
      .insert({ token, prompt, results, expires_at: expiresAt });
    if (error) return null;

    if (Math.random() < PRUNE_CHANCE) {
      await db.from("saved_searches").delete().lt("expires_at", new Date().toISOString());
    }
    return token;
  } catch {
    return null;
  }
}

/** Reads a shared search, treating expired or unknown tokens as missing. */
export async function loadSavedSearch(token: string): Promise<SavedSearch | null> {
  if (!isWellFormedToken(token)) return null;

  const db = await admin();
  const { data, error } = await db
    .from("saved_searches")
    .select("prompt, results, expires_at")
    .eq("token", token)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (error || !data) return null;

  const results = Array.isArray(data.results) ? (data.results as unknown as SkillSuggestion[]) : [];
  return { prompt: data.prompt, results, expiresAt: data.expires_at };
}
