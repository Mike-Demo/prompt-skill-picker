import { createFileRoute, Link } from "@tanstack/react-router";
import { WaIcon } from "@/design-system/font-awsome-web-awesome-171158";

const TITLE = "Contact — Skill Finder";
const DESCRIPTION = "How to reach the maker of Skill Finder: email, GitHub, and social profiles.";

export const Route = createFileRoute("/contact")({
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
  component: ContactPage,
});

const rows = [
  {
    label: "Email",
    value: "hey.demo@mikedemo.email",
    href: "mailto:hey.demo@mikedemo.email",
    note: "Best for bug reports, skill listing corrections, and partnership inquiries.",
  },
  {
    label: "GitHub",
    value: "github.com/Mike-Demo/prompt-skill-picker",
    href: "https://github.com/Mike-Demo/prompt-skill-picker",
    note: "File issues and pull requests against the public repo.",
  },
  {
    label: "LinkedIn",
    value: "linkedin.com/in/mikedemopoulos",
    href: "https://www.linkedin.com/in/mikedemopoulos",
    note: "Professional contact and partnership conversations.",
  },
  {
    label: "X",
    value: "x.com/mike_demo",
    href: "https://x.com/mike_demo",
    note: "Quick questions and project updates.",
  },
  {
    label: "Threads",
    value: "threads.com/@mdemop",
    href: "https://www.threads.com/@mdemop",
    note: "Project updates and community chat.",
  },
];

function ContactPage() {
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
            Contact
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            Skill Finder is made by Mike Demopoulos (MikeDemo). Reach out about bugs, incorrect
            skill listings, API questions, or partnership ideas — email is fastest, GitHub issues
            are best for anything code-related.
          </p>
        </header>
        <section className="mt-10">
          <ul className="space-y-4">
            {rows.map((row) => (
              <li key={row.label} className="rounded-lg border border-border bg-card p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {row.label}
                </div>
                <a
                  href={row.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  {row.value}
                  <WaIcon name="arrow-up-right-from-square" aria-hidden="true" />
                </a>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{row.note}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
