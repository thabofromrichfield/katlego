# Autonomous app testing (agent test loop)

Give an AI assistant in your editor the tools to **drive the app, observe errors, fix
them, and confirm the fix** — autonomously, in a loop.

```
You (prompt)
   │
   ▼
Agent (e.g. GitHub Copilot agent mode)
   │  ┌───────────────────────────────────────────────┐
   ├─▶│ Playwright MCP  — real browser. Navigate the   │
   │  │ app (http://localhost:3000), click through      │
   │  │ flows, read console + network errors.           │
   │  └───────────────────────────────────────────────┘
   │  ┌───────────────────────────────────────────────┐
   ├─▶│ Sentry MCP — your Sentry org (matest / katlego).│
   │  │ Read issues, events, stack traces, verify that  │
   │  │ new errors landed, confirm a fix stopped them.  │
   │  └───────────────────────────────────────────────┘
   │  code/file tools built into the agent → fix the bug
   ▼
Fix → re-run the failing flow → confirm in Sentry → report
```

## What was added

| File | Purpose |
| --- | --- |
| `.vscode/mcp.json` | Registers both MCP servers for VS Code + GitHub Copilot agent mode. |
| `docs/agent-testing.md` | This guide. |

The two servers (no API keys in the repo, nothing to commit):

| Server | Kind | What it gives the agent |
| --- | --- | --- |
| `sentry` | Remote HTTP, OAuth | Read/unresolved issues for `katlego`, stack traces, events, project/Dsn lookup. Auth = one browser "Allow". |
| `playwright` | Local stdio (`npx @playwright/mcp@latest`) | A real browser: navigate, click, type, snapshot, read console/network — i.e. actually *use* your app. |

## One-time enable (2 minutes, on your machine)

> Why your machine and not the Arena/preview sandbox? The observation half of the loop
> needs to reach Sentry. The sandbox that hosts the Arena preview cannot make outbound
> connections to Sentry (its egress resets the TLS connection), so the loop must run
> wherever your editor can reach both `localhost:3000` *and* Sentry — your dev machine.

1. **Pull the config** so `.vscode/mcp.json` exists in the repo:
   ```bash
   git pull origin arena/01a06c39-katlego
   ```
2. **Reload the VS Code window** (Cmd/Ctrl+Shift+P → "Developer: Reload Window").
3. **Start your dev server** in the integrated terminal:
   ```bash
   npm run dev
   ```
4. **Approve the servers.** Open the Copilot chat and switch the mode dropdown to
   **Agent** (not Ask/Edit). VS Code will prompt to approve the new MCP servers —
   accept `sentry` and `playwright`. You can manage them later via the Copilot
   **MCP Servers** view / "Manage MCP Servers".
5. **Authorize Sentry.** When the agent first calls a `sentry` tool, VS Code opens the
   browser for **OAuth sign-in** — sign in with the account that owns org `matest`.
   Done; no tokens to paste or commit.
6. **First Playwright run** downloads its browser into `~/.cache/ms-playwright`
   (1–2 min once). If a launch fails later, run `npx playwright install chromium`.

### Fallback: stdio Sentry server (no remote/OAuth support in your editor)

If your editor/VS Code build doesn't support remote OAuth MCP servers, swap the
`sentry` entry in `.vscode/mcp.json` for:

```json
"sentry": {
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "@sentry/mcp-server@latest"]
}
```

Then authenticate once in a terminal (prints a device-flow URL to approve in your
browser):

```bash
npx -y @sentry/mcp-server@latest login
```

## Prompt recipes (copy-paste)

**Full autonomous test run:**
> "Run the autonomous test loop. If the dev server isn't running, start `npm run dev`.
> Use the Playwright MCP browser to open http://localhost:3000, sign in with the
> [test] account, and click through the core flows (dashboard, quotes, trips). Watch
> for console and network errors on every page. Then use the Sentry MCP tools to check
> for any new issues in project `katlego` and report each title, its stack, and your
> suggested fix."

**Investigate + fix the latest Sentry issue:**
> "Fetch the newest unresolved issue for project `katlego` via the Sentry MCP tools.
> Read its stack trace, reproduce it in the Playwright browser if possible, find the
> cause in the code, apply a fix, run `npx tsc --noEmit` and the linter, then re-run
> the flow and tell me whether a new event still appears in Sentry."

**Regression check after a change:**
> "I just changed [X]. Autonomously verify the key flows still work: [list pages].
> Note the current unresolved-issue count in Sentry for `katlego` before and after, and
> flag anything new."

**Exercise the analytics dashboards:**
> "Open /diag/analytics and /admin/insights in the browser (sign in first), switch
> light/dark themes, and confirm the charts render with data. Capture any console
> errors and check Sentry for related issues."

## Guardrails & caveats

- **Agent mode can edit files.** That's the point (it fixes what it breaks), but review
  its diffs in Source Control before pushing; Copilot shows you proposed changes.
- The **Sentry MCP reaches your real org** (`matest`). Ask it to *read/investigate*, and
  only *mutate* (create alerts/issues/… ) when you intend to.
- **No secrets are needed or stored in the repo.** OAuth lives in VS Code's secret
  storage; the Playwright server is `npx`-ephemeral. Never paste `SENTRY_AUTH_TOKEN` or
  API keys into prompts or committed files.
- `src/proxy.ts` currently has **TEMP allowlist entries** (`/sentry-example-page`,
  `/api/sentry-example-api`) added while verifying the Sentry wizard's example errors —
  remove them (and delete the two `sentry-example-*` files) once you're done testing.
  The `/monitoring` exclusion in the matcher is **permanent** — it lets client-side
  error envelopes reach Sentry through the tunnel instead of being redirected to login.
- The **session-replay + client errors** flow through `/monitoring` on your own origin,
  so Sentry sees them even behind ad-blockers.

## Other editors

- **Cursor:** Settings → MCP → add server `sentry` with URL `https://mcp.sentry.dev/mcp`
  (OAuth prompt appears), and server `playwright` with command
  `npx @playwright/mcp@latest`.
- **Claude Code:** `claude mcp add sentry --transport http https://mcp.sentry.dev/mcp` and
  `claude mcp add playwright -- npx @playwright/mcp@latest`.
- **Windsurf / Zed / others:** add the same two servers using the standard `mcpServers`
  config — remote URL for Sentry, `npx @playwright/mcp@latest` for the browser.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Servers don't show up in Copilot | Reload window; confirm you're in **Agent** mode; check "Manage MCP Servers" and approve both. |
| Sentry tool says not authenticated | Re-run the OAuth (or fallback `... login`) flow; confirm the account has access to org `matest`. |
| Playwright fails to launch a browser | `npx playwright install chromium`, then retry. First run downloads it. |
| Browser can't reach the app | Make sure `npm run dev` is running on port 3000; the agent should navigate to `http://localhost:3000`, not a preview URL. |
| Agent reports errors that aren't in Sentry | Server-side captures go straight to Sentry; client-side ones go through `/monitoring` (now excluded from the auth proxy). Check the project filter includes env `development`/no env filter. |
