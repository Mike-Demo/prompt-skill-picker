import { createFileRoute, Link } from "@tanstack/react-router";
import { WaIcon } from "@/design-system/font-awsome-web-awesome-171158";

const TITLE = "Privacy — Skill Finder";
const DESCRIPTION =
  "What data Skill Finder collects and what it does not: no accounts, no stored keys, minimal analytics.";

export const Route = createFileRoute("/privacy")({
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
  component: PrivacyPage,
});

function PrivacyPage() {
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
            Privacy
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            Skill Finder is designed to collect as little as possible. There are no accounts, no
            sign-ups, and no advertising profiles.
          </p>
        </header>
        <section className="mt-10 space-y-6 text-sm leading-relaxed text-muted-foreground sm:text-base">
          <div>
            <h2 className="text-lg font-semibold text-foreground">What we don't collect</h2>
            <p className="mt-2">
              We don't ask for your name, email, or any account details. The public JSON API and the
              MCP server need no API key, so there are no credentials to store, leak, or revoke. If
              you use the optional "bring your own OpenAI key" mode for AI-ranked search, your key
              lives only in your browser's memory, is sent per request, and is never logged or
              stored on our servers.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">What we do collect</h2>
            <p className="mt-2">
              Two lightweight things keep the service running: (1) private, self-hosted analytics
              (umami-lite) recording anonymous page views — no cross-site tracking, no ad-tech; and
              (2) per-IP rate-limit counters so one visitor can't degrade the service for everyone
              else. Rate-limit data expires automatically (windows older than one day are deleted).
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">In your browser only</h2>
            <p className="mt-2">
              Recent searches and UI preferences are stored in your browser's localStorage and never
              sent to us. Clearing your browser storage removes them.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Third parties</h2>
            <p className="mt-2">
              Skill listings link out to skills.sh and GitHub; following those links is subject to
              their privacy policies. If you enable the OpenAI-key mode, your prompts go directly to
              OpenAI's API under their terms.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Questions</h2>
            <p className="mt-2">
              Contact{" "}
              <a
                href="mailto:hey.demo@mikedemo.email"
                className="font-medium text-primary hover:underline"
              >
                hey.demo@mikedemo.email
              </a>{" "}
              with any privacy question.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
