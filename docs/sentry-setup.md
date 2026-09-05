# Sentry setup — Katlego (SDK + MCP debugging)

This repo is wired for both pieces of Sentry debugging:

1. **`@sentry/nextjs`** — error + performance tracking from the app itself.
2. **`@sentry/mcp-server`** — lets an AI assistant (VSCode Copilot, Claude,
   Cursor, …) query your Sentry project: triage issues, read stack traces,
   inspect breadcrumbs, and suggest fixes.

Both are **installed and configured already**. What's left is creating the
Sentry project and telling the app/MCP about it — there is no Sentry org
created from this repo, so only you can do the steps below (2–3 min).

---

## 1. Create the Sentry project

1. Go to https://sentry.io → pick your org (or create one — free tier is fine).
2. **Create Project** → platform **Next.js** → name it `katlego`
   (note the org slug and project slug — you'll need them).
3. On the "Verify" screen copy the **DSN** — it looks like
   `https://<key>@<org>.ingest.sentry.io/<project>`.

## 2. Tell the app about it

Add to `.env.local` (already tracked, public DSN only):

```bash
# Sentry error reporting (client DSN — public by design)
NEXT_PUBLIC_SENTRY_DSN=https://<key>@<org>.ingest.sentry.io/<project>
```

The SDK configs live in:
`src/sentry.client.config.ts`, `src/sentry.server.config.ts`,
`src/sentry.edge.config.ts` (+ `src/instrumentation.ts` and
`src/app/global-error.tsx`). They **no-op until a DSN is present**, so dev
keeps working even before you add it. Errors start appearing in Sentry on the
next run.

> Optional — source maps + release names. When you want readable stack traces
> in production, also export in your deploy shell (never commit these):
> ```bash
> export SENTRY_ORG=<org-slug>
> export SENTRY_PROJECT=katlego
> export SENTRY_AUTH_TOKEN=<token>
> ```
> `next.config.ts` only enables the upload plugin when all three exist.

## 3. Register the MCP server so an AI can debug

The MCP server is installed as a dev dependency
(`@sentry/mcp-server`) and a workspace config already exists at
**`.vscode/mcp.json`** (used by VSCode / GitHub Copilot).

Authenticate once (device flow — no token to paste or store):

```bash
npm run sentry:login
# opens a browser: "Allow" → done. Verify with `npm run sentry:status`
```

Restart VSCode / Copilot Chat, then confirm the server shows as connected
(Copilot → MCP servers → `sentry`). Ask something like *"pull the top 5
unresolved issues from Sentry"* to test.

Other AI hosts — same server, different config file:

- **Claude (Desktop / Code)** — add to `claude_desktop_config.json` / `.mcp.json`:
  ```json
  { "mcpServers": { "sentry": { "command": "npx", "args": ["-y", "@sentry/mcp-server"] } } }
  ```
- **Cursor** — `.cursor/mcp.json`, same shape as above.

No `SENTRY_ACCESS_TOKEN` is needed if you used `auth login`. If you prefer a
token instead: https://sentry.io/settings/auth-tokens → create one with at
least `org:read`, `project:read`, `event:read`, `issue:read` (add
`issue:write`, `event:write` if you want resolve/assign/comment powers), then
set `SENTRY_ACCESS_TOKEN` in your environment before launching the editor.

Optional constraints so tools only ever touch this project:

```bash
npx @sentry/mcp-server --organization-slug <org> --project-slug katlego
```

## 4. Katlego debug server (local MCP, Sentry-instrumented)

The repo ships its own small MCP server — **`mcp/katlego-debug.mjs`** — built
exactly on the Sentry wrapper pattern:

```js
import * as Sentry from "@sentry/node";
Sentry.init({ dsn, tracesSampleRate: 1.0 });
const server = Sentry.wrapMcpServerWithSentry(new McpServer({ name: "katlego-debug", ... }));
```

It reads the same DSN the app uses (`NEXT_PUBLIC_SENTRY_DSN` from `.env.local`,
or `SENTRY_DSN`), so once you set the DSN above, every tool call, session and
raised error on this server is reported to your Sentry project.

Tools:
- `env_status` — which infra env vars are configured (values never shown)
- `typecheck` — run `tsc --noEmit`, optional text filter
- `lint` — run eslint over a path
- `list_routes` — map `src/app` → URL routes
- `sentry_probe` — recent unresolved issues straight from the Sentry API

Run it: `npm run mcp:katlego`. It's already registered in `.vscode/mcp.json`
as **`katlego-debug`** alongside the official **`sentry`** server, so VSCode /
GitHub Copilot exposes both. For Claude/Cursor, add:

```json
{ "mcpServers": { "katlego-debug": { "command": "node", "args": ["mcp/katlego-debug.mjs"] } } }
```

## 5. Verify

| Check | Command | Expected |
|---|---|---|
| MCP binary runs | `npm run sentry:mcp -- --help` | usage text |
| Auth state | `npm run sentry:status` | `Logged in` |
| SDK loads (dev) | `npm run dev`, open any page | no console errors |
| Errors captured | trigger an error, view Sentry issue stream | new event |

### Useful npm scripts (added to package.json)

- `npm run sentry:mcp` — run the Sentry MCP server (stdio)
- `npm run sentry:login` — device-flow login
- `npm run sentry:status` — auth status

## Notes / gotchas

- `.env.local` is **tracked** in this repo (Supabase public keys already live
  there). The DSN is client-public so it's safe there; the **auth token is a
  server secret and must never be committed** — use env vars or `auth login`.
- `@sentry/mcp-server` tools are exposed to whatever AI client loads them —
  this repo only *provides* the server; it can't inject itself into an
  already-running agent session.
