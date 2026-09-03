export interface LicenseEntry {
  readonly name: string;
  readonly author: string;
  readonly license: string;
  readonly url: string;
  readonly note?: string;
}

export const assetCredits: readonly LicenseEntry[] = [
  {
    name: "Human Resources 4 icon collection",
    author: "SVG Repo (uploader)",
    license: "CC0 License",
    url: "https://www.svgrepo.com/collection/human-resources-4/",
    note: "Source of the site favicon. Collection: https://www.svgrepo.com/collection/human-resources-4/ — License: https://www.svgrepo.com/page/licensing/#CC0 — Uploader: https://www.svgrepo.com/",
  },
];

export const libraryCredits: readonly LicenseEntry[] = [
  {
    name: "React",
    author: "Meta and contributors",
    license: "MIT",
    url: "https://github.com/facebook/react/blob/main/LICENSE",
  },
  {
    name: "TanStack Start & Router",
    author: "Tanner Linsley and contributors",
    license: "MIT",
    url: "https://github.com/TanStack/router/blob/main/LICENSE",
  },
  {
    name: "TanStack Query",
    author: "Tanner Linsley and contributors",
    license: "MIT",
    url: "https://github.com/TanStack/query/blob/main/LICENSE",
  },
  {
    name: "Tailwind CSS",
    author: "Tailwind Labs",
    license: "MIT",
    url: "https://github.com/tailwindlabs/tailwindcss/blob/main/LICENSE",
  },
  {
    name: "shadcn/ui",
    author: "shadcn",
    license: "MIT",
    url: "https://github.com/shadcn-ui/ui/blob/main/LICENSE.md",
    note: "Component source is copied into this project and adapted.",
  },
  {
    name: "Radix UI primitives",
    author: "WorkOS",
    license: "MIT",
    url: "https://github.com/radix-ui/primitives/blob/main/LICENSE",
  },
  {
    name: "Lucide icons",
    author: "Lucide contributors",
    license: "ISC",
    url: "https://lucide.dev/license",
  },
  {
    name: "Font Awesome Free",
    author: "Fonticons, Inc.",
    license: "CC BY 4.0 (icons), SIL OFL 1.1 (fonts), MIT (code)",
    url: "https://fontawesome.com/license/free",
    note: "Used for the footer icons.",
  },
  {
    name: "JSZip",
    author: "Stuart Knightley and contributors",
    license: "MIT or GPLv3",
    url: "https://github.com/Stuk/jszip/blob/main/LICENSE.markdown",
    note: "Builds the downloadable zip of skill files in the browser.",
  },
  {
    name: "Vercel AI SDK",
    author: "Vercel, Inc.",
    license: "Apache-2.0",
    url: "https://github.com/vercel/ai/blob/main/LICENSE",
    note: "Used to rank and rewrite prompts through the AI gateway.",
  },
  {
    name: "Zod",
    author: "Colin McDonnell and contributors",
    license: "MIT",
    url: "https://github.com/colinhacks/zod/blob/main/LICENSE",
  },
  {
    name: "@hcaptcha/react-hcaptcha",
    author: "Intuition Machines, Inc.",
    license: "MIT",
    url: "https://github.com/hCaptcha/react-hcaptcha/blob/master/LICENSE",
    note: "Renders the captcha that gates search and prompt enhancement.",
  },
];

export const dataCredits: readonly LicenseEntry[] = [
  {
    name: "skills.sh registry",
    author: "Vercel Labs and skill authors",
    license: "Per-skill licenses apply",
    url: "https://skills.sh/",
    note: "Search results come from the public registry API used by the skills CLI.",
  },
  {
    name: "GitHub raw content",
    author: "Individual skill repository owners",
    license: "Per-repository licenses apply",
    url: "https://github.com/",
    note: "SKILL.md files are fetched directly from each skill's source repository. Check the repository's own license before reusing a skill.",
  },
];
