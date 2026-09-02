import {
  fetchSkillDocument,
  parseDescription,
  parseExample,
  searchRegistry,
  type RegistrySkill,
} from "./skills-registry.server";
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
  "devops",
  "security",
  "writing",
  "pdf",
  "api",
  "git",
  "agent",
  "database",
] as const;

const MAX_ENTRIES = 60;

export async function listSkillLibrary(): Promise<SkillLibraryEntry[]> {
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

  const entries = await Promise.all(
    candidates.map(async (skill): Promise<SkillLibraryEntry> => {
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
    }),
  );

  return entries.filter((entry) => entry.hasMarkdown);
}
