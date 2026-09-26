import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const QuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const Route = createFileRoute("/api/public/skills")({
  server: {
    handlers: {
      OPTIONS: async () => {
        const { optionsResponse } = await import("@/lib/public-api.server");
        return optionsResponse();
      },
      GET: async ({ request }) => {
        const api = await import("@/lib/public-api.server");
        const url = new URL(request.url);
        const parsed = QuerySchema.safeParse({
          q: url.searchParams.get("q") ?? undefined,
          limit: url.searchParams.get("limit") ?? undefined,
        });
        if (!parsed.success) {
          return api.errorResponse(400, "invalid_input", "q must be at most 100 characters; limit 1-50.");
        }
        const limited = await api.checkApiLimit();
        if (limited) return limited;

        const { listSkillLibrary } = await import("@/lib/skills-library.server");
        const library = await listSkillLibrary();
        if (library.unavailable) {
          return api.errorResponse(503, "registry_unavailable", "The skills registry is unavailable.", {
            "Retry-After": "60",
          });
        }
        const terms = (parsed.data.q ?? "").toLowerCase().split(/\s+/).filter(Boolean);
        const matches = library.entries
          .filter((entry) => {
            const haystack = `${entry.name} ${entry.description} ${entry.source}`.toLowerCase();
            return terms.every((term) => haystack.includes(term));
          })
          .sort((a, b) => b.installs - a.installs)
          .slice(0, parsed.data.limit)
          .map(api.toPublicSkill);
        return api.jsonResponse({ query: parsed.data.q ?? "", ...api.libraryPayload(library, matches) });
      },
    },
  },
});
