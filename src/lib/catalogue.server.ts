import type { AgentKey } from "./agents";
import type { PublicSkill } from "./public-api.server";
import { toPublicSkill } from "./public-api.server";

export interface CatalogueQuery {
  q?: string | undefined;
  agent?: AgentKey | undefined;
  source?: string | undefined;
  minInstalls?: number | undefined;
  limit: number;
  offset: number;
}

export interface CatalogueResult {
  skills: PublicSkill[];
  total: number;
  limit: number;
  offset: number;
  nextOffset: number | null;
  stale: boolean;
}

export class CatalogueUnavailableError extends Error {
  constructor() {
    super("The skills registry is unavailable.");
    this.name = "CatalogueUnavailableError";
  }
}

const matchesTerms = (skill: PublicSkill, terms: readonly string[]) => {
  if (terms.length === 0) return true;
  const haystack = `${skill.name} ${skill.description} ${skill.source}`.toLowerCase();
  return terms.every((term) => haystack.includes(term));
};

async function loadSkills(agent?: AgentKey): Promise<{ skills: PublicSkill[]; stale: boolean }> {
  const { listSkillLibrary, listAgentSkillLibrary } = await import("./skills-library.server");
  const library = agent ? await listAgentSkillLibrary(agent) : await listSkillLibrary();
  if (library.unavailable) throw new CatalogueUnavailableError();
  return { skills: library.entries.map(toPublicSkill), stale: library.stale };
}

/** Single read path for the public API and the MCP tools. */
export async function queryCatalogue(query: CatalogueQuery): Promise<CatalogueResult> {
  const { skills, stale } = await loadSkills(query.agent);
  const terms = (query.q ?? "").toLowerCase().split(/\s+/).filter(Boolean);
  const source = query.source?.toLowerCase();
  const minInstalls = query.minInstalls ?? 0;

  const filtered = skills
    .filter((skill) => matchesTerms(skill, terms))
    .filter((skill) => (source ? skill.source.toLowerCase().includes(source) : true))
    .filter((skill) => skill.installs >= minInstalls)
    .sort((a, b) => b.installs - a.installs || a.name.localeCompare(b.name));

  const page = filtered.slice(query.offset, query.offset + query.limit);
  const end = query.offset + page.length;

  return {
    skills: page,
    total: filtered.length,
    limit: query.limit,
    offset: query.offset,
    nextOffset: end < filtered.length ? end : null,
    stale,
  };
}

export async function findSkill(id: string): Promise<{ skill: PublicSkill; stale: boolean } | null> {
  const { skills, stale } = await loadSkills();
  const skill = skills.find((candidate) => candidate.id === id);
  return skill ? { skill, stale } : null;
}
