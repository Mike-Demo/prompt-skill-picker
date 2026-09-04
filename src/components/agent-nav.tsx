import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

import type { AgentKey } from "@/lib/agents";
import perplexityIcon from "@/assets/perplexity.svg";
import superhumanGoIcon from "@/assets/superhuman-go.svg";

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
    icon: (
      <img
        src={perplexityIcon}
        alt=""
        style={{
          blockSize: "var(--wa-font-size-2xs)",
          inlineSize: "var(--wa-font-size-2xs)",
        }}
        aria-hidden="true"
      />
    ),
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
      <h2
        className="agent-nav__heading"
        style={{
          fontSize: "var(--wa-font-size-2xs)",
          fontWeight: "var(--wa-font-weight-semibold)",
          textTransform: "uppercase",
          letterSpacing: "var(--wa-space-3xs)",
          color: "var(--wa-color-gray-50)",
        }}
      >
        Skills by agent
      </h2>
      <ul
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "var(--wa-space-2xs)",
          marginBlockStart: "var(--wa-space-2xs)",
          padding: 0,
          listStyle: "none",
        }}
      >
        {LINKS.map((link) =>
          link.key === current ? (
            <li key={link.key}>
              <span
                aria-current="page"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "var(--wa-space-2xs)",
                  borderRadius: "var(--wa-border-radius-pill)",
                  borderWidth: "var(--wa-border-width-s)",
                  borderStyle: "var(--wa-border-style)",
                  borderColor: "var(--wa-color-blue-50)",
                  paddingBlock: "var(--wa-space-2xs)",
                  paddingInline: "var(--wa-space-s)",
                  fontSize: "var(--wa-font-size-2xs)",
                  fontWeight: "var(--wa-font-weight-semibold)",
                  color: "var(--wa-color-blue-70)",
                  background: "var(--wa-color-blue-95)",
                }}
              >
                {link.icon}
                {link.label}
              </span>
            </li>
          ) : (
            <li key={link.key}>
              <Link
                to={link.to}
                className="agent-nav__chip"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "var(--wa-space-2xs)",
                  borderRadius: "var(--wa-border-radius-pill)",
                  borderWidth: "var(--wa-border-width-s)",
                  borderStyle: "var(--wa-border-style)",
                  borderColor: "var(--wa-color-gray-20)",
                  paddingBlock: "var(--wa-space-2xs)",
                  paddingInline: "var(--wa-space-s)",
                  fontSize: "var(--wa-font-size-2xs)",
                  color: "var(--wa-color-gray-60)",
                  textDecoration: "none",
                  transition: "var(--wa-transition-fast)",
                }}
              >
                {link.icon}
                {link.label}
              </Link>
            </li>
          ),
        )}
      </ul>
      <style>{`
        .agent-nav__chip:hover {
          background: var(--wa-color-surface-raised);
          color: var(--wa-color-gray-90);
          border-color: var(--wa-color-gray-40);
        }
      `}</style>
    </nav>
  );
}
