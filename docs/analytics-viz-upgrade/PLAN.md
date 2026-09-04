# Analytics Visualisation Upgrade — Katlego Logistics

Scope note + working notes for the current task. **This is not user documentation.**

## Objective (user request)

> Use the engineering & design agent-team libraries from
> `msitarzewski/agency-agents` (engineering/ + design/) as the teams behind all
> design & development, and use the open-source `bklit/bklit-ui` library to
> build good UI stat graphs across the analytics/reports dashboards.

## Upstream sources

| Source | What we take from it |
|---|---|
| `msitarzewski/agency-agents/engineering/engineering-data-visualization-engineer.md` | Chart-type selection by the question; honest encodings; bars start at zero; CVD/colorblind-safe palettes; no chartjunk; tooltips that add information; accessibility |
| `engineering-frontend-developer.md`, `engineering-software-architect.md`, `design-ui-designer.md`, `design-ux-architect.md`, `design-brand-guardian.md` | Consistency with Katlego's existing design tokens; system-first approach; brand color guardrails; reduced-motion & loading states |
| `bklit/bklit-ui` (public, MIT) | ComposableView area/line/bar/pie/ring/gauge charts, `ChartStatFlow`, stat-card blocks, tooltips/legend, theme via CSS vars (`--chart-1…5`) |

Copies of upstream team .md files used for this task are mirrored under
`docs/agency-agents/` so the reviewable source stays in-repo.
bklit-ui is consumed per its shadcn-registry model: component sources are
vendored from its published registry (`ui.bklit.com/r/*.json`, mirrored here),
**not** via `@bklitui/ui` (private workspace pkg).

## Design principles applied (from the team libraries)

1. **The question picks the chart.** Trips-over-time → area/line. Fleet/driver
   availability composition → donut/stacked (few slices). Utilisation % →
   gauge/ring. Category comparison → bars from zero.
2. **Position/length over angle/area**, bars start at zero.
3. **Colorblind-safe palettes** (blue/orange/teal/violet/green; never rely on
   red/green alone), meaning never carried by hue alone — pair with labels.
4. **Max data-ink, minimal chartjunk**; big headline number + short takeaway.
5. **Accessible**: aria summaries, text fallbacks where cheap, respect
   `prefers-reduced-motion`, loading skeletons (already a Katlego pattern).
6. **Brand fit**: reuse Katlego tokens (`--brand-primary #2563eb`, navy
   `#0f172a`, status colors) so charts feel native, not bolted-on.

## Scope (this change)

- Vendor the bklit-ui chart primitives under `src/components/charts/vendor/`
  (area, line, bar, pie, ring, gauge, legend, tooltip, grid, axis, utils,
  chart-stat-flow + needed visx deps) per upstream registry files.
- Add thin Katlego wrapper components + loading variants
  (`stat-card.tsx`, `sparkline` helpers).
- **Upgrade `admin/reports`**: system-pulse area/line (trips over last N days),
  fleet availability donut, driver availability bars (zero-based), utilisation
  gauges/rings, per-manager bar comparison.
- **Upgrade `admin` dashboard**: fleet/driver availability mini charts,
  headline stat-flow numbers, recent-trips pulse sparkline.
- **Upgrade manager dashboard** (part of `/admin` for managers) so team data
  gets the same treatment.
- Keep `dashboard/*` user flows untouched this round.
- Add the chart CSS vars to `globals.css` with Katlego token values.

## Registry closure (vendored set)

Charts selected: **area, line, bar, pie, ring, gauge** + shared primitives
(tooltip, legend, grid, axes, chart-stat-flow, utils, animation, context).
Vendored from bklit-ui published registry (`apps/web/public/r/*.json`, commit
`c57f66b…`, 2026-07-28). Full item/file list: `registry-closure.md`.
Resolution order (regDeps first): utils → chart-utils → chart-context →
chart-animation → chart-tooltip → chart-series → grid → x-axis →
shimmering-text → area-chart → line-chart → bar-chart → pie-chart →
ring-chart → gauge-chart (94 source files).

Runtime deps to add to Katlego `package.json`: `@visx/*` (the exact alpha
versions bklit pins), `motion`, `@number-flow/react`, `d3-*` (+types),
`@base-ui/react` (legend), `react-use-measure` (not used by our subset if
unneeded — verify), `clsx`, `tailwind-merge` (already present).
Do **not** add `@bklitui/ui` (private). Vendored code keeps `@/` path alias →
Katlego `src/components/charts/vendor` via a small import rewrite (alias to
`@/components/charts/vendor`), and `@bklitui/icons` uses (trend-badge) swap to
`lucide-react` (already a Katlego dep).

## Out of scope / follow-ups

- Supabase RLS/type fixes + `database.ts` regeneration (separate change; the
  chart work is type-safe but `npm run build` still fails repo-wide until the
  Supabase-typing errors are resolved).
- Wiring chart points to realtime trip history (needs a `trips.created_at`
  history query first).
