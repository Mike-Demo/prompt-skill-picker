import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "get_skill",
  title: "Get skill",
  description: "Look up one skill by its catalogue id and return its details and install command.",
  inputSchema: { id: z.string().trim().min(1).max(200).describe("Catalogue id from search_skills.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ id }) => {
    const { findSkill, CatalogueUnavailableError } = await import("@/lib/catalogue.server");
    try {
      const found = await findSkill(id);
      if (!found) throw new ToolError(`No skill with id "${id}" is in the catalogue.`);
      const { skill } = found;
      return {
        content: [
          {
            type: "text" as const,
            text: [
              `${skill.name} (${skill.source})`,
              skill.description,
              `Installs: ${skill.installs}`,
              `Install: ${skill.installCommand}`,
              skill.url ? `Source: ${skill.url}` : "",
            ]
              .filter(Boolean)
              .join("\n"),
          },
        ],
        structuredContent: {
          skill: {
            id: skill.id,
            name: skill.name,
            description: skill.description,
            source: skill.source,
            installs: skill.installs,
            installCommand: skill.installCommand,
            url: skill.url,
          },
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
