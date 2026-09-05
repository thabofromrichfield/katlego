#!/usr/bin/env node
/**
 * Katlego Debug MCP Server
 * -------------------------
 * A local MCP server for debugging this app, instrumented with Sentry using
 * the pattern:
 *
 *   import * as Sentry from "@sentry/node";
 *   import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
 *   Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 1.0 });
 *   const server = Sentry.wrapMcpServerWithSentry(
 *     new McpServer({ name: "katlego-debug", version: "1.0.0" }),
 *   );
 *
 * Sentry is a no-op until a DSN is configured, so the server runs anywhere:
 *   - reads NEXT_PUBLIC_SENTRY_DSN from .env.local (same DSN the app uses)
 *   - or SENTRY_DSN from the environment
 *
 * Tools (all local / read-only — no secrets leave this machine):
 *   env_status    – which infra env vars are configured, node/npm versions
 *   typecheck     – run `tsc --noEmit` and return errors
 *   lint          – run eslint over a path
 *   list_routes   – map src/app → URL routes (quick orientation)
 *   sentry_probe  – pull recent unresolved issues from the Sentry API
 *                   (needs SENTRY_AUTH_TOKEN + SENTRY_ORG + SENTRY_PROJECT)
 *
 * Run standalone:  node mcp/katlego-debug.mjs
 * Or via npm:      npm run mcp:katlego
 */
import * as Sentry from "@sentry/node";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { execFile } from "node:child_process";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

// ── Load .env.local so the DSN (and Supabase vars) match the app ──────
function loadEnvLocal() {
  const p = join(REPO_ROOT, ".env.local");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  }
}
loadEnvLocal();

// Sentry init needs to be above everything else
Sentry.init({
  dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN ?? undefined,
  tracesSampleRate: 1.0,
});

// ── Tool helpers ──────────────────────────────────────────────────────
const run = promisify(execFile);

function limit(lines, n = 60) {
  const all = lines.split("\n").filter(Boolean);
  const shown = all.slice(0, n);
  const extra = all.length - shown.length;
  return (extra > 0 ? `${shown.join("\n")}\n… ${extra} more lines\n` : shown.join("\n")).trim();
}

async function sh(cmd, args, timeoutMs = 300_000) {
  try {
    const { stdout, stderr } = await run(cmd, args, { cwd: REPO_ROOT, timeout: timeoutMs, maxBuffer: 16 * 1024 * 1024 });
    return { code: 0, out: `${stdout}\n${stderr}`.trim() };
  } catch (err) {
    const out = err?.stdout ?? "";
    const estr = err?.stderr ?? "";
    return { code: err?.code ?? 1, out: `${out}\n${estr}`.trim() };
  }
}

// Wrap every MCP server instance — register tools on the wrapped server so
// Sentry can instrument every call, session and raised error.
const server = Sentry.wrapMcpServerWithSentry(
  new McpServer({
    name: "katlego-debug",
    version: "1.0.0",
  }),
);

server.tool(
  "env_status",
  "List which Katlego infra environment variables are configured (values never shown), plus node/npm versions and git HEAD.",
  async () => {
    const vars = [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "NEXT_PUBLIC_SENTRY_DSN",
      "SENTRY_DSN",
      "SENTRY_ORG",
      "SENTRY_PROJECT",
      "SENTRY_AUTH_TOKEN",
      "SENTRY_ACCESS_TOKEN",
    ];
    const rows = vars.map((v) => `  ${v}: ${process.env[v] ? "set ✓" : "not set"}`);
    let head = "n/a";
    try {
      const { out } = await sh("git", ["rev-parse", "--short", "HEAD"]);
      head = out.split("\n")[0] || head;
    } catch {}
    const envLocal = existsSync(join(REPO_ROOT, ".env.local")) ? "present" : "missing";
    const msg = [
      `env vars (from environment + .env.local):`,
      rows.join("\n"),
      `.env.local: ${envLocal}`,
      `node: ${process.version}`,
      `git HEAD: ${head}`,
      `repo root: ${REPO_ROOT}`,
    ].join("\n");
    return { content: [{ type: "text", text: msg }] };
  },
);

server.tool(
  "typecheck",
  "Run the repo TypeScript check (`tsc --noEmit`) and return any errors. Optionally pass a filter to only show lines mentioning it.",
  { filter: z.string().optional().describe("Only show tsc error lines containing this text") },
  async ({ filter }) => {
    const { code, out } = await sh("npx", ["tsc", "--noEmit", "--pretty", "false"]);
    const filtered = filter ? out.split("\n").filter((l) => l.includes(filter)).join("\n").trim() : out;
    const isEmpty = !filtered || !out;
    return {
      content: [{ type: "text", text: isEmpty ? "✓ tsc: no errors." : `tsc exit: ${code}\n${limit(filtered || out)}` }],
    };
  },
);

server.tool(
  "lint",
  "Run eslint over the repo (default: src) and return the report. Pass paths to narrow the check.",
  { paths: z.string().optional().describe("Space-separated files/dirs to lint (default: src)") },
  async ({ paths }) => {
    const targets = (paths ?? "src").trim().split(/\s+/).filter(Boolean);
    const { code, out } = await sh("npx", ["eslint", ...targets]);
    return { content: [{ type: "text", text: code === 0 && !out ? "✓ lint: clean." : `eslint exit: ${code}\n${limit(out)}` }] };
  },
);

server.tool(
  "list_routes",
  "List the app's URL routes by scanning src/app for page.tsx / route.ts files.",
  async () => {
    const routes = [];
    const walk = (dir, url) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
        const p = join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(p, entry.name.startsWith("(") ? url : `${url}/${entry.name}`);
        } else if (entry.name === "page.tsx" || entry.name === "page.ts") {
          routes.push(url || "/");
        } else if (entry.name === "route.ts") {
          routes.push(`${url || "/api"} (api)`);
        }
      }
    };
    walk(join(REPO_ROOT, "src/app"), "");
    routes.sort();
    return { content: [{ type: "text", text: routes.map((r) => `  ${r}`).join("\n") || "(no routes found)" }] };
  },
);

server.tool(
  "sentry_probe",
  "Fetch recent unresolved issues from the Katlego Sentry project (read-only). Needs SENTRY_AUTH_TOKEN (or SENTRY_ACCESS_TOKEN) plus SENTRY_ORG and SENTRY_PROJECT in the environment.",
  {
    hours: z.number().optional().describe("Lookback window in hours (default 24)"),
    limit: z.number().optional().describe("Max issues to return (default 10)"),
  },
  async ({ hours, limit }) => {
    const org = process.env.SENTRY_ORG;
    const project = process.env.SENTRY_PROJECT;
    const token = process.env.SENTRY_AUTH_TOKEN ?? process.env.SENTRY_ACCESS_TOKEN;
    if (!org || !project || !token) {
      return {
        content: [{
          type: "text",
          text: "Sentry API not configured for probing. Set SENTRY_ORG, SENTRY_PROJECT and SENTRY_AUTH_TOKEN (see docs/sentry-setup.md), then re-run. Meanwhile: the app SDK is capturing to DSN: " + (process.env.NEXT_PUBLIC_SENTRY_DSN ? "configured ✓" : "not configured ✗ (set NEXT_PUBLIC_SENTRY_DSN)"),
        }],
      };
    }
    const h = Math.max(1, Math.min(720, Math.round(hours ?? 24)));
    const n = Math.max(1, Math.min(50, Math.round(limit ?? 10)));
    try {
      const res = await fetch(
        `https://sentry.io/api/0/projects/${encodeURIComponent(org)}/${encodeURIComponent(project)}/issues/?statsPeriod=${h}h&query=is:unresolved&limit=${n}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) return { content: [{ type: "text", text: `Sentry API error ${res.status}: ${await res.text()}` }] };
      const issues = await res.json();
      if (!issues.length) return { content: [{ type: "text", text: `No unresolved issues in ${project} over the last ${h}h.` }] };
      const text = issues.map((i) =>
        `#${i.shortId} [${i.level}] (${i.count ?? "?"} events, last ${(i.lastSeen ?? "").slice(0, 19)}) — ${i.title}\n   ${i.permalink}`,
      ).join("\n");
      return { content: [{ type: "text", text: `${issues.length} unresolved issue(s) in ${org}/${project}, last ${h}h:\n${text}` }] };
    } catch (err) {
      return { content: [{ type: "text", text: `sentry_probe failed: ${err?.message ?? err}` }] };
    }
  },
);

// ── Connect over stdio ────────────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);
