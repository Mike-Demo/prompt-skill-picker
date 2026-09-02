/**
 * Client for the public skills registry that powers `npx skills find`
 * (https://skills.sh/api/search) plus a resolver that locates each skill's
 * SKILL.md inside its source GitHub repository.
 */

export interface RegistrySkill {
  id: string;
  skillId: string;
  name: string;
  installs: number;
  source: string;
}

interface SearchResponse {
  skills?: Array<Partial<RegistrySkill>>;
}

const SEARCH_API = "https://skills.sh/api/search";
const SEARCH_LIMIT = 20;

export async function searchRegistry(query: string, limit = SEARCH_LIMIT): Promise<RegistrySkill[]> {
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  const res = await fetch(`${SEARCH_API}?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Skills registry search failed (${res.status}).`);
  }
  const body = (await res.json()) as SearchResponse;
  if (!Array.isArray(body.skills)) return [];
  return body.skills.flatMap((raw) => {
    if (!raw?.id || !raw?.skillId || !raw?.source) return [];
    return [
      {
        id: raw.id,
        skillId: raw.skillId,
        name: raw.name ?? raw.skillId,
        installs: typeof raw.installs === "number" ? raw.installs : 0,
        source: raw.source,
      },
    ];
  });
}

interface RepoTreeEntry {
  path: string;
  type: string;
}

const treeCache = new Map<string, Promise<RepoTreeEntry[]>>();

async function getRepoTree(source: string): Promise<RepoTreeEntry[]> {
  const cached = treeCache.get(source);
  if (cached) return cached;

  const load = (async () => {
    for (const branch of ["main", "master"]) {
      const res = await fetch(
        `https://api.github.com/repos/${source}/git/trees/${branch}?recursive=1`,
        { headers: { Accept: "application/vnd.github+json" } },
      );
      if (!res.ok) continue;
      const body = (await res.json()) as { tree?: RepoTreeEntry[] };
      if (Array.isArray(body.tree)) return body.tree;
    }
    return [];
  })();

  treeCache.set(source, load);
  return load;
}

export interface SkillDocument {
  id: string;
  markdown: string;
  htmlUrl: string;
}

const docCache = new Map<string, SkillDocument | null>();

/** Resolves and downloads the SKILL.md for a registry entry. */
export async function fetchSkillDocument(skill: RegistrySkill): Promise<SkillDocument | null> {
  if (docCache.has(skill.id)) return docCache.get(skill.id) ?? null;

  let result: SkillDocument | null = null;
  try {
    const tree = await getRepoTree(skill.source);
    const suffix = `/${skill.skillId}/SKILL.md`;
    const match =
      tree.find((e) => e.type === "blob" && e.path.endsWith(suffix)) ??
      tree.find((e) => e.type === "blob" && e.path === `${skill.skillId}/SKILL.md`);

    if (match) {
      const branchGuesses = ["main", "master"];
      for (const branch of branchGuesses) {
        const raw = await fetch(
          `https://raw.githubusercontent.com/${skill.source}/${branch}/${match.path}`,
        );
        if (!raw.ok) continue;
        result = {
          id: skill.id,
          markdown: await raw.text(),
          htmlUrl: `https://github.com/${skill.source}/blob/${branch}/${match.path}`,
        };
        break;
      }
    }
  } catch {
    result = null;
  }

  docCache.set(skill.id, result);
  return result;
}

/** Extracts the `description` value from YAML frontmatter, when present. */
export function parseDescription(markdown: string): string | null {
  const fm = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fm?.[1]) return null;
  const line = fm[1].match(/^description:\s*(.+)$/m);
  if (!line?.[1]) return null;
  return line[1].trim().replace(/^["']|["']$/g, "");
}
