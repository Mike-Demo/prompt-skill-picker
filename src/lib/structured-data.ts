import type { AgentPage } from "./agents";

export const SITE_URL = "https://skills.mikedemo.dev";

interface JsonLdScript {
  type: "application/ld+json";
  children: string;
}

const toScript = (data: Record<string, unknown>): JsonLdScript => ({
  type: "application/ld+json",
  children: JSON.stringify({ "@context": "https://schema.org", ...data }),
});

export const websiteJsonLd = (): JsonLdScript =>
  toScript({
    "@type": "WebSite",
    name: "Skill Finder",
    url: `${SITE_URL}/`,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/api/public/skills?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  });

export const webApplicationJsonLd = (): JsonLdScript =>
  toScript({
    "@type": "WebApplication",
    name: "Skill Finder",
    url: `${SITE_URL}/`,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web browser",
    description:
      "Search and browse a curated library of AI agent skills. Find skills for WordPress, MCP, Go, and more, with copy-ready install commands.",
    isPartOf: { "@type": "WebSite", name: "Skill Finder", url: `${SITE_URL}/` },
  });

export const collectionJsonLd = (name: string, description: string, path: string): JsonLdScript =>
  toScript({
    "@type": "CollectionPage",
    name,
    description,
    url: `${SITE_URL}${path}`,
    isPartOf: { "@type": "WebSite", name: "Skill Finder", url: `${SITE_URL}/` },
  });

export const agentJsonLd = (agent: AgentPage): JsonLdScript =>
  collectionJsonLd(agent.heading, agent.description, agent.path);

export const organizationJsonLd = (): JsonLdScript =>
  toScript({
    "@type": "Organization",
    name: "Skill Finder",
    url: `${SITE_URL}/`,
    logo: `${SITE_URL}/favicon.svg`,
    description:
      "Free directory of open agent skills (SKILL.md files) for AI coding agents, with a read-only JSON API and MCP server.",
    sameAs: [
      "https://github.com/Mike-Demo/prompt-skill-picker",
      "https://github.com/Mike-Demo",
      "https://www.linkedin.com/in/mikedemopoulos",
      "https://x.com/mike_demo",
      "https://www.threads.com/@mdemop",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      email: "hey.demo@mikedemo.email",
      contactType: "customer support",
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Hudson",
      addressRegion: "WI",
      addressCountry: "US",
    },
    founder: {
      "@type": "Person",
      name: "Mike Demopoulos",
      url: "https://mikedemo.com",
      sameAs: ["https://github.com/Mike-Demo", "https://www.linkedin.com/in/mikedemopoulos"],
    },
  });

export const faqJsonLd = (): JsonLdScript =>
  toScript({
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is Skill Finder?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Skill Finder is a free directory of open agent skills — SKILL.md instruction files that teach AI coding agents like Claude Code, Cursor, GitHub Copilot, and ChatGPT how to do specific tasks well. Describe what you want your agent to do, get ranked suggestions, and download your picks as a zip.",
        },
      },
      {
        "@type": "Question",
        name: "Do I need an API key to use Skill Finder?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. The public JSON API and the MCP server are keyless and require no authentication. They are read-only and rate-limited per IP.",
        },
      },
      {
        "@type": "Question",
        name: "How do I install a skill I find?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Every skill listing shows a one-command install string, for example: npx skills add https://github.com/mattpocock/skills --skill grill-me. You can also bundle several skills into one zip from the site and drop the files into your agent's skills directory.",
        },
      },
      {
        "@type": "Question",
        name: "Where does the skill catalogue come from?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "The catalogue is built from the open skills registry at skills.sh plus GitHub. Skills are ranked by install count from the open registry, so the most battle-tested instructions appear first.",
        },
      },
      {
        "@type": "Question",
        name: "Is Skill Finder free?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Browsing, the JSON API, the MCP server, and skill bundle downloads are all free with no paid tiers. Fair-use rate limits apply per IP.",
        },
      },
    ],
  });
