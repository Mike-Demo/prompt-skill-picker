import { createFileRoute, Link } from "@tanstack/react-router";

import { WaIcon } from "@/design-system/font-awsome-web-awesome-171158";

const TITLE = "Agent API — read-only JSON access to Skill Finder";
const DESCRIPTION =
  "Free, read-only JSON API for AI agents to search the Skill Finder catalogue and list curated skills per agent. No key or captcha required.";
const CANONICAL = "https://skills.mikedemo.dev/docs/api";

export const Route = createFileRoute("/docs/api")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "article" },
      { property: "og:url", content: CANONICAL },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
  }),
  component: ApiDocsPage,
});

interface Endpoint {
  path: string;
  summary: string;
  params: readonly string[];
  example: string;
}

const ENDPOINTS: readonly Endpoint[] = [
  {
    path: "GET /api/public/skills",
    summary: "Keyword search over the catalogue, most-installed first.",
    params: ["q: keywords, up to 100 characters (optional)", "limit: 1 to 50, default 20"],
    example: "/api/public/skills?q=react&limit=5",
  },
  {
    path: "GET /api/public/skills/agent/{agent}",
    summary: "The curated list shown on one agent page.",
    params: [
      "agent: mcp, superhuman-go, chatgpt, grok, perplexity, claude, github-copilot, cursor, wordpress",
    ],
    example: "/api/public/skills/agent/claude",
  },
];

const RESOURCES = [
  { href: "/openapi.json", label: "OpenAPI spec" },
  { href: "/llms.txt", label: "llms.txt" },
  { href: "/.well-known/agent.json", label: "Agent card" },
] as const;

function ApiDocsPage() {
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
            Agent API
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            A free, read-only JSON API so AI agents can use the skill catalogue without the
            captcha. No key needed. Each visitor can make 30 requests a minute and 500 a day;
            over that you get a 429 with a Retry-After header.
          </p>
        </header>

        <section className="mt-10 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Endpoints</h2>
          {ENDPOINTS.map((endpoint) => (
            <article key={endpoint.path} className="rounded-lg border border-border bg-card p-4">
              <h3 className="font-mono text-sm font-semibold text-foreground">{endpoint.path}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{endpoint.summary}</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                {endpoint.params.map((param) => (
                  <li key={param}>{param}</li>
                ))}
              </ul>
              <a
                href={endpoint.example}
                className="mt-3 inline-block font-mono text-xs text-primary hover:underline"
              >
                {endpoint.example}
              </a>
            </article>
          ))}
        </section>

        <section className="mt-10 space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Each skill includes</h2>
          <p className="text-sm text-muted-foreground">
            id, name, description, source (GitHub owner/repo), installs, installCommand and url.
          </p>
        </section>

        <section className="mt-10 space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Machine-readable resources</h2>
          <ul className="flex flex-wrap gap-4 text-sm">
            {RESOURCES.map((resource) => (
              <li key={resource.href}>
                <a href={resource.href} className="font-medium text-primary hover:underline">
                  {resource.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
