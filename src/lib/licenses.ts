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
  {
    name: "Microsoft Copilot icon (microsoft-cloud-icons)",
    author: "DamoBird365",
    license: "See repository trademark notice",
    url: "https://github.com/DamoBird365/microsoft-cloud-icons/tree/master#trademark-notice",
    note: "Microsoft Copilot brand mark used in the agent navigation and page header. Microsoft, Microsoft Copilot, and the Microsoft cloud icons are trademarks of Microsoft Corporation; this project uses the icons as a navigational reference only and is not affiliated with or endorsed by Microsoft. See the repository's trademark notice for details.",
  },
  {
    name: "Perplexity icon",
    author: "Reicon",
    license: "MIT License",
    url: "https://reicon.dev/license",
    note: "Perplexity brand mark from Reicon (https://github.com/dqev/reicon), used in the agent navigation and page header. Perplexity and the Perplexity logo are trademarks of Perplexity AI, Inc.; this project uses the icon as a navigational reference only and is not affiliated with or endorsed by Perplexity.",
  },
  {
    name: "Grammarly icon",
    author: "Reicon",
    license: "MIT License",
    url: "https://reicon.dev/license",
    note: "Grammarly brand mark from Reicon (https://github.com/dqev/reicon), used for the Superhuman Go navigation entry and page header. Grammarly and the Grammarly logo are trademarks of Grammarly, Inc.; this project uses the icon as a navigational reference only and is not affiliated with or endorsed by Grammarly.",
  },
];

export const typefaceCredits: readonly LicenseEntry[] = [
  {
    name: "Nebula Sans",
    author: "Nebula Entertainment & Broadcasting LLC",
    license: "SIL Open Font License 1.1",
    url: "https://nebulasans.com/license/",
    note: "The interface typeface, self-hosted via @fontsource/nebula-sans. Based on Source Sans by Paul D. Hunt for Adobe. Project site: https://nebulasans.com/",
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
    name: "Web Awesome",
    author: "Font Awesome (Fonticons, Inc.) and contributors",
    license: "MIT",
    url: "https://github.com/fontawesome/web-awesome/blob/main/LICENSE",
    note: "The open-source web component library this app's design system is built on. Component source is copied into this project under src/design-system/ and adapted.",
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
    name: "Supabase",
    author: "Supabase, Inc.",
    license: "MIT (client libraries)",
    url: "https://github.com/supabase/supabase-js/blob/master/LICENSE",
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
