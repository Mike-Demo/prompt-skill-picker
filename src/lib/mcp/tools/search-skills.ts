import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { AGENT_KEYS } from "@/lib/agents";
import type { PublicSkill } from "@/lib/public-api.server";

const toSkillJson = (skill: PublicSkill) => ({
  id: skill.id,
  name: skill.name,
  description: skill.description,
  source: skill.source,
  installs: skill.installs,
  installCommand: skill.installCommand,
  url: skill.url,
});

export default defineTool({
  name: "search_skills",
  title: "Search skills",
  description:
    "Search the public catalogue of open agent skills (SKILL.md instruction files), most installed first.",
  inputSchema: {
    query: z.string().trim().max(100).optional().describe("Keywords to match name, description or source."),
    agent: z.enum(AGENT_KEYS).optional().describe("Restrict to one agent's curated list."),
    minInstalls: z.number().int().min(0).optional().describe("Only skills with at least this many installs."),
    limit: z.number().int().min(1).max(25).default(10).describe("How many skills to return."),
    offset: z.number().int().min(0).max(5000).default(0).describe("Skip this many results for paging."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, agent, minInstalls, limit, offset }, ctx) => {
    const { queryCatalogue, CatalogueUnavailableError } = await import("@/lib/catalogue.server");
    try {
      const result = await queryCatalogue({ q: query, agent, minInstalls, limit, offset });
      if (ctx.signal.aborted) throw new ToolError("Cancelled.");
      const summary = result.skills
        .map((skill) => `${skill.name} (${skill.source}, ${skill.installs} installs) — ${skill.description}`)
        .join("\n");
      return {
        content: [
          {
            type: "text" as const,
            text: result.skills.length
              ? `${result.skills.length} of ${result.total} matching skills:\n${summary}`
              : "No skills matched that search.",
          },
        ],
        structuredContent: {
          total: result.total,
          nextOffset: result.nextOffset,
          stale: result.stale,
          skills: result.skills.map(toSkillJson),
        },
      };
    } catch (error) {
      if (error instanceof CatalogueUnavailableError) {
        throw new ToolError("The skills registry is unavailable right now; try again in a minute.");
      }
      throw error;
    }
  },
});
