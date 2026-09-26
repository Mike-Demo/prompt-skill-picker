import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { AGENT_KEYS } from "@/lib/agents";

const AgentSchema = z.enum(AGENT_KEYS);

export const Route = createFileRoute("/api/public/skills/agent/$agent")({
  server: {
    handlers: {
      OPTIONS: async () => {
        const { optionsResponse } = await import("@/lib/public-api.server");
        return optionsResponse();
      },
      GET: async ({ params }) => {
        const api = await import("@/lib/public-api.server");
        const parsed = AgentSchema.safeParse(params.agent);
        if (!parsed.success) {
          return api.errorResponse(404, "unknown_agent", `Unknown agent. Use one of: ${AGENT_KEYS.join(", ")}.`);
        }
        const limited = await api.checkApiLimit();
        if (limited) return limited;

        const { listAgentSkillLibrary } = await import("@/lib/skills-library.server");
        const library = await listAgentSkillLibrary(parsed.data);
        if (library.unavailable) {
          return api.errorResponse(503, "registry_unavailable", "The skills registry is unavailable.", {
            "Retry-After": "60",
          });
        }
        const skills = library.entries.map(api.toPublicSkill);
        return api.jsonResponse({ agent: parsed.data, ...api.libraryPayload(library, skills) });
      },
    },
  },
});
