import { createStart, createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

/**
 * A browser that navigates away or reloads mid-request closes the socket, which
 * surfaces as `Error: aborted` / `AbortError`. Nothing is wrong with the app and
 * no response can be written, so these are re-thrown untouched instead of being
 * logged or replaced with the 500 error page.
 */
const isClientAbort = (error: unknown): boolean => {
  if (error == null || typeof error !== "object") return false;
  const { name, message } = error as { name?: unknown; message?: unknown };
  return (
    name === "AbortError" ||
    message === "aborted" ||
    (typeof message === "string" && message.includes("Error: aborted"))
  );
};

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (isClientAbort(error)) {
      throw error;
    }
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});


// Start installs this automatically when src/start.ts is absent; defining the
// file opts out, so re-add it explicitly to keep server functions protected
// from cross-site requests.
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [errorMiddleware, csrfMiddleware],
}));
