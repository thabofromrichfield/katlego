'use client'

import { Bar } from '@/components/charts/vendor/charts/bar'
import { BarChart } from '@/components/charts/vendor/charts/bar-chart'
import { BarXAxis } from '@/components/charts/vendor/charts/bar-x-axis'

interface MiniBarChartProps {
  data: { label: string; value: number }[]
  color?: string
  showAxis?: boolean
}

/* Compact bar chart for "compare categories" cases — bars start at zero
   (perceptual honesty), rounded tops, no gridlines needed at this size. */
export function MiniBarChart({
  data,
  color = 'var(--chart-1)',
  showAxis = false,
}: MiniBarChartProps) {
  return (
    <BarChart
      aspectRatio="2 / 1"
      className="w-full"
      data={data}
      margin={{ top: 8, right: 4, bottom: showAxis ? 22 : 4, left: 4 }}
      xDataKey="label"
    >
      <Bar dataKey="value" fill={color} lineCap="round" />
      {showAxis && <BarXAxis />}
    </BarChart>
  )
}
