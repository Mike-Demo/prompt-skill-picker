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
