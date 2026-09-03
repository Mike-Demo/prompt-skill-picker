import { useEffect, useState } from "react";

const RETRY_PATTERN = /in (\d+)s/;

/** Extracts the retry delay a rate-limit error advertises in its message. */
export function parseRetryAfterSeconds(error: unknown): number | null {
  if (!(error instanceof Error)) return null;
  const match = RETRY_PATTERN.exec(error.message);
  const seconds = match?.[1] ? Number.parseInt(match[1], 10) : NaN;
  return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
}

/**
 * Counts down from the delay advertised by the latest rate-limit error so the
 * UI can disable the action until the caller is allowed to retry.
 */
export function useCooldown(error: unknown): number {
  const [remaining, setRemaining] = useState(0);
  const seconds = parseRetryAfterSeconds(error);

  useEffect(() => {
    if (seconds === null) return;
    setRemaining(seconds);
    const timer = setInterval(() => {
      setRemaining((value) => (value <= 1 ? 0 : value - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [seconds, error]);

  return remaining;
}
