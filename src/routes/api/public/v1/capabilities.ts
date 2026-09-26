import { createFileRoute } from "@tanstack/react-router";

import { AGENT_KEYS } from "@/lib/agents";

const BASE = "https://skills.mikedemo.dev";

export const Route = createFileRoute("/api/public/v1/capabilities")({
  server: {
    handlers: {
      OPTIONS: async () => {
        const { optionsResponse } = await import("@/lib/public-api.server");
        return optionsResponse();
      },
      GET: async () => {
        const { dataResponse } = await import("@/lib/api-envelope.server");
        return dataResponse({
          apiVersion: "1",
          access: "public, read-only, no authentication",
          agents: AGENT_KEYS,
          features: {
            search: true,
            filtering: ["q", "agent", "source", "minInstalls"],
            pagination: { style: "limit-offset", maxLimit: 50 },
            singleResourceLookup: true,
            structuredErrors: true,
            writeOperations: false,
            streaming: false,
            webhooks: false,
          },
          rateLimit: { requestsPerMinute: 30, requestsPerDay: 500, retryAfterHeader: true },
          endpoints: {
            search: `${BASE}/api/public/v1/skills`,
            skill: `${BASE}/api/public/v1/skills/{id}`,
            agentSkills: `${BASE}/api/public/v1/skills/agent/{agent}`,
            capabilities: `${BASE}/api/public/v1/capabilities`,
            legacySearch: `${BASE}/api/public/skills`,
          },
          discovery: {
            openapi: `${BASE}/openapi.json`,
            llmsTxt: `${BASE}/llms.txt`,
            agentCard: `${BASE}/.well-known/agent.json`,
            docs: `${BASE}/docs/api`,
          },
        });
      },
    },
  },
});
