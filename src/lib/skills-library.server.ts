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
import type { AgentKey } from "./agents";

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
  "devops",
  "pdf",
] as const;

/**
 * Topic queries per agent. The registry has no per-agent filter, so each list
 * is the set of tasks that agent's users most often reach for; every skill is
 * a plain SKILL.md and works with any agent that reads markdown instructions.
 */
const AGENT_TOPICS: Readonly<Record<AgentKey, readonly string[]>> = {
  claude: [
    "claude",
    "claude code",
    "code review",
    "refactoring",
    "debugging",
    "testing",
    "documentation",
    "git commit",
  ],
  "microsoft-copilot": [
    "microsoft copilot",
    "mcp",
    "excel",
    "powerpoint",
    "word document",
    "meeting notes",
    "email",
    "data analysis",
  ],
  "superhuman-go": [
    "email",
    "inbox triage",
    "meeting notes",
    "follow up",
    "scheduling",
    "writing",
    "summarize",
  ],
  chatgpt: [
    "chatgpt",
    "prompt engineering",
    "writing",
    "summarize",
    "data analysis",
    "research",
    "pdf",
  ],
  grok: ["research", "data analysis", "coding", "summarize", "social media", "writing"],
  perplexity: [
    "research",
    "citations",
    "competitive analysis",
    "market research",
    "summarize",
    "writing",
  ],
  "github-copilot": [
    "github copilot",
    "code review",
    "pull request",
    "testing",
    "refactoring",
    "git commit",
    "documentation",
  ],
};


const MAX_ENTRIES = 24;
const DOC_CONCURRENCY = 8;
const CACHE_TTL_MS = 30 * 60 * 1000;

interface CacheSlot {
  cached: { entries: SkillLibraryEntry[]; expiresAt: number } | null;
  inFlight: Promise<SkillLibraryEntry[]> | null;
}

const slots = new Map<string, CacheSlot>();

async function loadLibrary(topics: readonly string[]): Promise<SkillLibraryEntry[]> {
  const batches = await Promise.all(
    topics.map((topic) => searchRegistry(topic, 12).catch(() => [] as RegistrySkill[])),
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
        skillId: skill.skillId,
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

  // Most-installed first: the registry's install count is the only usage
  // signal available, and the doc fetch above preserves candidate order.
  const visible = entries
    .filter((entry) => entry.hasMarkdown)
    .sort((a, b) => b.installs - a.installs || a.name.localeCompare(b.name));
  allowSkillIds(visible.map((entry) => entry.id));
  return visible;
}

/**
 * Serves a catalogue from a short-lived cache and collapses concurrent
 * requests onto one load, so only the first visitor in a window pays for the
 * registry and GitHub round trips.
 */
async function listCached(
  key: string,
  topics: readonly string[],
): Promise<SkillLibraryEntry[]> {
  const slot: CacheSlot = slots.get(key) ?? { cached: null, inFlight: null };
  slots.set(key, slot);

  if (slot.cached && slot.cached.expiresAt > Date.now()) {
    allowSkillIds(slot.cached.entries.map((entry) => entry.id));
    return slot.cached.entries;
  }

  if (!slot.inFlight) {
    slot.inFlight = loadLibrary(topics)
      .then((entries) => {
        slot.cached = { entries, expiresAt: Date.now() + CACHE_TTL_MS };
        return entries;
      })
      .finally(() => {
        slot.inFlight = null;
      });
  }

  return slot.inFlight;
}

export async function listSkillLibrary(): Promise<SkillLibraryEntry[]> {
  return listCached("library", TOPICS);
}

/** Curated per-agent collection, ranked by installs. */
export async function listAgentSkillLibrary(agent: AgentKey): Promise<SkillLibraryEntry[]> {
  return listCached(`agent:${agent}`, AGENT_TOPICS[agent]);
}
