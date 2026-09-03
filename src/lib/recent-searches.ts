/** Recent searches live only in the visitor's browser — nothing is uploaded. */
const STORAGE_KEY = "skill-finder:recent-searches";
const MAX_ENTRIES = 8;
const TTL_MS = 72 * 60 * 60 * 1000;

export interface RecentSearch {
  prompt: string;
  token: string;
  savedAt: number;
}

function isRecentSearch(value: unknown): value is RecentSearch {
  if (typeof value !== "object" || value === null) return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry["prompt"] === "string" &&
    typeof entry["token"] === "string" &&
    typeof entry["savedAt"] === "number"
  );
}

export function readRecentSearches(): RecentSearch[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const cutoff = Date.now() - TTL_MS;
    return parsed.filter(isRecentSearch).filter((entry) => entry.savedAt > cutoff);
  } catch {
    return [];
  }
}

export function addRecentSearch(prompt: string, token: string): RecentSearch[] {
  const entries = [
    { prompt, token, savedAt: Date.now() },
    ...readRecentSearches().filter((entry) => entry.token !== token),
  ].slice(0, MAX_ENTRIES);
  write(entries);
  return entries;
}

export function clearRecentSearches(): void {
  write([]);
}

function write(entries: readonly RecentSearch[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Storage can be disabled or full; recent searches are a convenience only.
  }
}
