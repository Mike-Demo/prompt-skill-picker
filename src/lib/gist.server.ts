/**
 * GitHub removed anonymous gist creation, so publishing a skill as a gist
 * requires a token with the `gist` scope. The token never leaves the server.
 */
const GIST_ENDPOINT = "https://api.github.com/gists";

export class GistNotConfiguredError extends Error {
  constructor() {
    super("Gist publishing is not configured yet.");
    this.name = "GistNotConfiguredError";
  }
}

export async function createGist(
  filename: string,
  content: string,
  description: string,
): Promise<string> {
  const token = process.env["GITHUB_GIST_TOKEN"];
  if (!token) throw new GistNotConfiguredError();

  const response = await fetch(GIST_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      description: description.slice(0, 200),
      public: true,
      files: { [filename]: { content } },
    }),
  });

  if (!response.ok) {
    throw new Error(`GitHub rejected the gist (status ${response.status}).`);
  }

  const body = (await response.json()) as { html_url?: unknown };
  if (typeof body.html_url !== "string") throw new Error("GitHub returned no gist URL.");
  return body.html_url;
}
