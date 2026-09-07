import { useEffect, useRef } from "react";

import { WaSwitch } from "@/design-system/font-awsome-web-awesome-171158";
import { writeRenderModeCookie, type RenderMode } from "@/lib/render-mode";

type SwitchHost = HTMLElement & { checked: boolean };

/**
 * Instant-apply setting: flips how pages are assembled and reloads once so the
 * server and the browser agree on the new mode.
 */
export function RenderModeSwitch({ mode }: { mode: RenderMode }) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const host = ref.current as SwitchHost | null;
    if (!host) return;

    const onChange = () => {
      const next: RenderMode = host.checked ? "on" : "off";
      writeRenderModeCookie(next);
      window.location.reload();
    };

    host.addEventListener("change", onChange);
    return () => host.removeEventListener("change", onChange);
  }, []);

  return (
    <WaSwitch
      ref={ref}
      size="s"
      checked={mode === "on"}
      hint="Off builds pages in your browser instead."
    >
      Server-side rendering
    </WaSwitch>
  );
}
