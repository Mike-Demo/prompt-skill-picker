/**
 * Durable cache for public skills-registry and GitHub responses.
 *
 * The worker's in-memory caches vanish when the process recycles, which turned
 * a slow upstream registry into an empty page. This table keeps the last good
 * response so the app can serve recent data while the registry is unavailable.
 */

export interface CacheEntry<T> {
  payload: T;
  fetchedAt: number;
  /** True when the entry is older than the caller's freshness window. */
  stale: boolean;
}

const TABLE = "registry_cache";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export async function readRegistryCache<T>(
  key: string,
  freshMs: number,
): Promise<CacheEntry<T> | null> {
  try {
    const client = await admin();
    const { data, error } = await client
      .from(TABLE)
      .select("payload, fetched_at")
      .eq("cache_key", key)
      .maybeSingle();
    if (error || !data) return null;

    const fetchedAt = new Date(data.fetched_at as string).getTime();
    return {
      payload: data.payload as T,
      fetchedAt,
      stale: Date.now() - fetchedAt > freshMs,
    };
  } catch {
    return null;
  }
}

export async function writeRegistryCache<T>(key: string, payload: T): Promise<void> {
  try {
    const client = await admin();
    await client
      .from(TABLE)
      .upsert(
        { cache_key: key, payload: payload as never, fetched_at: new Date().toISOString() },
        { onConflict: "cache_key" },
      );
  } catch {
    // A cache write failure must never break the request it was helping.
  }
}
