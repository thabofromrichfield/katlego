'use client'

import { useState } from 'react'
import { PieChart } from '@/components/charts/vendor/charts/pie-chart'
import { PieSlice } from '@/components/charts/vendor/charts/pie-slice'
import { PieCenter } from '@/components/charts/vendor/charts/pie-center'

interface DonutDatum {
  label: string
  value: number
  color: string
}

interface FleetDonutProps {
  data: DonutDatum[]
  centerLabel?: string
  size?: number
}

/* Part-to-whole donut for a handful of categories (perceptual honesty: pies are
   only reliable for ≤ ~5 slices). Center shows the total; slice hover crossfades
   to that slice's share. */
export function FleetDonut({
  data,
  centerLabel,
  size = 220,
}: FleetDonutProps) {
  const [hovered, setHovered] = useState<number | null>(null)

  const total = data.reduce((s, d) => s + d.value, 0) || 1
  const pct = (v: number) => Math.round((v / total) * 100)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
      <PieChart
        data={data as unknown as { label: string; value: number; color: string }[]}
        hoveredIndex={hovered}
        innerRadius={Math.max(24, size * 0.34)}
        onHoverChange={setHovered}
        size={size}
      >
        {data.map((_, i) => (
          <PieSlice hoverEffect="grow" hoverOffset={6} index={i} key={i} />
        ))}
        {/* Note: bklit's ChartTooltip requires the area/line/bar ChartProvider,
            so donuts keep their own hover-legend (below) instead of a tooltip. */}
        <PieCenter
          defaultLabel={centerLabel}
          formatOptions={{ maximumFractionDigits: 0 }}
        />
      </PieChart>

      {/* Legend — colored dot + label + value; hover mirrors slice hover */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 150 }}>
        {data.map((d, i) => (
          <button
            key={d.label}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              padding: '4px 6px',
              borderRadius: 10,
              opacity: hovered === null || hovered === i ? 1 : 0.45,
              transition: 'opacity 0.15s',
              fontFamily: 'inherit',
            }}
          >
            <span style={{ width: 10, height: 10, borderRadius: 4, background: d.color, flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#334155' }}>{d.label}</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
              {d.value}
            </span>
            <span style={{ fontSize: 11, color: '#94a3b8', minWidth: 38, textAlign: 'right' }}>
              {pct(d.value)}%
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
