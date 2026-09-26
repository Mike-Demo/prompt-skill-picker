import { defineTool } from "@lovable.dev/mcp-js";

import { AGENT_PAGE_LIST } from "@/lib/agents";

export default defineTool({
  name: "list_agents",
  title: "List supported agents",
  description: "List the agents that have a curated skill collection, with their keys and pages.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const agents = AGENT_PAGE_LIST.map((page) => ({
      key: page.key,
      label: page.label,
      page: `https://skills.mikedemo.dev${page.path}`,
    }));
    return {
      content: [
        {
          type: "text" as const,
          text: agents.map((agent) => `${agent.key}: ${agent.label} — ${agent.page}`).join("\n"),
        },
      ],
      structuredContent: { agents },
    };
  },
});
