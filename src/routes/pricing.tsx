import { createFileRoute, Link } from "@tanstack/react-router";
import { WaIcon } from "@/design-system/font-awsome-web-awesome-171158";

const TITLE = "Pricing — Skill Finder";
const DESCRIPTION = "Skill Finder is free: no paid tiers, no usage billing, no premium features.";

export const Route = createFileRoute("/pricing")({
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
  component: PricingPage,
});

function PricingPage() {
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
            Pricing
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            Skill Finder is free. There are no paid tiers, no usage-based billing, and no premium
            features — everything below is included for everyone.
          </p>
        </header>
        <section className="mt-10">
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-baseline justify-between">
              <h2 className="text-xl font-semibold text-foreground">Free</h2>
              <span className="text-2xl font-semibold text-foreground">$0</span>
            </div>
            <ul className="mt-4 space-y-2 text-sm leading-relaxed text-muted-foreground">
              <li>Unlimited browsing and searching of the skill library</li>
              <li>Unlimited use of the read-only JSON API — no key required</li>
              <li>Unlimited use of the MCP server — no authentication required</li>
              <li>Download skill bundles as zip files</li>
              <li>
                Machine-readable pricing at{" "}
                <a href="/pricing.md" className="font-medium text-primary hover:underline">
                  /pricing.md
                </a>
              </li>
            </ul>
          </div>
        </section>
        <section className="mt-10 space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
          <h2 className="text-lg font-semibold text-foreground">Fair use</h2>
          <p>
            Rate limits apply per IP to keep the service stable for everyone. Exceeding a limit
            returns HTTP 429 with a Retry-After header. The optional AI-ranked homepage search is
            also free and rate-limited per visitor (30 requests/minute, 500/day); it can optionally
            use your own OpenAI key, which is sent per request and never stored.
          </p>
        </section>
      </div>
    </main>
  );
}
