import { Link } from "@tanstack/react-router";

import type { AgentKey } from "@/lib/agents";

/** Route literals kept inline so TanStack can type-check every destination. */
const LINKS = [
  { key: "microsoft-copilot", label: "Microsoft Copilot", to: "/mcp-skills" },
  { key: "superhuman-go", label: "Superhuman Go", to: "/superhuman-go-skills" },
  { key: "chatgpt", label: "ChatGPT", to: "/chatgpt-skills" },
  { key: "grok", label: "Grok", to: "/grok-skills" },
  { key: "perplexity", label: "Perplexity", to: "/perplexity-skills" },
  { key: "claude", label: "Claude", to: "/claude-skills" },
  { key: "github-copilot", label: "GitHub Copilot", to: "/github-copilot-skills" },
] as const;

interface AgentNavProps {
  /** Agent whose page is currently open, rendered as a non-link chip. */
  readonly current?: AgentKey;
  readonly className?: string;
}

/** Cross-links between the per-agent skill collections. */
export function AgentNav({ current, className }: AgentNavProps) {
  return (
    <nav aria-label="Skills by agent" className={className}>
      <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Skills by agent
      </h2>
      <ul className="mt-2 flex flex-wrap gap-2">
        {LINKS.map((link) =>
          link.key === current ? (
            <li key={link.key}>
              <span
                aria-current="page"
                className="inline-flex rounded-full border border-primary bg-accent/40 px-3 py-1 text-xs font-medium text-foreground"
              >
                {link.label}
              </span>
            </li>
          ) : (
            <li key={link.key}>
              <Link
                to={link.to}
                className="inline-flex rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                {link.label}
              </Link>
            </li>
          ),
        )}
      </ul>
    </nav>
  );
}
