import { createFileRoute } from "@tanstack/react-router";

const BASE_URL = "https://skills.mikedemo.dev";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const STATIC_ENTRIES: readonly SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/library", changefreq: "weekly", priority: "0.8" },
  { path: "/claude-skills", changefreq: "weekly", priority: "0.8" },
  { path: "/mcp-skills", changefreq: "weekly", priority: "0.8" },
  { path: "/chatgpt-skills", changefreq: "weekly", priority: "0.8" },
  { path: "/github-copilot-skills", changefreq: "weekly", priority: "0.8" },
  { path: "/grok-skills", changefreq: "weekly", priority: "0.8" },
  { path: "/perplexity-skills", changefreq: "weekly", priority: "0.8" },
  { path: "/superhuman-go-skills", changefreq: "weekly", priority: "0.8" },
  { path: "/cursor-skills", changefreq: "weekly", priority: "0.8" },
  { path: "/licenses", changefreq: "monthly", priority: "0.5" },
];


export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [...STATIC_ENTRIES];

        const urls = entries.map((entry) =>
          [
            "  <url>",
            `    <loc>${BASE_URL}${entry.path}</loc>`,
            entry.changefreq ? `    <changefreq>${entry.changefreq}</changefreq>` : null,
            entry.priority ? `    <priority>${entry.priority}</priority>` : null,
            "  </url>",
          ]
            .filter((line): line is string => line !== null)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
