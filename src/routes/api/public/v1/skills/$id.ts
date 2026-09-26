import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const IdSchema = z.string().trim().min(1).max(200);

export const Route = createFileRoute("/api/public/v1/skills/$id")({
  server: {
    handlers: {
      OPTIONS: async () => {
        const { optionsResponse } = await import("@/lib/public-api.server");
        return optionsResponse();
      },
      GET: async ({ params }) => {
        const { dataResponse, envelopeError, checkEnvelopeLimit } = await import(
          "@/lib/api-envelope.server"
        );
        const parsed = IdSchema.safeParse(params.id);
        if (!parsed.success) {
          return envelopeError(400, "invalid_input", "id must be 1-200 characters.");
        }
        const limited = await checkEnvelopeLimit();
        if (limited) return limited;

        const { findSkill, CatalogueUnavailableError } = await import("@/lib/catalogue.server");
        try {
          const found = await findSkill(parsed.data);
          if (!found) {
            return envelopeError(404, "not_found", "No skill with that id is in the catalogue.");
          }
          return dataResponse(found.skill, { stale: found.stale });
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
