const ABORT_MESSAGES = new Set([
  "aborted",
  "this operation was aborted",
  "the operation was aborted",
]);

type ErrorDetails = {
  name?: unknown;
  message?: unknown;
  code?: unknown;
  cause?: unknown;
};

export function isClientAbort(error: unknown): boolean {
  let current: unknown = error;

  for (let depth = 0; depth < 5 && current != null; depth += 1) {
    if (typeof current === "string") {
      return ABORT_MESSAGES.has(current.trim().toLowerCase());
    }
    if (typeof current !== "object") return false;

    const details = current as ErrorDetails;
    if (details.name === "AbortError" || details.code === "ECONNRESET") return true;
    if (
      typeof details.message === "string" &&
      ABORT_MESSAGES.has(details.message.trim().toLowerCase())
    ) {
      return true;
    }
    current = details.cause;
  }

  return false;
}

export function clientAbortResponse(): Response {
  return new Response(null, { status: 499 });
}