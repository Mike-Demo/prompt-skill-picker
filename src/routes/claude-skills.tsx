import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, ExternalLink, Library } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { SelectionBar } from "@/components/selection-bar";
import { downloadSkillsZip } from "@/lib/zip";
import {
  fetchSkillFiles,
  listClaudeSkills,
  type SkillLibraryEntry,
} from "@/lib/skills.functions";
import { isRateLimitMessage, useCooldown } from "@/hooks/use-cooldown";
import { formatInstalls } from "@/lib/format";

const TITLE = "Claude Code Skills — curated skills for Claude agents";
const DESCRIPTION =
  "A curated, most-used-first list of Claude Code skills from the open skills registry, with install directions and a one-click zip download of the SKILL.md files.";
const SHARE_IMAGE = "https://skills.mikedemo.dev/og-skill-finder.jpg";
const CANONICAL = "https://skills.mikedemo.dev/claude-skills";

export const Route = createFileRoute("/claude-skills")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: CANONICAL },
      { property: "og:image", content: SHARE_IMAGE },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: SHARE_IMAGE },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
  }),
  component: ClaudeSkillsPage,
});

/** Registry install command for a single skill. */
function installCommand(entry: SkillLibraryEntry): string {
  return `npx skills use "https://github.com/${entry.source}" --skill "${entry.skillId}"`;
}

function ClaudeSkillsPage() {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const loadSkills = useServerFn(listClaudeSkills);
  const runFetch = useServerFn(fetchSkillFiles);

  const skills = useQuery({
    queryKey: ["claude-skills"],
    queryFn: () => loadSkills(),
    staleTime: 30 * 60 * 1000,
    retry: (attempt, error) => attempt < 2 && !isRateLimitMessage(error),
  });

  // A rate-limited load recovers on its own once the cooldown expires.
  useCooldown(skills.error, () => {
    void skills.refetch();
  });

  const download = useMutation({
    mutationFn: async (ids: string[]) => {
      const files = await runFetch({ data: { ids } });
      if (files.length === 0) throw new Error("None of the selected skills could be downloaded.");
      await downloadSkillsZip(files, "claude-skills.zip");
    },
  });

  const downloadCooldown = useCooldown(download.error, () => {
    if (selected.size > 0) download.mutate([...selected]);
  });

  const entries: SkillLibraryEntry[] = skills.data ?? [];

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <main className="min-h-screen bg-background pb-32">
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-16">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3" /> Back to search
        </Link>

        <header className="mt-4 space-y-3">
          <div className="flex items-center gap-3">
            <img
              src="/favicon.svg"
              alt=""
              aria-hidden="true"
              width={56}
              height={56}
              className="size-14 shrink-0"
            />
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Claude Code Skills
            </h1>
          </div>
          <p className="text-sm text-muted-foreground sm:text-base">
            Skills are plain <code className="text-foreground">SKILL.md</code> files, so every skill
            in the open registry works in Claude Code. These are the ones Claude Code users reach for
            most — code review, refactoring, debugging, testing and docs — ordered by install count.
          </p>
          <Link
            to="/library"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            <Library className="size-4" /> Browse the full skill library
          </Link>
        </header>

        <section className="mt-8 rounded-lg border border-border bg-muted/40 p-4">
          <h2 className="text-sm font-semibold text-foreground">How to install a skill</h2>
          <ol className="mt-3 space-y-3 text-sm text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">1. Install from the registry.</span> Run
              the per-skill command shown on each card below from your project root — it writes the
              skill into your project&rsquo;s skills directory:
              <pre className="mt-1 overflow-auto rounded-md bg-muted p-3 text-xs text-foreground">
                <code>npx skills use &quot;https://github.com/owner/repo&quot; --skill &quot;skill-name&quot;</code>
              </pre>
            </li>
            <li>
              <span className="font-medium text-foreground">2. Or install by hand.</span> Tick the
              skills you want, download the zip, and drop each{" "}
              <code className="text-foreground">SKILL.md</code> into{" "}
              <code className="text-foreground">.claude/skills/&lt;skill-name&gt;/SKILL.md</code> in
              your project (or <code className="text-foreground">~/.claude/skills/</code> to make it
              available everywhere).
            </li>
            <li>
              <span className="font-medium text-foreground">3. Use it.</span> Start a new Claude Code
              session so it picks up the directory, then ask for the task the skill covers — Claude
              loads the matching skill on its own. Type{" "}
              <code className="text-foreground">/</code> to see the ones it found.
            </li>
          </ol>
        </section>

        {skills.isError ? (
          <p className="mt-6 rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {skills.error instanceof Error
              ? skills.error.message
              : "Could not load the Claude skills list."}
          </p>
        ) : null}

        {skills.isPending ? (
          <ul className="mt-8 space-y-3">
            {[0, 1, 2, 3, 4].map((key) => (
              <li key={key} className="rounded-lg border border-border p-4">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="mt-3 h-4 w-full" />
                <Skeleton className="mt-2 h-10 w-full" />
              </li>
            ))}
          </ul>
        ) : null}

        {skills.isSuccess && entries.length === 0 ? (
          <p className="mt-8 rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            The registry returned no skills just now. Try again in a moment.
          </p>
        ) : null}

        {entries.length > 0 ? (
          <>
            <h2 className="mt-10 text-sm font-semibold text-foreground">
              Curated skills — most installed first
            </h2>
            <ul className="mt-3 space-y-3">
              {entries.map((entry) => {
                const checked = selected.has(entry.id);
                return (
                  <li
                    key={entry.id}
                    className={`rounded-lg border p-4 transition-colors ${
                      checked ? "border-primary bg-accent/40" : "border-border"
                    }`}
                  >
                    <div className="flex gap-3">
                      <Checkbox
                        id={`claude-${entry.id}`}
                        checked={checked}
                        onCheckedChange={() => toggle(entry.id)}
                        className="mt-1"
                      />
                      <div className="min-w-0 flex-1">
                        <label
                          htmlFor={`claude-${entry.id}`}
                          className="block cursor-pointer text-sm font-semibold text-foreground"
                        >
                          {entry.name}
                        </label>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="truncate">{entry.source}</span>
                          <Badge variant="secondary">{formatInstalls(entry.installs)}</Badge>
                        </div>
                        {entry.description ? (
                          <p className="mt-2 text-sm text-muted-foreground">{entry.description}</p>
                        ) : null}
                        <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Install
                        </p>
                        <pre className="mt-1 overflow-auto rounded-md bg-muted p-3 text-xs leading-relaxed text-foreground">
                          <code>{installCommand(entry)}</code>
                        </pre>
                        {entry.htmlUrl ? (
                          <a
                            href={entry.htmlUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                          >
                            View source <ExternalLink className="size-3" />
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        ) : null}
      </div>

      <SelectionBar
        count={selected.size}
        pending={download.isPending}
        cooldown={downloadCooldown}
        error={download.isError ? download.error : null}
        onDownload={() => download.mutate([...selected])}
      />
    </main>
  );
}
