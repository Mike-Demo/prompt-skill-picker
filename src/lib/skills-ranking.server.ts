import { generateText, Output, NoObjectGeneratedError } from "ai";
import { z } from "zod";

import { AI_MODEL, createLovableAiGatewayProvider, getLovableApiKey } from "./ai-gateway.server";
import {
  allowSkillIds,
  isSkillIdAllowed,
  isWellFormedSkillId,
} from "./skills-allowlist.server";
import {
  fetchSkillDocument,
  parseDescription,
  searchRegistry,
  type RegistrySkill,
} from "./skills-registry.server";
import type { SkillFile, SkillSuggestion } from "./skills.functions";

const MAX_CANDIDATES = 24;

const querySchema = z.object({ queries: z.array(z.string()) });
const rankingSchema = z.object({
  results: z.array(z.object({ id: z.string(), score: z.number(), reason: z.string() })),
});

const model = () => createLovableAiGatewayProvider(getLovableApiKey())(AI_MODEL);

async function expandQueries(prompt: string): Promise<string[]> {
  try {
    const { output } = await generateText({
      model: model(),
      output: Output.object({ schema: querySchema }),
      prompt: [
        "You turn a user's goal into short keyword search queries for a registry of AI agent skills.",
        "Return between 3 and 6 queries, each 1-3 lowercase keywords, no punctuation.",
        `User goal: ${prompt}`,
      ].join("\n"),
    });
    const queries = output.queries.map((q) => q.trim()).filter(Boolean).slice(0, 6);
    return queries.length > 0 ? queries : [prompt];
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error)) return [prompt];
    throw error;
  }
}

async function gatherCandidates(queries: string[]): Promise<RegistrySkill[]> {
  const batches = await Promise.all(
    queries.map((q) => searchRegistry(q).catch(() => [] as RegistrySkill[])),
  );
  const byId = new Map<string, RegistrySkill>();
  for (const batch of batches) {
    for (const skill of batch) {
      if (!byId.has(skill.id)) byId.set(skill.id, skill);
    }
  }
  return [...byId.values()]
    .sort((a, b) => b.installs - a.installs)
    .slice(0, MAX_CANDIDATES);
}

interface EnrichedSkill {
  skill: RegistrySkill;
  description: string;
  htmlUrl: string | null;
  hasMarkdown: boolean;
}

async function enrich(candidates: RegistrySkill[]): Promise<EnrichedSkill[]> {
  return Promise.all(
    candidates.map(async (skill) => {
      const doc = await fetchSkillDocument(skill);
      return {
        skill,
        description: (doc ? parseDescription(doc.markdown) : null) ?? "",
        htmlUrl: doc?.htmlUrl ?? null,
        hasMarkdown: Boolean(doc),
      };
    }),
  );
}

export async function rankSkills(prompt: string): Promise<SkillSuggestion[]> {
  const queries = await expandQueries(prompt);
  const candidates = await gatherCandidates(queries);
  if (candidates.length === 0) return [];

  const enriched = await enrich(candidates);
  const catalog = enriched
    .map(
      (e) =>
        `- id: ${e.skill.id}\n  name: ${e.skill.name}\n  installs: ${e.skill.installs}\n  description: ${e.description || "(none)"}`,
    )
    .join("\n");

  let ranked: z.infer<typeof rankingSchema>["results"] = [];
  try {
    const { output } = await generateText({
      model: model(),
      output: Output.object({ schema: rankingSchema }),
      prompt: [
        "Rank agent skills by how well they serve the user's goal.",
        "Only use ids from the catalog. Drop clearly irrelevant skills.",
        "score is 0-100. reason is one sentence, at most 140 characters, addressed to the user.",
        "Return at most 12 results, best first.",
        `\nUser goal: ${prompt}`,
        `\nCatalog:\n${catalog}`,
      ].join("\n"),
    });
    ranked = output.results;
  } catch (error) {
    if (!NoObjectGeneratedError.isInstance(error)) throw error;
  }

  const byId = new Map(enriched.map((e) => [e.skill.id, e]));
  const ordered = ranked
    .filter((r) => byId.has(r.id))
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);

  const source = ordered.length > 0 ? ordered : enriched.slice(0, 12).map((e) => ({ id: e.skill.id, score: 0, reason: "" }));

  return source.flatMap((r) => {
    const entry = byId.get(r.id);
    if (!entry) return [];
    return [
      {
        id: entry.skill.id,
        name: entry.skill.name,
        source: entry.skill.source,
        installs: entry.skill.installs,
        description: entry.description,
        reason: r.reason.slice(0, 180),
        htmlUrl: entry.htmlUrl,
        hasMarkdown: entry.hasMarkdown,
      } satisfies SkillSuggestion,
    ];
  });
}

const MAX_ENHANCED_LENGTH = 2000;

export async function enhancePrompt(prompt: string): Promise<string> {
  const { text } = await generateText({
    model: model(),
    prompt: [
      "You rewrite a user's rough goal into a sharp search brief for a registry of AI agent skills.",
      "Keep the user's intent and voice. Make it specific: name the role or context, the tasks,",
      "the inputs and outputs, and any constraints. One short paragraph, no preamble, no quotes.",
      `Draft: ${prompt}`,
    ].join("\n"),
  });
  const enhanced = text.trim().slice(0, MAX_ENHANCED_LENGTH);
  return enhanced.length >= 3 ? enhanced : prompt;
}

export async function collectSkillFiles(ids: string[]): Promise<SkillFile[]> {
  const files: SkillFile[] = [];
  const used = new Set<string>();

  for (const id of ids) {
    const parts = id.split("/");
    const skillId = parts[parts.length - 1] ?? id;
    const source = parts.slice(0, -1).join("/");
    if (!source || !skillId) continue;

    const doc = await fetchSkillDocument({ id, skillId, name: skillId, installs: 0, source });
    if (!doc) continue;

    let filename = `${skillId}.md`;
    let n = 2;
    while (used.has(filename)) filename = `${skillId}-${n++}.md`;
    used.add(filename);

    files.push({ filename, content: doc.markdown });
  }

  return files;
}
