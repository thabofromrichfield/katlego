#!/usr/bin/env node
/**
 * Vendors the bklit-ui chart subset from upstream registry JSON into this repo.
 *
 * The registry files live in the bklit-ui repo at apps/web/public/r/*.json and
 * are also served publicly at https://ui.bklit.com/r/{name}.json (shadcn
 * registry). We consume the *sources* (not the private @bklitui/ui pkg) —
 * this mirrors exactly what `npx shadcn add @bklit/area-chart` would install.
 *
 * Rewrites made on vendored files:
 *   - strip leading "// …" barrel-only lines (no barrel imports in our set)
 *   - rewrite "@/lib/utils"             -> "@/components/charts/vendor/lib/utils"
 *   - rewrite ".tsx\"/\".ts" unchanged  (files stay as-is otherwise)
 * Output goes to src/components/charts/vendor/ (path prefix "src/" stripped).
 *
 * Usage:
 *   node scripts/bklit/vendor-registry.mjs            # uses SOURCE_DIR (default ../bklit-ui checkout)
 *   SOURCE_DIR=/abs/path/to/bklit-ui node scripts/bklit/vendor-registry.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..", "..");
const SOURCE_DIR = resolve(process.env.SOURCE_DIR || join(REPO_ROOT, "..", ".cache", "bk-ref", "apps", "web", "public", "r"));
const OUT_DIR = join(REPO_ROOT, "src", "components", "charts", "vendor");

const CLOSURE = [
  "utils", "chart-utils", "chart-context", "chart-animation", "chart-tooltip",
  "chart-series", "grid", "x-axis", "shimmering-text",
  "area-chart", "line-chart", "bar-chart", "pie-chart", "ring-chart", "gauge-chart",
  "legend", "chart-stat-flow",
];

function readRegistryJson(name) {
  const p = join(SOURCE_DIR, `${name}.json`);
  if (!existsSync(p)) throw new Error(`registry item not found: ${name} (looked in ${p})`);
  return JSON.parse(readFileSync(p, "utf-8"));
}

const REWRITES = [
  ['@/lib/utils', '@/components/charts/vendor/lib/utils'],
];

let total = 0;
const written = [];
for (const name of CLOSURE) {
  const item = readRegistryJson(name);
  for (const file of item.files || []) {
    let { path, content } = file;
    const rel = path.replace(/^src\//, "");           // "charts/area-chart.tsx"
    const dest = join(OUT_DIR, rel);
    // quick sanity: no @bklit imports should remain in our set
    if (/from\s+["']@bklit/.test(content)) {
      throw new Error(`${name}/${path} still imports @bklit — update REWRITES`);
    }
    for (const [from, to] of REWRITES) content = content.split(from).join(to);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, content, "utf-8");
    written.push(rel);
    total++;
  }
}
console.log(`Vendored ${total} files from ${CLOSURE.length} registry items → ${OUT_DIR}`);
console.log(`SOURCE_DIR=${SOURCE_DIR}`);
