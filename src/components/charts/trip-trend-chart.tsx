'use client'

import { Area, AreaChart } from '@/components/charts/vendor/charts/area-chart'
import { Grid } from '@/components/charts/vendor/charts/grid'
import { XAxis } from '@/components/charts/vendor/charts/x-axis'
import { YAxis } from '@/components/charts/vendor/charts/y-axis'
import { ChartTooltip } from '@/components/charts/vendor/charts/tooltip'
import { LinearGradient } from '@visx/gradient'

interface TripTrendDatum {
  date: Date
  count: number
  completed: number
}

interface TripTrendChartProps {
  data: TripTrendDatum[]
}

const fmtDay = (d: Date) =>
  d.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' })

/* Trip volume trend — area encodes magnitude, dashed line for completion.
   Tooltip shows date + both values. Data accepted as typed rows; bklit charts
   expect Record<string, unknown> so we widen explicitly. */
export function TripTrendChart({ data }: TripTrendChartProps) {
  const rows = data as unknown as Record<string, unknown>[]
  return (
    <AreaChart
      aspectRatio="21 / 9"
      className="w-full"
      data={rows}
      margin={{ top: 12, right: 16, bottom: 26, left: 40 }}
    >
      <Grid horizontal />
      <LinearGradient
        from="var(--chart-1)"
        fromOpacity={0.28}
        id="katlego-trip-volume-fill"
        to="var(--chart-1)"
        toOpacity={0.02}
      />
      <Area
        curve={undefined}
        dataKey="count"
        fill="url(#katlego-trip-volume-fill)"
        fillOpacity={1}
        gradientToOpacity={0}
        stroke="var(--chart-1)"
        strokeWidth={2.5}
        showHighlight
      />
      <Area
        curve={undefined}
        dataKey="completed"
        fill="transparent"
        stroke="var(--chart-3)"
        strokeWidth={2}
        dashArray="4 3"
        showHighlight
      />
      <ChartTooltip
        content={({ point }) => {
          const rawDate = point.date
          const date = rawDate instanceof Date ? rawDate : new Date(String(rawDate ?? ''))
          const count = typeof point.count === 'number' ? point.count : 0
          const completed = typeof point.completed === 'number' ? point.completed : 0
          return (
            <div style={{ padding: '10px 12px', fontSize: 12 }}>
              <p style={{ fontWeight: 700, marginBottom: 6 }}>{fmtDay(date)}</p>
              <p style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                <span style={{ opacity: 0.75 }}>Booked</span>
                <strong>{count}</strong>
              </p>
              <p style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginTop: 2 }}>
                <span style={{ opacity: 0.75 }}>Completed</span>
                <strong>{completed}</strong>
              </p>
            </div>
          )
        }}
        showCrosshair
        showDots
      />
      <XAxis numTicks={6} />
      <YAxis numTicks={5} />
    </AreaChart>
  )
}
