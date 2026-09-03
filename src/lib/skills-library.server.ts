import {
  fetchSkillDocument,
  parseDescription,
  parseExample,
  searchRegistry,
  type RegistrySkill,
} from "./skills-registry.server";
import { allowSkillIds } from "./skills-allowlist.server";
import { mapWithConcurrency } from "./concurrency";
import type { SkillLibraryEntry } from "./skills.functions";

/**
 * Broad topic queries used to assemble a browsable catalogue from the
 * registry's search endpoint (it has no "list all" route).
 */
const TOPICS = [
  "code review",
  "react",
  "testing",
  "documentation",
  "design",
  "data analysis",
  "security",
  "writing",
] as const;

const MAX_ENTRIES = 24;
const DOC_CONCURRENCY = 8;
const CACHE_TTL_MS = 30 * 60 * 1000;

let cached: { entries: SkillLibraryEntry[]; expiresAt: number } | null = null;
let inFlight: Promise<SkillLibraryEntry[]> | null = null;

async function loadLibrary(): Promise<SkillLibraryEntry[]> {
  const batches = await Promise.all(
    TOPICS.map((topic) => searchRegistry(topic, 12).catch(() => [] as RegistrySkill[])),
  );

  const byId = new Map<string, RegistrySkill>();
  for (const batch of batches) {
    for (const skill of batch) {
      if (!byId.has(skill.id)) byId.set(skill.id, skill);
    }
  }

  const candidates = [...byId.values()]
    .sort((a, b) => b.installs - a.installs)
    .slice(0, MAX_ENTRIES);

  const entries = await mapWithConcurrency(
    candidates,
    DOC_CONCURRENCY,
    async (skill): Promise<SkillLibraryEntry> => {
      const doc = await fetchSkillDocument(skill);
      return {
        id: skill.id,
        name: skill.name,
        source: skill.source,
        installs: skill.installs,
        description: (doc ? parseDescription(doc.markdown) : null) ?? "",
        example: doc ? parseExample(doc.markdown) : "",
        htmlUrl: doc?.htmlUrl ?? null,
        hasMarkdown: Boolean(doc),
      };
    },
  );

  const visible = entries.filter((entry) => entry.hasMarkdown);
  allowSkillIds(visible.map((entry) => entry.id));
  return visible;
}

/**
 * Serves the catalogue from a short-lived cache and collapses concurrent
 * requests onto one load, so only the first visitor in a window pays for the
 * registry and GitHub round trips.
 */
export async function listSkillLibrary(): Promise<SkillLibraryEntry[]> {
  if (cached && cached.expiresAt > Date.now()) {
    allowSkillIds(cached.entries.map((entry) => entry.id));
    return cached.entries;
  }

  if (!inFlight) {
    inFlight = loadLibrary()
      .then((entries) => {
        cached = { entries, expiresAt: Date.now() + CACHE_TTL_MS };
        return entries;
      })
      .finally(() => {
        inFlight = null;
      });
  }

  return inFlight;
}
