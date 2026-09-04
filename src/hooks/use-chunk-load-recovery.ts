import { useEffect } from "react";

const RELOAD_FLAG = "skill-finder:chunk-reload";

const CHUNK_ERROR_PATTERNS = [
  "importing a module script failed",
  "failed to fetch dynamically imported module",
  "error loading dynamically imported module",
  "'text/html' is not a valid javascript mime type",
];

function isChunkLoadError(message: string): boolean {
  const normalized = message.toLowerCase();
  return CHUNK_ERROR_PATTERNS.some((pattern) => normalized.includes(pattern));
}

/**
 * A stale client build (after a deploy or dev-server reload) makes lazy route
 * chunks 404, which renders a blank screen. Reload once to fetch the new build.
 */
export function useChunkLoadRecovery(): void {
  useEffect(() => {
    const recover = (message: string): void => {
      if (!isChunkLoadError(message)) return;
      if (sessionStorage.getItem(RELOAD_FLAG)) return;
      sessionStorage.setItem(RELOAD_FLAG, "1");
      window.location.reload();
    };

    const onError = (event: ErrorEvent): void => {
      recover(event.message ?? "");
    };

    const onRejection = (event: PromiseRejectionEvent): void => {
      const reason: unknown = event.reason;
      recover(reason instanceof Error ? reason.message : String(reason ?? ""));
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    const clear = window.setTimeout(() => {
      sessionStorage.removeItem(RELOAD_FLAG);
    }, 10_000);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
      window.clearTimeout(clear);
    };
  }, []);
}
