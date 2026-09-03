import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ExternalLink } from "lucide-react";

import {
  assetCredits,
  dataCredits,
  libraryCredits,
  typefaceCredits,
  type LicenseEntry,
} from "@/lib/licenses";

const TITLE = "Open source licenses & credits — Skill Finder";
const DESCRIPTION =
  "The open source libraries, icon artwork, and data sources that Skill Finder is built on, with their authors and licenses.";

export const Route = createFileRoute("/licenses")({
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
  component: LicensesPage,
});

function CreditList({ entries }: { entries: readonly LicenseEntry[] }) {
  return (
    <ul className="mt-4 space-y-4">
      {entries.map((entry) => (
        <li key={entry.name} className="rounded-lg border border-border bg-card p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-sm font-semibold text-foreground">{entry.name}</h3>
            <span className="text-xs text-muted-foreground">{entry.license}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{entry.author}</p>
          {entry.note ? (
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{entry.note}</p>
          ) : null}
          <a
            href={entry.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            License source
            <ExternalLink className="size-3" aria-hidden="true" />
          </a>
        </li>
      ))}
    </ul>
  );
}

function LicensesPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-16">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to search
        </Link>

        <header className="mt-6 space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Open source & credits
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Skill Finder is built on open source software and freely licensed artwork. Everything it
            depends on is credited below.
          </p>
        </header>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-foreground">Typeface</h2>
          <CreditList entries={typefaceCredits} />
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-foreground">Artwork</h2>
          <CreditList entries={assetCredits} />
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-foreground">Open source libraries</h2>
          <CreditList entries={libraryCredits} />
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-foreground">Data sources</h2>
          <CreditList entries={dataCredits} />
        </section>
      </div>
    </main>
  );
}
