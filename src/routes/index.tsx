import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import HCaptcha from "@hcaptcha/react-hcaptcha";

import { SelectionBar } from "@/components/selection-bar";
import { SkillResultCard } from "@/components/skill-result-card";
import { AgentNav } from "@/components/agent-nav";
import {
  WaButton,
  WaCallout,

  WaIcon,
  WaSkeleton,
  WaTextarea,
  WaTooltip,
} from "@/design-system/font-awsome-web-awesome-171158";

import {
  addRecentSearch,
  clearRecentSearches,
  readRecentSearches,
  type RecentSearch,
} from "@/lib/recent-searches";
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
const SHARE_IMAGE = "https://skills.mikedemo.dev/og-skill-finder.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://skills.mikedemo.dev/" },
      { property: "og:image", content: SHARE_IMAGE },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: SHARE_IMAGE },
    ],
    links: [{ rel: "canonical", href: "https://skills.mikedemo.dev/" }],
  }),
  component: SkillFinderPage,
});

const EXAMPLES = [
  "Write better React components and review pull requests",
  "Design polished landing pages",
  "Process PDFs and spreadsheets",
];

type TextareaHost = HTMLElement & { value: string };

function SkillFinderPage() {
  const [prompt, setPrompt] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [recent, setRecent] = useState<RecentSearch[]>([]);
  const [enhanceHint, setEnhanceHint] = useState<string | null>(null);
  const captchaRef = useRef<HCaptcha | null>(null);
  const enhanceHintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Local storage is browser-only, so hydrate the list after mount.
  useEffect(() => setRecent(readRecentSearches()), []);

  const runSearch = useServerFn(searchSkills);
  const runFetch = useServerFn(fetchSkillFiles);
  const runEnhance = useServerFn(enhancePrompt);
  const fetchSitekey = useServerFn(getCaptchaSitekey);

  const sitekeyQuery = useQuery({ queryKey: ["captcha-sitekey"], queryFn: fetchSitekey });

  const search = useMutation({
    mutationFn: (value: { prompt: string; captchaToken: string }) =>
      runSearch({ data: value }),
    onMutate: () => setShareToken(null),
    onSuccess: (response, value) => {
      setSelected(new Set());
      setShareToken(response.token);
      if (response.token) setRecent(addRecentSearch(value.prompt, response.token));
    },
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

  const results: SkillSuggestion[] = search.data?.results ?? [];

  const copyShareLink = async () => {
    if (!shareToken) return;
    await navigator.clipboard.writeText(`${window.location.origin}/s/${shareToken}`);
    setShareCopied(true);
    window.setTimeout(() => setShareCopied(false), 2000);
  };

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

  const showEnhanceHint = (message: string) => {
    if (enhanceHintTimer.current) clearTimeout(enhanceHintTimer.current);
    setEnhanceHint(message);
    enhanceHintTimer.current = setTimeout(() => setEnhanceHint(null), 4000);
  };

  const runEnhanceClick = () => {
    const trimmed = prompt.trim();
    if (trimmed.length < 3 || busy) return;
    if (!captchaToken) {
      showEnhanceHint("Complete the CAPTCHA first to use Enhance.");
      return;
    }
    enhance.mutate({ prompt: trimmed, captchaToken });
  };

  return (
    <main className="bg-background">
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-16">
        <header className="space-y-3">
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
              Skill Finder — discover and bundle AI agent skills
            </h1>
          </div>
          <p className="text-sm text-muted-foreground sm:text-base">
            Describe what you want your agent to do. We search the open skills registry, rank the
            matches with AI, and bundle the ones you pick into a zip of markdown files.
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link
              to="/library"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              <WaIcon name="book-open" label="Library" /> Browse the full skill library
            </Link>
          </div>
          <AgentNav />
        </header>


        <form
          className="mt-8 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            submit(prompt);
          }}
        >
          <div className="relative">
            <WaTextarea
              value={prompt}
              rows={3}
              resize="none"
              placeholder="e.g. help me write better React components and review pull requests"
              aria-label="Describe what you want your agent to do"
              className="w-full"
              onInput={(event: React.FormEvent<HTMLElement>) => {
                setPrompt((event.currentTarget as TextareaHost).value);
              }}
              onKeyDown={(event: React.KeyboardEvent<HTMLElement>) => {
                if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                  event.preventDefault();
                  submit(prompt);
                }
              }}
            />
            <WaButton
              id="enhance-btn"
              type="button"
              appearance="plain"
              size="xs"
              pill
              disabled={prompt.trim().length < 3 || busy}
              onClick={runEnhanceClick}
              className="absolute bottom-2 right-2"
              aria-label="Enhance prompt with AI"
            >
              <WaIcon
                name={enhance.isPending ? "spinner" : "wand-magic-sparkles"}
                animation={enhance.isPending ? "spin" : undefined}
                label="Enhance"
              />
            </WaButton>
            <WaTooltip for="enhance-btn" placement="left">
              {enhance.isPending ? "Enhancing…" : "Enhance with AI for sharper matches"}
            </WaTooltip>
          </div>
          <div className="flex flex-wrap justify-center gap-2 pt-1">
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
          {enhanceHint ? (
            <p className="text-xs text-muted-foreground">{enhanceHint}</p>
          ) : null}
          <div className="flex justify-center">
            {sitekeyQuery.data ? (
              <HCaptcha
                ref={captchaRef}
                sitekey={sitekeyQuery.data}
                onVerify={(token) => setCaptchaToken(token)}
                onExpire={() => setCaptchaToken(null)}
                onError={() => setCaptchaToken(null)}
              />
            ) : (
              <WaSkeleton className="h-[78px] w-[303px]" />
            )}
          </div>
          <div className="flex justify-center">
            <WaButton
              type="submit"
              variant="brand"
              loading={search.isPending}
              disabled={prompt.trim().length < 3 || busy || !captchaToken}
            >
              <WaIcon name="magnifying-glass" />
              {cooldown > 0 ? `Find skills in ${cooldown}s` : "Find skills"}
            </WaButton>
          </div>
        </form>

        {enhance.isError ? (
          <WaCallout variant="danger" className="mt-6">
            {enhance.error instanceof Error ? enhance.error.message : "Enhance failed."}
          </WaCallout>
        ) : null}

        {search.isError ? (
          <WaCallout variant="danger" className="mt-6">
            <p>{search.error instanceof Error ? search.error.message : "Search failed."}</p>
            {cooldown === 0 && !captchaToken ? (
              <p className="mt-1">Confirm the captcha above and we&rsquo;ll try again.</p>
            ) : null}
          </WaCallout>
        ) : null}


        {search.isPending ? (
          <ul className="mt-8 space-y-3">
            {[0, 1, 2, 3].map((key) => (
              <li key={key} className="rounded-lg border border-border p-4">
                <WaSkeleton className="h-5 w-1/2" />
                <WaSkeleton className="mt-3 h-4 w-full" />
                <WaSkeleton className="mt-2 h-4 w-2/3" />
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
          <>
            {shareToken ? (
              <div className="mt-8 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
                <span className="text-muted-foreground">
                  These results are saved for 72 hours — share or revisit them with a link.
                </span>
                <WaButton
                  type="button"
                  variant="neutral"
                  appearance="outlined"
                  size="s"
                  onClick={copyShareLink}
                >
                  <WaIcon name={shareCopied ? "check" : "link"} />
                  {shareCopied ? "Copied" : "Copy share link"}
                </WaButton>
              </div>
            ) : null}
            <ul className="mt-4 space-y-3">
              {results.map((skill) => (
                <SkillResultCard
                  key={skill.id}
                  skill={skill}
                  checked={selected.has(skill.id)}
                  onToggle={toggle}
                />
              ))}
            </ul>
          </>
        ) : null}

        {recent.length > 0 ? (
          <section className="mt-12">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-foreground">Recent searches</h2>
              <WaButton
                type="button"
                appearance="plain"
                size="xs"
                onClick={() => {
                  clearRecentSearches();
                  setRecent([]);
                }}
              >
                <WaIcon name="trash" />
                Clear
              </WaButton>
            </div>
            <ul className="mt-2 space-y-1">
              {recent.map((entry) => (
                <li key={entry.token}>
                  <Link
                    to="/s/$token"
                    params={{ token: entry.token }}
                    className="block truncate rounded px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    {entry.prompt}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
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
