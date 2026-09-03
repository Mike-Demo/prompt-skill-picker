import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { Download, ExternalLink, Library, Loader2, Search, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { downloadSkillsZip } from "@/lib/zip";
import {
  enhancePrompt,
  fetchSkillFiles,
  getCaptchaSitekey,
  searchSkills,
  type SkillSuggestion,
} from "@/lib/skills.functions";
import { formatInstalls } from "@/lib/format";
import { useCooldown } from "@/hooks/use-cooldown";

const TITLE = "Skill Finder — discover and bundle agent skills";
const DESCRIPTION =
  "Describe what you want your AI agent to do, get ranked skill suggestions from the open skills registry, and download the ones you pick as a single zip.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SkillFinderPage,
});

const EXAMPLES = [
  "Write better React components and review pull requests",
  "Design polished landing pages",
  "Process PDFs and spreadsheets",
];

function SkillFinderPage() {
  const [prompt, setPrompt] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<HCaptcha | null>(null);

  const runSearch = useServerFn(searchSkills);
  const runFetch = useServerFn(fetchSkillFiles);
  const runEnhance = useServerFn(enhancePrompt);
  const fetchSitekey = useServerFn(getCaptchaSitekey);

  const sitekeyQuery = useQuery({ queryKey: ["captcha-sitekey"], queryFn: fetchSitekey });

  const search = useMutation({
    mutationFn: (value: { prompt: string; captchaToken: string }) =>
      runSearch({ data: value }),
    onSuccess: () => setSelected(new Set()),
    onSettled: () => {
      // hCaptcha tokens are single-use; force a fresh challenge each search.
      captchaRef.current?.resetCaptcha();
      setCaptchaToken(null);
    },
  });

  const enhance = useMutation({
    mutationFn: (value: { prompt: string; captchaToken: string }) =>
      runEnhance({ data: value }),
    onSuccess: (result) => setPrompt(result.enhanced),
    // The verified token stays valid server-side for a few minutes, so the
    // same captcha solve still covers the search that follows an enhance.
  });

  const download = useMutation({
    mutationFn: async (ids: string[]) => {
      const files = await runFetch({ data: { ids } });
      if (files.length === 0) throw new Error("None of the selected skills could be downloaded.");
      await downloadSkillsZip(files);
    },
  });

  const results: SkillSuggestion[] = search.data ?? [];

  // A rate-limited attempt retries itself once the cooldown ends, but only when
  // a captcha token is still available: hCaptcha tokens are single-use and the
  // widget resets after each attempt, so usually the user must confirm again.
  const searchCooldown = useCooldown(search.error, () => {
    const trimmed = prompt.trim();
    if (trimmed.length >= 3 && captchaToken) search.mutate({ prompt: trimmed, captchaToken });
  });
  const enhanceCooldown = useCooldown(enhance.error, () => {
    const trimmed = prompt.trim();
    if (trimmed.length >= 3 && captchaToken) enhance.mutate({ prompt: trimmed, captchaToken });
  });
  const downloadCooldown = useCooldown(download.error, () => {
    if (selected.size > 0) download.mutate([...selected]);
  });
  const cooldown = Math.max(searchCooldown, enhanceCooldown);
  const busy = search.isPending || enhance.isPending || cooldown > 0;

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const submit = (value: string) => {
    const trimmed = value.trim();
    if (trimmed.length < 3 || busy || !captchaToken) return;
    search.mutate({ prompt: trimmed, captchaToken });
  };

  const runEnhanceClick = () => {
    const trimmed = prompt.trim();
    if (trimmed.length < 3 || busy || !captchaToken) return;
    enhance.mutate({ prompt: trimmed, captchaToken });
  };

  return (
    <main className="bg-background">
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-16">
        <header className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Skill Finder
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Describe what you want your agent to do. We search the open skills registry, rank the
            matches with AI, and bundle the ones you pick into a zip of markdown files.
          </p>
          <Link
            to="/library"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            <Library className="size-4" /> Browse the full skill library
          </Link>
        </header>

        <form
          className="mt-8 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            submit(prompt);
          }}
        >
          <Textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="e.g. help me write better React components and review pull requests"
            rows={3}
            className="resize-none text-base"
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                event.preventDefault();
                submit(prompt);
              }
            }}
          />
          {sitekeyQuery.data ? (
            <HCaptcha
              ref={captchaRef}
              sitekey={sitekeyQuery.data}
              onVerify={(token) => setCaptchaToken(token)}
              onExpire={() => setCaptchaToken(null)}
              onError={() => setCaptchaToken(null)}
            />
          ) : (
            <Skeleton className="h-[78px] w-[303px]" />
          )}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="submit"
              disabled={prompt.trim().length < 3 || busy || !captchaToken}
            >
              {search.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Search className="size-4" />
              )}
              {cooldown > 0 ? `Find skills in ${cooldown}s` : "Find skills"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={prompt.trim().length < 3 || busy || !captchaToken}
              onClick={runEnhanceClick}
            >
              {enhance.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              Enhance
            </Button>
            {EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                onClick={() => {
                  setPrompt(example);
                  submit(example);
                }}
              >
                {example}
              </button>
            ))}
          </div>
        </form>

        {enhance.isError ? (
          <p className="mt-6 rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {enhance.error instanceof Error ? enhance.error.message : "Enhance failed."}
          </p>
        ) : null}

        {search.isError ? (
          <div className="mt-6 rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            <p>{search.error instanceof Error ? search.error.message : "Search failed."}</p>
            {cooldown === 0 && !captchaToken ? (
              <p className="mt-1 text-destructive/80">
                Confirm the captcha above and we&rsquo;ll try again.
              </p>
            ) : null}
          </div>
        ) : null}

        {search.isPending ? (
          <ul className="mt-8 space-y-3">
            {[0, 1, 2, 3].map((key) => (
              <li key={key} className="rounded-lg border border-border p-4">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="mt-3 h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-2/3" />
              </li>
            ))}
          </ul>
        ) : null}

        {!search.isPending && search.isSuccess && results.length === 0 ? (
          <p className="mt-8 rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No matching skills found. Try describing the task differently.
          </p>
        ) : null}

        {results.length > 0 ? (
          <ul className="mt-8 space-y-3">
            {results.map((skill) => {
              const checked = selected.has(skill.id);
              return (
                <li
                  key={skill.id}
                  className={`rounded-lg border p-4 transition-colors ${
                    checked ? "border-primary bg-accent/40" : "border-border"
                  }`}
                >
                  <div className="flex gap-3">
                    <Checkbox
                      id={skill.id}
                      checked={checked}
                      disabled={!skill.hasMarkdown}
                      onCheckedChange={() => toggle(skill.id)}
                      className="mt-1"
                    />
                    <div className="min-w-0 flex-1">
                      <label
                        htmlFor={skill.id}
                        className="block cursor-pointer text-sm font-semibold text-foreground"
                      >
                        {skill.name}
                      </label>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="truncate">{skill.source}</span>
                        <Badge variant="secondary">{formatInstalls(skill.installs)}</Badge>
                        {!skill.hasMarkdown ? (
                          <Badge variant="outline">no markdown available</Badge>
                        ) : null}
                      </div>
                      {skill.description ? (
                        <p className="mt-2 text-sm text-muted-foreground">{skill.description}</p>
                      ) : null}
                      {skill.reason ? (
                        <p className="mt-2 text-sm text-foreground">{skill.reason}</p>
                      ) : null}
                      {skill.htmlUrl ? (
                        <a
                          href={skill.htmlUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
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
        ) : null}
      </div>

      {selected.size > 0 ? (
        <div className="fixed inset-x-0 bottom-0 border-t border-border bg-card/95 backdrop-blur">
          <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-3">
            <div className="text-sm text-muted-foreground">
              {selected.size} selected
              {download.isError ? (
                <span className="block text-destructive">
                  {download.error instanceof Error ? download.error.message : "Download failed."}
                </span>
              ) : null}
            </div>
            <Button
              onClick={() => download.mutate([...selected])}
              disabled={download.isPending || downloadCooldown > 0}
            >
              {download.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              {downloadCooldown > 0 ? `Retry in ${downloadCooldown}s` : "Download zip"}
            </Button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
