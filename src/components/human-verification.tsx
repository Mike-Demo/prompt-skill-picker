import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { WaButton, WaCallout, WaDialog } from "@/design-system/font-awsome-web-awesome-171158";
import { captchaConfig, completeCaptcha } from "@/lib/captcha.functions";
import { captchaVerified } from "@/lib/captcha-browser";

interface ChallengeRequest { resolve: () => void; reject: (error: Error) => void }
interface CaptchaApi {
  render: (element: HTMLElement, options: { sitekey: string; callback: (token: string) => void; "expired-callback": () => void; "error-callback": () => void }) => string;
  remove: (id: string) => void;
  reset: (id: string) => void;
}
declare global { interface Window { hcaptcha?: CaptchaApi } }

let scriptPromise: Promise<void> | null = null;
function loadCaptcha(): Promise<void> {
  if (window.hcaptcha) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://js.hcaptcha.com/1/api.js?render=explicit";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => { script.remove(); scriptPromise = null; reject(new Error("Verification could not load. Please try again.")); };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export function HumanVerification() {
  const [request, setRequest] = useState<ChallengeRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const host = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLElement>(null);
  const getConfig = useServerFn(captchaConfig);
  const verify = useServerFn(completeCaptcha);

  useEffect(() => {
    const listener = (event: Event) => {
      setError(null);
      setRequest((event as CustomEvent<ChallengeRequest>).detail);
    };
    window.addEventListener("skillfinder:captcha", listener);
    return () => window.removeEventListener("skillfinder:captcha", listener);
  }, []);

  useEffect(() => {
    if (!request) return;
    let active = true;
    let widget: string | undefined;
    const cancel = () => {
      request.reject(new Error("Human verification was cancelled. Please try again."));
      setRequest(null);
    };
    const element = dialog.current;
    if (element) Object.assign(element, { open: true });
    element?.addEventListener("wa-hide", cancel);
    void (async () => {
      try {
        const config = await getConfig();
        if (!config.sitekey) throw new Error("Verification is temporarily unavailable. Please try again later.");
        await loadCaptcha();
        if (!active || !host.current || !window.hcaptcha) return;
        widget = window.hcaptcha.render(host.current, {
          sitekey: config.sitekey,
          callback: (token) => {
            void verify({ data: { token } }).then(() => {
              if (!active) return;
              captchaVerified();
              request.resolve();
              setRequest(null);
            }).catch((failure: unknown) => {
              if (!active) return;
              setError(failure instanceof Error ? failure.message : "Verification failed. Please try again.");
              if (widget) window.hcaptcha?.reset(widget);
            });
          },
          "expired-callback": () => { if (widget) window.hcaptcha?.reset(widget); },
          "error-callback": () => setError("Verification could not load. Please try again."),
        });
      } catch (failure) {
        if (active) setError(failure instanceof Error ? failure.message : "Verification failed. Please try again.");
      }
    })();
    return () => {
      active = false;
      element?.removeEventListener("wa-hide", cancel);
      if (widget) window.hcaptcha?.remove(widget);
    };
  }, [request, getConfig, verify, retry]);

  return request ? (
    <WaDialog ref={dialog} open label="Human verification">
      <div className="wa-stack wa-gap-m">
        <div ref={host} />
        {error && <WaCallout variant="danger">{error}</WaCallout>}
        {error && <WaButton appearance="outlined" onClick={() => { setError(null); setRetry(value => value + 1); }}>Try again</WaButton>}
      </div>
    </WaDialog>
  ) : null;
}