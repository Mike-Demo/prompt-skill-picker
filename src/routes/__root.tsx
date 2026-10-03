import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  ClientOnly,
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { useChunkLoadRecovery } from "@/hooks/use-chunk-load-recovery";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SiteFooter } from "@/components/site-footer";
import { getRenderMode } from "@/lib/render-mode.functions";
import { WaSkeleton } from "@/design-system/font-awsome-web-awesome-171158";
import {
  WebAwesomeLoader,
  WEB_AWESOME_HTML_CLASSES,
} from "@/design-system/font-awsome-web-awesome-171158/webawesome/setup";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { property: "og:site_name", content: "Skill Finder" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "google-site-verification",
        content: "RHlwBdxnagu8yjEC1UQ3cV-WcIJ17lGECi8uJYHO6P4",
      },
    ],
    links: [
      // Web Awesome base styles + utilities (CDN, version-pinned).
      {
        rel: "stylesheet",
        href: "https://cdn.jsdelivr.net/npm/@awesome.me/webawesome@3.12.0/dist/styles/webawesome.css",
      },
      // Default theme + default palette: defines every --wa-* design token
      // scoped to the wa-theme-default / wa-light classes on <html>.
      {
        rel: "stylesheet",
        href: "https://cdn.jsdelivr.net/npm/@awesome.me/webawesome@3.12.0/dist/styles/themes/default.css",
      },
      // Font Awesome Free icon set (wa-icon resolves SVGs from this).
      {
        rel: "stylesheet",
        href: "https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@7.3.1/css/all.min.css",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "alternate", type: "text/markdown", href: "/index.md" },
    ],
  }),
  loader: () => getRenderMode(),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={WEB_AWESOME_HTML_CLASSES}>
      <head>
        <HeadContent />
        {/* Private analytics tracker (umami-lite). Loads on every page. */}
        <script
          defer
          src="https://umami-lite.view.fast/tracker.js"
          data-website-id="da3a8742-1cdd-46a8-9f26-41f867eb4119"
        ></script>
      </head>
      <body>
        <noscript>
          <div
            style={{
              maxWidth: "48rem",
              margin: "0 auto",
              padding: "2.5rem 1rem",
              fontFamily: "system-ui, sans-serif",
              lineHeight: 1.6,
            }}
          >
            <h1>Skill Finder — discover and bundle agent skills</h1>
            <p>
              Skill Finder is a free directory of open agent skills: SKILL.md instruction files that
              teach AI coding agents (Claude Code, Cursor, GitHub Copilot, ChatGPT, and others) how
              to do specific tasks well. Describe what you want your agent to do, get ranked skill
              suggestions from the open skills registry, and download the ones you pick as a single
              zip file.
            </p>
            <p>
              The interactive search needs JavaScript, but every agent surface works without it: the
              keyless JSON API at /api/public/v1/skills, the MCP server at /mcp, the OpenAPI spec at
              /openapi.json, and plain-text guides at /llms.txt, /auth.md, and /pricing.md.
            </p>
            <p>
              <a href="/developers">Developers</a> · <a href="/docs/api">API docs</a> ·{" "}
              <a href="/about">About</a> · <a href="/pricing">Pricing</a>
            </p>
          </div>
        </noscript>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function PageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-16">
      <WaSkeleton className="h-10 w-2/3" />
      <WaSkeleton className="mt-4 h-4 w-full" />
      <WaSkeleton className="mt-2 h-4 w-5/6" />
      <WaSkeleton className="mt-8 h-24 w-full" />
    </div>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const renderMode = Route.useLoaderData();
  useChunkLoadRecovery();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      {renderMode === "off" ? (
        <ClientOnly fallback={<PageSkeleton />}>
          <Outlet />
        </ClientOnly>
      ) : (
        <Outlet />
      )}
      <SiteFooter renderMode={renderMode} />
      {/* Registers all <wa-*> custom elements client-side, post-hydration. */}
      <WebAwesomeLoader />
    </QueryClientProvider>
  );
}
