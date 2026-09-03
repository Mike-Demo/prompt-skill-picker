import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export interface SkillSuggestion {
  id: string;
  name: string;
  source: string;
  installs: number;
  description: string;
  reason: string;
  htmlUrl: string | null;
  hasMarkdown: boolean;
}

export interface SkillFile {
  filename: string;
  content: string;
}

const SearchInput = z.object({
  prompt: z.string().min(3).max(2000),
  captchaToken: z.string().min(1, "Please complete the captcha."),
});
const FetchInput = z.object({ ids: z.array(z.string()).min(1).max(50) });

/** Blocks abusive callers, enforces the quota, then verifies the captcha. */
async function guard(
  action: "search" | "enhance" | "download" | "library",
  captchaToken?: string,
): Promise<void> {
  const { enforceRateLimit, getClientIp, recordCaptchaFailure } = await import(
    "./rate-limit.server"
  );
  const ip = getClientIp();
  await enforceRateLimit(ip, action);

  if (captchaToken === undefined) return;
  const { verifyCaptchaToken } = await import("./captcha.server");
  try {
    await verifyCaptchaToken(captchaToken);
  } catch (error) {
    await recordCaptchaFailure(ip);
    throw error;
  }
}

export interface SearchResponse {
  results: SkillSuggestion[];
  /** Share token for the stored search, or null when persisting failed. */
  token: string | null;
}

export const searchSkills = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SearchInput.parse(input))
  .handler(async ({ data }): Promise<SearchResponse> => {
    await guard("search", data.captchaToken);
    const { rankSkills } = await import("./skills-ranking.server");
    const results = await rankSkills(data.prompt);
    const { saveSearch } = await import("./saved-search.server");
    return { results, token: await saveSearch(data.prompt, results) };
  });

const TokenInput = z.object({ token: z.string().min(4).max(32) });

export interface SavedSearchResponse {
  prompt: string;
  results: SkillSuggestion[];
  expiresAt: string;
}

/**
 * Replays a stored search. No captcha and no AI call: the results were already
 * ranked and paid for when the search first ran.
 */
export const getSavedSearch = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => TokenInput.parse(input))
  .handler(async ({ data }): Promise<SavedSearchResponse | null> => {
    await guard("library");
    const { loadSavedSearch } = await import("./saved-search.server");
    const saved = await loadSavedSearch(data.token);
    if (!saved) return null;

    // A shared link is a legitimate way to learn these ids, so re-authorise
    // them for the download and gist endpoints on this instance.
    const { allowSkillIds } = await import("./skills-allowlist.server");
    allowSkillIds(saved.results.map((skill) => skill.id));
    return saved;
  });

const GistInput = z.object({ id: z.string().min(3).max(200) });

export const createSkillGist = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => GistInput.parse(input))
  .handler(async ({ data }): Promise<{ url: string }> => {
    await guard("download");
    const { collectSkillFiles } = await import("./skills-ranking.server");
    const files = await collectSkillFiles([data.id]);
    const file = files[0];
    if (!file) throw new Error("This skill has no markdown file to publish.");

    const { createGist, GistNotConfiguredError } = await import("./gist.server");
    try {
      const url = await createGist(file.filename, file.content, `${data.id} — via Skill Finder`);
      return { url };
    } catch (error) {
      if (error instanceof GistNotConfiguredError) {
        throw new Error("Gist publishing is not configured yet.");
      }
      throw error;
    }
  });

export const enhancePrompt = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SearchInput.parse(input))
  .handler(async ({ data }): Promise<{ enhanced: string }> => {
    await guard("enhance", data.captchaToken);
    const { enhancePrompt: enhance } = await import("./skills-ranking.server");
    return { enhanced: await enhance(data.prompt) };
  });

// The hCaptcha site key is public by design (it ships in every page that
// renders the widget), so it is safe to hand to the browser.
export const getCaptchaSitekey = createServerFn({ method: "GET" }).handler(
  async (): Promise<string> => {
    const { getCaptchaSitekey: resolve } = await import("./captcha.server");
    return resolve();
  },
);

export const fetchSkillFiles = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => FetchInput.parse(input))
  .handler(async ({ data }): Promise<SkillFile[]> => {
    await guard("download");
    const { collectSkillFiles } = await import("./skills-ranking.server");
    return collectSkillFiles(data.ids);
  });

export interface SkillLibraryEntry {
  id: string;
  name: string;
  source: string;
  installs: number;
  description: string;
  example: string;
  htmlUrl: string | null;
  hasMarkdown: boolean;
}

export const listSkills = createServerFn({ method: "GET" }).handler(
  async (): Promise<SkillLibraryEntry[]> => {
    await guard("library");
    const { listSkillLibrary } = await import("./skills-library.server");
    return listSkillLibrary();
  },
);
