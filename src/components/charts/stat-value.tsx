'use client'

import { ChartStatFlow as VendorStatFlow } from '@/components/charts/vendor/charts/chart-stat-flow'
import type { ChartStatFlowFormat } from '@/components/charts/vendor/charts/chart-stat-flow'

interface StatValueProps {
  value: number
  label: string
  formatOptions?: ChartStatFlowFormat
  prefix?: string
  suffix?: string
  valueClassName?: string
  labelClassName?: string
}

/* Headline number + caption with animated count-up (NumberFlow).
   Used on stat cards and chart card headers. */
export function StatValue({
  value,
  label,
  formatOptions,
  prefix,
  suffix,
  valueClassName = 'text-[32px] font-extrabold leading-none tracking-tight text-slate-900',
  labelClassName = 'mt-1 text-xs font-semibold text-slate-500',
}: StatValueProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <VendorStatFlow
        formatOptions={formatOptions}
        label={label}
        labelClassName={labelClassName}
        prefix={prefix}
        suffix={suffix}
        value={value}
        valueClassName={valueClassName}
      />
    </div>
  )
}
