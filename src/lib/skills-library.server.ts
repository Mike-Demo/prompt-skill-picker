import {
  fetchSkillDocument,
  parseDescription,
  parseExample,
  searchRegistryCached,
  RegistryUnavailableError,
  type RegistrySkill,
} from "./skills-registry.server";
import { allowSkillIds } from "./skills-allowlist.server";
import { mapWithConcurrency } from "./concurrency";
import type { SkillLibraryEntry, SkillLibraryResponse } from "./skills.functions";
import type { AgentKey } from "./agents";

/**
 * Broad topic queries used to assemble a browsable catalogue from the
 * registry's search endpoint (it has no "list all" route). The list is wide on
 * purpose: coverage is what determines how many skills the library can show.
 */
const TOPICS = [
  "code review",
  "react",
  "typescript",
  "python",
  "testing",
  "debugging",
  "refactoring",
  "documentation",
  "git commit",
  "pull request",
  "design",
  "css",
  "accessibility",
  "data analysis",
  "sql",
  "security",
  "writing",
  "summarize",
  "research",
  "devops",
  "docker",
  "api",
  "pdf",
  "spreadsheet",
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


const MAX_ENTRIES = 80;
const PER_TOPIC_LIMIT = 20;
const DOC_CONCURRENCY = 8;
const CACHE_TTL_MS = 30 * 60 * 1000;

interface CacheSlot {
  cached: { response: SkillLibraryResponse; expiresAt: number } | null;
  inFlight: Promise<SkillLibraryResponse> | null;
}

const slots = new Map<string, CacheSlot>();

async function loadLibrary(topics: readonly string[]): Promise<SkillLibraryResponse> {
  let reachable = false;
  let servedFromCache = false;

  const batches = await Promise.all(
    topics.map(async (topic) => {
      try {
        const result = await searchRegistryCached(topic, PER_TOPIC_LIMIT);
        reachable = true;
        if (result.stale) servedFromCache = true;
        return result.skills;
      } catch (error) {
        if (!(error instanceof RegistryUnavailableError)) reachable = true;
        return [] as RegistrySkill[];
      }
    }),
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

  return {
    entries: visible,
    unavailable: !reachable && visible.length === 0,
    stale: servedFromCache,
  };
}

/**
 * Serves a catalogue from a short-lived cache and collapses concurrent
 * requests onto one load, so only the first visitor in a window pays for the
 * registry and GitHub round trips.
 */
async function listCached(
  key: string,
  topics: readonly string[],
): Promise<SkillLibraryResponse> {
  const slot: CacheSlot = slots.get(key) ?? { cached: null, inFlight: null };
  slots.set(key, slot);

  if (slot.cached && slot.cached.expiresAt > Date.now()) {
    allowSkillIds(slot.cached.response.entries.map((entry) => entry.id));
    return slot.cached.response;
  }

  if (!slot.inFlight) {
    slot.inFlight = loadLibrary(topics)
      .then((response) => {
        // An empty result means the registry or GitHub call failed; caching it
        // would keep the page blank for the whole TTL.
        if (response.entries.length > 0) {
          slot.cached = { response, expiresAt: Date.now() + CACHE_TTL_MS };
        }
        return response;
      })

      .finally(() => {
        slot.inFlight = null;
      });
  }

  return slot.inFlight;
}

export async function listSkillLibrary(): Promise<SkillLibraryResponse> {
  return listCached("library", TOPICS);
}

/** Curated per-agent collection, ranked by installs. */
export async function listAgentSkillLibrary(agent: AgentKey): Promise<SkillLibraryResponse> {
  return listCached(`agent:${agent}`, AGENT_TOPICS[agent]);
}

}
