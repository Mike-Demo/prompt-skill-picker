import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { AGENT_KEYS } from "@/lib/agents";

const AgentSchema = z.enum(AGENT_KEYS);
const PagingSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).max(5_000).default(0),
});

export const Route = createFileRoute("/api/public/v1/skills/agent/$agent")({
  server: {
    handlers: {
      OPTIONS: async () => {
        const { optionsResponse } = await import("@/lib/public-api.server");
        return optionsResponse();
      },
      GET: async ({ params, request }) => {
        const { dataResponse, envelopeError, checkEnvelopeLimit } = await import(
          "@/lib/api-envelope.server"
        );
        const agent = AgentSchema.safeParse(params.agent);
        if (!agent.success) {
          return envelopeError(
            404,
            "unknown_agent",
            `Unknown agent. Use one of: ${AGENT_KEYS.join(", ")}.`,
          );
        }
        const url = new URL(request.url);
        const paging = PagingSchema.safeParse({
          limit: url.searchParams.get("limit") ?? undefined,
          offset: url.searchParams.get("offset") ?? undefined,
        });
        if (!paging.success) {
          return envelopeError(400, "invalid_input", "limit must be 1-50 and offset 0-5000.");
        }
        const limited = await checkEnvelopeLimit();
        if (limited) return limited;

        const { queryCatalogue, CatalogueUnavailableError } = await import("@/lib/catalogue.server");
        try {
          const result = await queryCatalogue({ agent: agent.data, ...paging.data });
          return dataResponse(result.skills, {
            agent: agent.data,
            count: result.skills.length,
            total: result.total,
            limit: result.limit,
            offset: result.offset,
            nextOffset: result.nextOffset,
            stale: result.stale,
          });
        } catch (error) {
          if (error instanceof CatalogueUnavailableError) {
            return envelopeError(503, "registry_unavailable", error.message, { "Retry-After": "60" });
          }
          throw error;
        }
      },
    },
  },
});
