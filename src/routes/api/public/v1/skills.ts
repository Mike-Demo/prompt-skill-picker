import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { AGENT_KEYS } from "@/lib/agents";

const QuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  agent: z.enum(AGENT_KEYS).optional(),
  source: z.string().trim().max(120).optional(),
  minInstalls: z.coerce.number().int().min(0).max(1_000_000).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).max(5_000).default(0),
});

export const Route = createFileRoute("/api/public/v1/skills")({
  server: {
    handlers: {
      OPTIONS: async () => {
        const { optionsResponse } = await import("@/lib/public-api.server");
        return optionsResponse();
      },
      GET: async ({ request }) => {
        const { dataResponse, envelopeError, checkEnvelopeLimit } = await import(
          "@/lib/api-envelope.server"
        );
        const url = new URL(request.url);
        const parsed = QuerySchema.safeParse({
          q: url.searchParams.get("q") ?? undefined,
          agent: url.searchParams.get("agent") ?? undefined,
          source: url.searchParams.get("source") ?? undefined,
          minInstalls: url.searchParams.get("minInstalls") ?? undefined,
          limit: url.searchParams.get("limit") ?? undefined,
          offset: url.searchParams.get("offset") ?? undefined,
        });
        if (!parsed.success) {
          return envelopeError(
            400,
            "invalid_input",
            "Check q (<=100 chars), agent, source, minInstalls, limit (1-50) and offset (0-5000).",
          );
        }
        const limited = await checkEnvelopeLimit();
        if (limited) return limited;

        const { queryCatalogue, CatalogueUnavailableError } = await import("@/lib/catalogue.server");
        try {
          const result = await queryCatalogue(parsed.data);
          return dataResponse(result.skills, {
            query: parsed.data.q ?? "",
            agent: parsed.data.agent ?? null,
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
