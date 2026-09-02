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

export const searchSkills = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SearchInput.parse(input))
  .handler(async ({ data }): Promise<SkillSuggestion[]> => {
    const { verifyCaptchaToken } = await import("./captcha.server");
    await verifyCaptchaToken(data.captchaToken);
    const { rankSkills } = await import("./skills-ranking.server");
    return rankSkills(data.prompt);
  });

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
