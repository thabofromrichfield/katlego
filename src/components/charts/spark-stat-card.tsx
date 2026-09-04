'use client'

import { ChartCard } from './chart-card'
import { Sparkline } from './sparkline'
import { StatValue } from './stat-value'
import { TrendBadge } from './trend-badge'

interface SparkStatCardProps {
  title: string
  value: number
  label: string
  points: { date: Date; value: number }[]
  trend?: number | null
  color?: string
  formatOptions?: React.ComponentProps<typeof StatValue>['formatOptions']
  prefix?: string
  suffix?: string
}

/* Stat card with headline number (NumberFlow), trend pill and sparkline. */
export function SparkStatCard({
  title,
  value,
  label,
  points,
  trend,
  color = 'var(--chart-1)',
  formatOptions,
  prefix,
  suffix,
}: SparkStatCardProps) {
  return (
    <ChartCard title={title} action={trend != null ? <TrendBadge value={trend} /> : undefined}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <StatValue
          formatOptions={formatOptions}
          label={label}
          prefix={prefix}
          suffix={suffix}
          value={value}
        />
        <Sparkline color={color} data={points} />
      </div>
    </ChartCard>
  )
}
