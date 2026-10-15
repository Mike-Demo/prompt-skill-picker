import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { WaIcon } from "@/design-system/font-awsome-web-awesome-171158";
import { RenderModeSwitch } from "@/components/render-mode-switch";
import type { RenderMode } from "@/lib/render-mode";
import { cn } from "@/lib/utils";

const linkedInUrl = "https://www.linkedin.com/in/mikedemopoulos";
const xUrl = "https://x.com/mike_demo";
const threadsUrl = "https://www.threads.com/@mdemop";
const githubUrl = "https://github.com/Mike-Demo";

const linkClass =
  "inline-flex items-center gap-1.5 rounded px-1.5 py-1 font-medium text-foreground/80 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const carbonLineClass =
  "text-[11px] text-muted-foreground/70";

export function SiteFooter({
  className,
  renderMode,
}: {
  className?: string;
  renderMode: RenderMode;
}) {
  const year = new Date().getFullYear();
  const [carbonGrams, setCarbonGrams] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Compute shortly after load so most resources have reported transferSize.
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const entries = performance
            .getEntriesByType("navigation")
            .concat(performance.getEntriesByType("resource"))
            .filter(
              (entry): entry is PerformanceResourceTiming => "transferSize" in entry,
            );
          const totalBytes = entries.reduce(
            (total, entry) =>
              typeof entry.transferSize === "number" ? total + entry.transferSize : total,
            0,
          );
          if (totalBytes <= 0) return;
          const { CO2 } = await import("@tgwf/co2");
          const co2 = new CO2({ model: "swd", version: 4 });
          const grams = co2.perByte(totalBytes, false);
          if (cancelled) return;
          if (Number.isFinite(grams) && grams > 0) setCarbonGrams(grams);
        } catch {
          // Estimation is best-effort: render nothing on failure.
        }
      })();
    }, 1000);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <footer
      className={cn(
        "flex flex-col items-center justify-center gap-2 px-4 pb-28 pt-10 text-[11px] text-muted-foreground",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        <span>Made by MikeDemo</span>
        <span aria-label={`Copyright ${year}`}>© {year}</span>
      </div>
      {carbonGrams !== null && (
        <p className={carbonLineClass}>
          This visit ≈ {carbonGrams.toFixed(2)} g CO₂e · estimated with CO2.js (The Green Web
          Foundation)
        </p>
      )}
      <RenderModeSwitch mode={renderMode} />
      <nav aria-label="Legal links" className="flex flex-wrap items-center justify-center gap-4">
        <Link to="/about" className={linkClass}>
          <WaIcon name="circle-info" />
          About
        </Link>
        <Link to="/developers" className={linkClass}>
          <WaIcon name="code" />
          Developers
        </Link>
        <Link to="/pricing" className={linkClass}>
          <WaIcon name="tag" />
          Pricing
        </Link>
        <Link to="/contact" className={linkClass}>
          <WaIcon name="envelope" />
          Contact
        </Link>
        <Link to="/privacy" className={linkClass}>
          <WaIcon name="shield-halved" />
          Privacy
        </Link>
        <Link to="/licenses" className={linkClass}>
          <WaIcon name="scale-balanced" />
          Open Source
        </Link>
        <Link to="/docs/api" className={linkClass}>
          <WaIcon name="plug" />
          Agent API
        </Link>
      </nav>
      <nav aria-label="Social links" className="flex flex-wrap items-center justify-center gap-4">
        <a
          href={githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="MikeDemo on GitHub (opens in new tab)"
          className={linkClass}
        >
          <WaIcon name="github" family="brands" />
          GitHub
        </a>
        <a
          href={linkedInUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="MikeDemo on LinkedIn (opens in new tab)"
          className={linkClass}
        >
          <WaIcon name="linkedin" family="brands" />
          LinkedIn
        </a>
        <a
          href={xUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="MikeDemo on X (opens in new tab)"
          className={linkClass}
        >
          <WaIcon name="x-twitter" family="brands" />X
        </a>
        <a
          href={threadsUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="MikeDemo on Threads (opens in new tab)"
          className={linkClass}
        >
          <WaIcon name="threads" family="brands" />
          Threads
        </a>
      </nav>
    </footer>
  );
}
