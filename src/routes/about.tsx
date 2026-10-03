import { createFileRoute, Link } from "@tanstack/react-router";
import { WaIcon } from "@/design-system/font-awsome-web-awesome-171158";

const TITLE = "About — Skill Finder";
const DESCRIPTION = "What Skill Finder is, who makes it, and where its skill data comes from.";

export const Route = createFileRoute("/about")({
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
  component: AboutPage,
});

function AboutPage() {
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
            About Skill Finder
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            Skill Finder helps people discover, compare, and download open "agent skills" — SKILL.md
            instruction files that teach AI coding agents (Claude Code, Cursor, GitHub Copilot,
            ChatGPT, and others) how to do specific tasks well.
          </p>
        </header>
        <section className="mt-10 space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
          <h2 className="text-lg font-semibold text-foreground">How it works</h2>
          <p>
            Describe what you want your agent to do. Skill Finder searches the open skills registry
            (skills.sh) and GitHub, ranks the matches, and lets you bundle the ones you pick into a
            single zip of markdown files you can drop into your agent's skills directory.
          </p>
          <p>
            Every skill in the catalogue is ranked by install count from the open registry, so the
            most battle-tested instructions float to the top. Each listing shows a one-command
            install string and a link to the skill's SKILL.md source.
          </p>
        </section>
        <section className="mt-10 space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
          <h2 className="text-lg font-semibold text-foreground">For AI agents</h2>
          <p>
            Skill Finder is built to be used by agents as well as humans. A free, read-only JSON API
            and an MCP server expose the whole catalogue with no API key and no authentication.
            Machine-readable entry points live in{" "}
            <a href="/llms.txt" className="font-medium text-primary hover:underline">
              llms.txt
            </a>
            ,{" "}
            <a
              href="/.well-known/agent-card.json"
              className="font-medium text-primary hover:underline"
            >
              the agent card
            </a>
            , and{" "}
            <a href="/openapi.json" className="font-medium text-primary hover:underline">
              the OpenAPI spec
            </a>
            . Start at the{" "}
            <Link to="/developers" className="font-medium text-primary hover:underline">
              developer portal
            </Link>
            .
          </p>
        </section>
        <section className="mt-10 space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
          <h2 className="text-lg font-semibold text-foreground">Who makes it</h2>
          <p>
            Skill Finder is a free side project by Mike Demopoulos (MikeDemo), a partnerships and
            alliances leader in cloud infrastructure and open source who builds AI workflow tooling.
            It is free to use, with no accounts, no paid tiers, and no tracking beyond lightweight
            private analytics. The source code is on{" "}
            <a
              href="https://github.com/Mike-Demo/prompt-skill-picker"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline"
            >
              GitHub
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
