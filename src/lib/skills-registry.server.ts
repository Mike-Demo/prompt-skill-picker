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

/** Candidate repo-relative locations for a skill's SKILL.md. */
function candidatePaths(skillId: string): string[] {
  const ids = new Set<string>([skillId]);
  const trimmed = skillId.split("-").slice(1).join("-");
  if (trimmed.length > 0) ids.add(trimmed);

  const dirs = ["skills/", "", ".claude/skills/", ".agents/skills/"];
  const paths: string[] = [];
  for (const dir of dirs) {
    for (const id of ids) paths.push(`${dir}${id}/SKILL.md`);
  }
  return paths;
}

const BRANCHES = ["main", "master"] as const;

async function fetchRaw(
  source: string,
  path: string,
  branch: string,
): Promise<SkillDocument["markdown"] | null> {
  const res = await fetch(`https://raw.githubusercontent.com/${source}/${branch}/${path}`);
  if (!res.ok) return null;
  return res.text();
}

/**
 * Resolves and downloads the SKILL.md for a registry entry. Conventional raw
 * paths are tried first because raw.githubusercontent.com is not subject to the
 * GitHub REST rate limit; the tree API is only a fallback.
 */
export async function fetchSkillDocument(skill: RegistrySkill): Promise<SkillDocument | null> {
  if (docCache.has(skill.id)) return docCache.get(skill.id) ?? null;

  const build = (branch: string, path: string, markdown: string): SkillDocument => ({
    id: skill.id,
    markdown,
    htmlUrl: `https://github.com/${skill.source}/blob/${branch}/${path}`,
  });

  let result: SkillDocument | null = null;
  try {
    for (const branch of BRANCHES) {
      for (const path of candidatePaths(skill.skillId)) {
        const markdown = await fetchRaw(skill.source, path, branch);
        if (markdown !== null) {
          result = build(branch, path, markdown);
          break;
        }
      }
      if (result) break;
    }

    if (!result) {
      const tree = await getRepoTree(skill.source);
      const suffix = `/${skill.skillId}/SKILL.md`;
      const match = tree.find((e) => e.type === "blob" && e.path.endsWith(suffix));
      if (match) {
        for (const branch of BRANCHES) {
          const markdown = await fetchRaw(skill.source, match.path, branch);
          if (markdown !== null) {
            result = build(branch, match.path, markdown);
            break;
          }
        }
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

/**
 * Extracts a short usage example: the first fenced code block, falling back to
 * the first prose paragraph of the document body.
 */
export function parseExample(markdown: string): string {
  const body = markdown.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");

  const fence = body.match(/```[\w-]*\r?\n([\s\S]*?)```/);
  if (fence?.[1]) {
    const code = fence[1].trim();
    if (code.length > 0) return code.slice(0, 600);
  }

  const paragraph = body
    .split(/\r?\n\s*\r?\n/)
    .map((block) => block.trim())
    .find((block) => block.length > 0 && !block.startsWith("#") && !block.startsWith(">"));

  return paragraph ? paragraph.slice(0, 600) : "";
}
