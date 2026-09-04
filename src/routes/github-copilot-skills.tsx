import { createFileRoute } from "@tanstack/react-router";

import { AgentSkillsPage } from "@/components/agent-skills-page";
import { AGENT_PAGES } from "@/lib/agents";

const AGENT = AGENT_PAGES["github-copilot"];
const SHARE_IMAGE = "https://skills.mikedemo.dev/og-skill-finder.jpg";
const CANONICAL = "https://skills.mikedemo.dev/github-copilot-skills";

export const Route = createFileRoute("/github-copilot-skills")({
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
  }),
  component: AgentRoute,
});

function AgentRoute() {
  return <AgentSkillsPage agent={AGENT} />;
}
