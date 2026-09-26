<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules

- All catalogue reads (public API routes and MCP tools) go through `src/lib/catalogue.server.ts` — one filter/sort/paging path keeps the REST and MCP surfaces consistent.
- Versioned public API responses use the `{ data, meta }` / `{ error: { code, message } }` envelope from `src/lib/api-envelope.server.ts`; the unversioned `/api/public/skills` routes keep their flat payload for existing callers.
- The MCP server is defined in `src/lib/mcp/` (entry plus one file per tool) and is public and read-only; generated MCP routes are owned by the Vite plugin and must not be hand-edited.
