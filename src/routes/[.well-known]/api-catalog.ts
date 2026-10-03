// RFC 9727 API catalog, served with the linkset media type.
// (Static-file hosting serves extensionless files as application/octet-stream,
// so this is a server route to control the Content-Type header.)
import { createFileRoute } from "@tanstack/react-router";

const CATALOG = {
  linkset: [
    {
      anchor: "https://skills.mikedemo.dev/",
      item: [
        {
          href: "https://skills.mikedemo.dev/openapi.json",
          title: "Skill Finder Agent API v1 (OpenAPI)",
          type: "application/vnd.oai.openapi+json",
        },
        {
          href: "https://skills.mikedemo.dev/.well-known/agent-card.json",
          title: "Skill Finder agent card",
          type: "application/json",
        },
        {
          href: "https://skills.mikedemo.dev/.well-known/mcp/server-card.json",
          title: "Skill Finder MCP server card",
          type: "application/json",
        },
      ],
    },
  ],
};

export const Route = createFileRoute("/.well-known/api-catalog")({
  server: {
    handlers: {
      GET: () =>
        new Response(JSON.stringify(CATALOG), {
          status: 200,
          headers: {
            "Content-Type":
              'application/linkset+json;profile="https://www.rfc-editor.org/info/rfc9727"',
            "Cache-Control": "public, max-age=3600",
          },
        }),
    },
  },
});
