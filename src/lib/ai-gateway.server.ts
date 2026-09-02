import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

/**
 * Provider for the Lovable AI Gateway. Server-only: the API key must never
 * reach the browser.
 */
export const createLovableAiGatewayProvider = (apiKey: string) =>
  createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: { "Lovable-API-Key": apiKey },
    supportsStructuredOutputs: true,
  });

export const getLovableApiKey = (): string => {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured for this project (missing API key).");
  return key;
};

export const AI_MODEL = "google/gemini-3.7-flash";
