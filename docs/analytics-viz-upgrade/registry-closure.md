## utils
deps: clsx, tailwind-merge
files:
  - src/lib/utils.ts
## chart-utils
files:
  - src/charts/chart-formatters.ts
  - src/charts/decimate-time-series.ts
  - src/charts/use-scheduled-tooltip.ts
## chart-context
deps: @visx/event@4.0.1-alpha.0, @visx/responsive@4.0.1-alpha.0, @visx/scale@4.0.1-alpha.0, d3-array, motion
reg-deps: @bklit/utils, @bklit/chart-utils
files:
  - src/charts/chart-context.tsx
  - src/charts/reference-area-config.ts
  - src/charts/use-chart-interaction.ts
  - src/charts/y-axis-scales.ts
  - src/charts/y-axis-ticks.ts
  - src/charts/chart-phase.ts
  - src/charts/y-domain-utils.ts
  - src/charts/filter-data-by-x-domain.ts
  - src/charts/generate-chart-skeleton-data.ts
  - src/charts/use-animated-y-domains.ts
  - src/charts/use-chart-phase-orchestrator.ts
  - src/charts/line-loading-timing.ts
## chart-animation
deps: motion
files:
  - src/charts/animation.ts
  - src/charts/motion-utils.ts
  - src/charts/use-mount-progress.ts
  - src/charts/use-enter-complete.ts
  - src/charts/chart-reveal-clip.tsx
  - src/charts/static-chart-preview-context.tsx
  - src/charts/chart-defs.ts
## chart-tooltip
deps: @number-flow/react, motion
reg-deps: @bklit/chart-context, @bklit/utils
files:
  - src/charts/chart-config-context.tsx
  - src/charts/indicator-fade.ts
  - src/charts/tooltip/chart-tooltip.tsx
  - src/charts/tooltip/tooltip-box.tsx
  - src/charts/tooltip/tooltip-content.tsx
  - src/charts/tooltip/tooltip-dot.tsx
  - src/charts/tooltip/tooltip-indicator.tsx
  - src/charts/tooltip/date-ticker.tsx
  - src/charts/tooltip/index.ts
## chart-series
deps: @visx/shape@4.0.1-alpha.0, d3-shape, motion
reg-deps: @bklit/chart-context, @bklit/chart-animation, @bklit/chart-tooltip
files:
  - src/charts/path-stroke-utils.ts
  - src/charts/series-path-utils.ts
  - src/charts/use-animated-series-path.ts
  - src/charts/highlight-segment-bounds.ts
  - src/charts/highlight-segment.tsx
  - src/charts/dash-tail-stroke.tsx
  - src/charts/series-dash-tail-overlay.tsx
  - src/charts/series-highlight-layer.tsx
  - src/charts/chart-legend-hover.tsx
  - src/charts/series-hover-dim.tsx
  - src/charts/series-point-marker.tsx
  - src/charts/series-markers.tsx
  - src/charts/use-highlight-segment.ts
  - src/charts/area-gradient-defs.tsx
  - src/charts/fade-edges.ts
## grid
deps: @visx/grid@4.0.1-alpha.0
reg-deps: @bklit/chart-context
files:
  - src/charts/grid.tsx
  - src/charts/use-grid-shimmer.ts
## x-axis
reg-deps: @bklit/chart-context, @bklit/utils
files:
  - src/charts/x-axis.tsx
## shimmering-text
deps: motion
reg-deps: @bklit/utils
files:
  - src/components/shimmering-text.tsx
## area-chart
deps: @visx/curve@4.0.1-alpha.0, @visx/gradient@4.0.1-alpha.0, @visx/shape@4.0.1-alpha.0, motion
reg-deps: @bklit/chart-context, @bklit/chart-animation, @bklit/chart-series, @bklit/grid, @bklit/x-axis, @bklit/chart-tooltip, @bklit/shimmering-text, @bklit/utils
files:
  - src/charts/area-chart.tsx
  - src/charts/time-series-chart-shell.tsx
  - src/charts/reference-area-registration-context.tsx
  - src/charts/projection-config.ts
  - src/charts/projection-utils.ts
  - src/charts/chart-child-passthrough.ts
  - src/charts/series-bar-layout.ts
  - src/charts/area.tsx
  - src/charts/area-chart-loading.tsx
  - src/charts/line-loading-pulse.tsx
  - src/charts/loading-sweep.tsx
  - src/charts/line-loading-timing.ts
  - src/charts/chart-loading-label.tsx
  - src/charts/pattern-area.tsx
## line-chart
deps: @visx/curve@4.0.1-alpha.0, @visx/shape@4.0.1-alpha.0, motion
reg-deps: @bklit/chart-context, @bklit/chart-animation, @bklit/chart-series, @bklit/grid, @bklit/x-axis, @bklit/chart-tooltip, @bklit/shimmering-text, @bklit/utils
files:
  - src/charts/line-chart.tsx
  - src/charts/time-series-chart-shell.tsx
  - src/charts/reference-area-registration-context.tsx
  - src/charts/projection-config.ts
  - src/charts/projection-utils.ts
  - src/charts/projection-line.tsx
  - src/charts/projection-line-end-marker.tsx
  - src/charts/line-series-terminal-marker.tsx
  - src/charts/chart-child-passthrough.ts
  - src/charts/series-bar-layout.ts
  - src/charts/line.tsx
  - src/charts/line-chart-loading.tsx
  - src/charts/line-loading-pulse.tsx
  - src/charts/loading-sweep.tsx
  - src/charts/line-loading-timing.ts
  - src/charts/chart-loading-label.tsx
## bar-chart
deps: @visx/gradient@4.0.1-alpha.0, @visx/pattern@4.0.1-alpha.0, @visx/shape@4.0.1-alpha.0, motion
reg-deps: @bklit/chart-context, @bklit/chart-animation, @bklit/grid, @bklit/chart-tooltip, @bklit/utils
files:
  - src/charts/bar-chart.tsx
  - src/charts/chart-child-passthrough.ts
  - src/charts/chart-legend-hover.tsx
  - src/charts/bar.tsx
  - src/charts/bar-squares.tsx
  - src/charts/bar-squares-layout.ts
  - src/charts/pattern-preset.tsx
  - src/charts/visx-pattern.tsx
  - src/charts/bar-depth-geometry.ts
  - src/charts/bar-x-axis.tsx
  - src/charts/bar-y-axis.tsx
  - src/charts/loading-sweep.tsx
  - src/charts/bar-chart-loading.tsx
## pie-chart
deps: @number-flow/react, @visx/group@4.0.1-alpha.0, @visx/responsive@4.0.1-alpha.0, @visx/shape@4.0.1-alpha.0, d3-shape, motion
reg-deps: @bklit/chart-animation, @bklit/utils
files:
  - src/charts/pie-chart.tsx
  - src/charts/pie-context.tsx
  - src/charts/pie-slice.tsx
  - src/charts/chart-stat-flow.tsx
  - src/charts/pie-center-shell.tsx
  - src/charts/pie-center.tsx
  - src/charts/chart-center-typography.ts
## ring-chart
deps: @visx/group@4.0.1-alpha.0, @visx/responsive@4.0.1-alpha.0, @visx/shape@4.0.1-alpha.0, @number-flow/react, motion
reg-deps: @bklit/chart-animation, @bklit/utils
files:
  - src/charts/ring-chart.tsx
  - src/charts/ring-context.tsx
  - src/charts/ring.tsx
  - src/charts/chart-stat-flow.tsx
  - src/charts/ring-center.tsx
  - src/charts/chart-center-typography.ts
## gauge-chart
deps: @visx/responsive@4.0.1-alpha.0, @visx/pattern@4.0.1-alpha.0, @number-flow/react, motion, d3-shape
reg-deps: @bklit/utils
files:
  - src/charts/chart-stat-flow.tsx
  - src/charts/pie-context.tsx
  - src/charts/pie-center-shell.tsx
  - src/charts/pie-center.tsx
  - src/charts/gauge.tsx
  - src/charts/notch-gauge-shared.ts
  - src/charts/gauge-label-layout.tsx
  - src/charts/chart-center-typography.ts