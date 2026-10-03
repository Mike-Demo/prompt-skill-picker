// Catch-all for unknown /api/* paths: agents get a JSON error, not the SPA shell.
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/$")({
  server: {
    handlers: {
      ANY: async () => {
        const { envelopeError } = await import("@/lib/api-envelope.server");
        return envelopeError(
          404,
          "not_found",
          "Unknown API path. See https://skills.mikedemo.dev/openapi.json for the API reference.",
        );
      },
    },
  },
});
