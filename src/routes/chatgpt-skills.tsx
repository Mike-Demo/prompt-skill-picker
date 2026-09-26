import { createFileRoute } from "@tanstack/react-router";

import { AgentSkillsPage } from "@/components/agent-skills-page";
import { AGENT_PAGES } from "@/lib/agents";
import { agentJsonLd } from "@/lib/structured-data";

const AGENT = AGENT_PAGES["chatgpt"];
const SHARE_IMAGE = "https://skills.mikedemo.dev/og-skill-finder.jpg";
const CANONICAL = "https://skills.mikedemo.dev/chatgpt-skills";

export const Route = createFileRoute("/chatgpt-skills")({
  head: () => ({
    meta: [
      { title: AGENT.title },
      { name: "description", content: AGENT.description },
      { property: "og:title", content: AGENT.title },
      { property: "og:description", content: AGENT.description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: CANONICAL },
      { property: "og:image", content: SHARE_IMAGE },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: SHARE_IMAGE },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
    scripts: [agentJsonLd(AGENT)],
  }),
  component: AgentRoute,
});

function AgentRoute() {
  return <AgentSkillsPage agent={AGENT} />;
}
