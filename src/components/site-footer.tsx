import { Link } from "@tanstack/react-router";

import { cn } from "@/lib/utils";

const linkedInUrl = "https://www.linkedin.com/in/mikedemopoulos";
const xUrl = "https://x.com/mike_demo";
const threadsUrl = "https://www.threads.com/@mdemop";

const linkClass =
  "inline-flex items-center gap-1.5 rounded px-1.5 py-1 font-medium text-foreground/80 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export function SiteFooter({ className }: { className?: string }) {
  const year = new Date().getFullYear();

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
      <nav aria-label="Legal links" className="flex flex-wrap items-center justify-center gap-4">
        <Link to="/licenses" className={linkClass}>
          <i className="fa-solid fa-code h-4 w-4 text-[14px]" aria-hidden="true" />
          Open Source
        </Link>
      </nav>
      <nav aria-label="Social links" className="flex flex-wrap items-center justify-center gap-4">
        <a
          href={linkedInUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="MikeDemo on LinkedIn (opens in new tab)"
          className={linkClass}
        >
          <i
            className="fa-brands fa-linkedin h-4 w-4 text-[14px] transition-colors duration-200 hover:text-[#0A66C2]"
            aria-hidden="true"
          />
          LinkedIn
        </a>
        <a
          href={xUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="MikeDemo on X (opens in new tab)"
          className={linkClass}
        >
          <i
            className="fa-brands fa-x-twitter h-4 w-4 text-[14px] transition-colors duration-200"
            aria-hidden="true"
          />
          X
        </a>
        <a
          href={threadsUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="MikeDemo on Threads (opens in new tab)"
          className={linkClass}
        >
          <i
            className="fa-brands fa-threads h-4 w-4 text-[14px] transition-colors duration-200"
            aria-hidden="true"
          />
          Threads
        </a>
      </nav>
    </footer>
  );
}
