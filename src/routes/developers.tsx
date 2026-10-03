import { createFileRoute, Link } from "@tanstack/react-router";
import { WaIcon } from "@/design-system/font-awsome-web-awesome-171158";

const TITLE = "Developer portal — Skill Finder";
const DESCRIPTION =
  "API keys (none needed), documentation, quickstart, and discovery docs for building on the Skill Finder API and MCP server.";

export const Route = createFileRoute("/developers")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DevelopersPage,
});

function Code({ children }: { children: string }) {
  return (
    <code className="block overflow-x-auto rounded-lg border border-border bg-card p-3 font-mono text-xs leading-relaxed text-foreground">
      {children}
    </code>
  );
}

function DocList({ items }: { items: { href: string; label: string; note: string }[] }) {
  return (
    <ul className="mt-3 space-y-2">
      {items.map((item) => (
        <li key={item.href} className="text-sm">
          <a href={item.href} className="font-medium text-primary hover:underline">
            {item.label}
          </a>
          <span className="text-muted-foreground"> — {item.note}</span>
        </li>
      ))}
    </ul>
  );
}

function DevelopersPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-16">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          <WaIcon name="arrow-left" aria-hidden="true" />
          Back to search
        </Link>
        <header className="mt-6 space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Developer portal
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            Everything agents and developers need to build on Skill Finder: a free, read-only JSON
            API and MCP server. No API keys, no accounts, no authentication — just call it.
          </p>
        </header>

        <section className="mt-10 space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Quickstart</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Search the catalogue for React skills and take the top 5:
          </p>
          <Code>{`curl "https://skills.mikedemo.dev/api/public/v1/skills?q=react&limit=5"`}</Code>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Fetch one skill's details (URL-encode the id — it contains slashes):
          </p>
          <Code>{`curl "https://skills.mikedemo.dev/api/public/v1/skills/mattpocock%2Fskills%2Fgrill-me"`}</Code>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Responses use a <code className="font-mono text-xs">{"{ data, meta }"}</code> envelope
            on success and{" "}
            <code className="font-mono text-xs">{"{ error: { code, message } }"}</code> on failure.
            List endpoints are paged with <code className="font-mono text-xs">limit</code> and{" "}
            <code className="font-mono text-xs">offset</code>; check{" "}
            <code className="font-mono text-xs">meta</code> for totals.
          </p>
        </section>

        <section className="mt-10 space-y-3">
          <h2 className="text-lg font-semibold text-foreground">MCP server</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Prefer MCP? Connect to{" "}
            <code className="font-mono text-xs">https://skills.mikedemo.dev/mcp</code> (Streamable
            HTTP, no auth) with tools <code className="font-mono text-xs">search_skills</code>,{" "}
            <code className="font-mono text-xs">get_skill</code>, and{" "}
            <code className="font-mono text-xs">list_agents</code> — all read-only.
          </p>
        </section>

        <section className="mt-10 space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Limits</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Anonymous use is rate-limited per IP to keep the service stable. Exceeding a limit
            returns HTTP <code className="font-mono text-xs">429</code> with a{" "}
            <code className="font-mono text-xs">Retry-After</code> header — back off and retry.
            Current limits and feature flags are published at{" "}
            <a
              href="/api/public/v1/capabilities"
              className="font-medium text-primary hover:underline"
            >
              /api/public/v1/capabilities
            </a>
            .
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-foreground">Discovery documents</h2>
          <DocList
            items={[
              {
                href: "/llms.txt",
                label: "llms.txt",
                note: "agent-readable site summary with when-to-use guidance",
              },
              { href: "/docs/api", label: "API docs", note: "human-readable reference" },
              {
                href: "/openapi.json",
                label: "openapi.json",
                note: "machine-readable OpenAPI spec",
              },
              { href: "/auth.md", label: "auth.md", note: "authentication model (none required)" },
              {
                href: "/.well-known/agent-card.json",
                label: "agent card",
                note: "A2A-style capability card",
              },
              {
                href: "/.well-known/agent-skills/index.json",
                label: "agent skills index",
                note: "capability index for agents",
              },
              {
                href: "/.well-known/mcp/server-card.json",
                label: "MCP server card",
                note: "branded MCP listing",
              },
              {
                href: "/.well-known/ard.json",
                label: "ard.json",
                note: "Agentic Resource Discovery catalog",
              },
              {
                href: "/.well-known/api-catalog",
                label: "api-catalog",
                note: "RFC 9727 API catalog",
              },
            ]}
          />
        </section>
      </div>
    </main>
  );
}
