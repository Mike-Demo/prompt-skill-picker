import { defineMcp } from "@lovable.dev/mcp-js";

import searchSkillsTool from "./tools/search-skills";
import getSkillTool from "./tools/get-skill";
import listAgentsTool from "./tools/list-agents";

export default defineMcp({
  name: "skill-finder-plus",
  title: "Skill Finder Plus",
  version: "1.0.0",
  instructions:
    "Read-only access to the Skill Finder catalogue of open agent skills (SKILL.md instruction files). Use `search_skills` to find skills by keyword, agent or install count, `get_skill` for one skill's details and install command, and `list_agents` to see which agents have curated collections. No authentication required; no write operations.",
  tools: [searchSkillsTool, getSkillTool, listAgentsTool],
});
