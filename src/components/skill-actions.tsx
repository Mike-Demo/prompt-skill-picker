import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Codepen, ExternalLink, Github, Loader2 } from "lucide-react";

import { createSkillGist, fetchSkillFiles } from "@/lib/skills.functions";
import { openInCodePen } from "@/lib/codepen";

interface SkillActionsProps {
  readonly id: string;
  readonly name: string;
  readonly htmlUrl: string | null;
  readonly canOpen: boolean;
}

const linkClass =
  "inline-flex items-center gap-1 text-xs font-medium text-primary transition-opacity hover:underline disabled:cursor-not-allowed disabled:opacity-50";

/** Per-skill "open elsewhere" actions: source repo, CodePen, GitHub Gist. */
export function SkillActions({ id, name, htmlUrl, canOpen }: SkillActionsProps) {
  const runFetch = useServerFn(fetchSkillFiles);
  const runGist = useServerFn(createSkillGist);

  const codepen = useMutation({
    mutationFn: async () => {
      const files = await runFetch({ data: { ids: [id] } });
      const file = files[0];
      if (!file) throw new Error("This skill has no markdown file to open.");
      openInCodePen(name, file.content);
    },
  });

  const gist = useMutation({
    mutationFn: async () => {
      const { url } = await runGist({ data: { id } });
      window.open(url, "_blank", "noopener,noreferrer");
    },
  });

  const error = codepen.error ?? gist.error;

  return (
    <div className="mt-2 space-y-1">
      <div className="flex flex-wrap items-center gap-3">
        {htmlUrl ? (
          <a href={htmlUrl} target="_blank" rel="noreferrer" className={linkClass}>
            View source <ExternalLink className="size-3" />
          </a>
        ) : null}
        <button
          type="button"
          className={linkClass}
          disabled={!canOpen || codepen.isPending}
          onClick={() => codepen.mutate()}
        >
          {codepen.isPending ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <Codepen className="size-3" />
          )}
          Open in CodePen
        </button>
        <button
          type="button"
          className={linkClass}
          disabled={!canOpen || gist.isPending}
          onClick={() => gist.mutate()}
        >
          {gist.isPending ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <Github className="size-3" />
          )}
          Open in Gist
        </button>
      </div>
      {error ? (
        <p className="text-xs text-destructive">
          {error instanceof Error ? error.message : "That action failed."}
        </p>
      ) : null}
    </div>
  );
}
