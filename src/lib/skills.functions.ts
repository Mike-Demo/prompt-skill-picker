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

export const searchSkills = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SearchInput.parse(input))
  .handler(async ({ data }): Promise<SkillSuggestion[]> => {
    await guard("search", data.captchaToken);
    const { rankSkills } = await import("./skills-ranking.server");
    return rankSkills(data.prompt);
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
    const { listSkillLibrary } = await import("./skills-library.server");
    return listSkillLibrary();
  },
);
