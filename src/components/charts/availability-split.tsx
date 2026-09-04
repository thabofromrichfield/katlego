'use client'

import { Bar } from '@/components/charts/vendor/charts/bar'
import { BarChart as BarChartRoot } from '@/components/charts/vendor/charts/bar-chart'
import { ChartTooltip } from '@/components/charts/vendor/charts/tooltip'

interface SplitDatum {
  label: string
  value: number
  color: string
}

interface AvailabilitySplitProps {
  data: SplitDatum[]
}

/* Single-series grouped comparison (bars from zero) for availability counts:
   driver availability / fleet status. Value labels are drawn as tooltips +
   a per-row legend so color is never the only channel. */
export function AvailabilitySplit({ data }: AvailabilitySplitProps) {
  return (
    <div style={{ width: '100%' }}>
      <BarChartRoot
        aspectRatio="16 / 7"
        className="w-full"
        data={data as unknown as Record<string, unknown>[]}
        margin={{ top: 16, right: 8, bottom: 8, left: 8 }}
        xDataKey="label"
      >
        <Bar dataKey="value" fill="var(--chart-1)" lineCap="round" />
        <ChartTooltip
          content={({ point }) => {
            const label = String(point.label ?? '')
            const val = typeof point.value === 'number' ? point.value : Number(point.value ?? 0)
            const color = typeof point.color === 'string' ? point.color : 'var(--chart-1)'
            return (
              <div style={{ padding: '8px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: color, display: 'inline-block' }} />
                <span>{label}</span>
                <strong>{val}</strong>
              </div>
            )
          }}
        />
      </BarChartRoot>
    </div>
  )
}
