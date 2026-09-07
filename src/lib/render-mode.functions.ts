import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import { DEFAULT_RENDER_MODE, parseRenderModeCookie, type RenderMode } from "./render-mode";

/**
 * Reads the visitor's server-side-rendering preference from the request cookie.
 * Runs during SSR so the very first HTML already respects the choice.
 */
export const getRenderMode = createServerFn({ method: "GET" }).handler(
  async (): Promise<RenderMode> => {
    try {
      return parseRenderModeCookie(getRequestHeader("cookie"));
    } catch {
      return DEFAULT_RENDER_MODE;
    }
  },
);
