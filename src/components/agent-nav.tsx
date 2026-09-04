import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

import type { AgentKey } from "@/lib/agents";
import perplexityIcon from "@/assets/perplexity.svg";

/** Route literals kept inline so TanStack can type-check every destination. */
const LINKS: ReadonlyArray<{
  key: AgentKey;
  label: string;
  to: string;
  icon: ReactNode;
}> = [
  {
    key: "microsoft-copilot",
    label: "Microsoft Copilot",
    to: "/mcp-skills",
    icon: <i className="fa-brands fa-microsoft" aria-hidden="true" />,
  },
  {
    key: "superhuman-go",
    label: "Superhuman Go",
    to: "/superhuman-go-skills",
    icon: <i className="fa-solid fa-envelope" aria-hidden="true" />,
  },
  {
    key: "chatgpt",
    label: "ChatGPT",
    to: "/chatgpt-skills",
    icon: <i className="fa-brands fa-openai" aria-hidden="true" />,
  },
  {
    key: "grok",
    label: "Grok",
    to: "/grok-skills",
    icon: <i className="fa-brands fa-x-twitter" aria-hidden="true" />,
  },
  {
    key: "perplexity",
    label: "Perplexity",
    to: "/perplexity-skills",
    icon: <img src={perplexityIcon} alt="" className="h-3 w-3" aria-hidden="true" />,
  },
  {
    key: "claude",
    label: "Claude",
    to: "/claude-skills",
    icon: <i className="fa-brands fa-claude" aria-hidden="true" />,
  },
  {
    key: "github-copilot",
    label: "GitHub Copilot",
    to: "/github-copilot-skills",
    icon: <i className="fa-brands fa-copilot" aria-hidden="true" />,
  },
];

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
                className="inline-flex items-center gap-1.5 rounded-full border border-primary bg-accent/40 px-3 py-1 text-xs font-medium text-foreground"
              >
                {link.icon}
                {link.label}
              </span>
            </li>
          ) : (
            <li key={link.key}>
              <Link
                to={link.to}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                {link.icon}
                {link.label}
              </Link>
            </li>
          ),
        )}
      </ul>
    </nav>
  );
}
