'use client'

import { Area, AreaChart } from '@/components/charts/vendor/charts/area-chart'
import { LinearGradient } from '@visx/gradient'

interface SparklineProps {
  data: { date: Date; value: number }[]
  color?: string
  height?: number
}

/* Compact area sparkline for stat cards — trend-at-a-glance, no axes. */
export function Sparkline({
  data,
  color = 'var(--chart-1)',
  height = 64,
}: SparklineProps) {
  if (data.length === 0) return null
  return (
    <AreaChart
      aspectRatio="3 / 1"
      className="w-full"
      data={data}
      margin={{ top: 2, right: 0, bottom: 2, left: 0 }}
      style={{ height, width: '100%' }}
    >
      <LinearGradient
        from={color}
        fromOpacity={0.25}
        id="katlego-sparkline-fill"
        to={color}
        toOpacity={0}
      />
      <Area
        curve={undefined}
        dataKey="value"
        fill="url(#katlego-sparkline-fill)"
        fillOpacity={1}
        gradientToOpacity={0}
        stroke={color}
        strokeWidth={2}
        showHighlight={false}
      />
    </AreaChart>
  )
}
