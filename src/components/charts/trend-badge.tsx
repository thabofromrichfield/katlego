'use client'

import { ArrowDownRight, ArrowUpRight } from 'lucide-react'

/* Small trend indicator pill used atop stat cards / chart cards.
   Colorblind-safe: direction is carried by icon + sign, not color alone. */

export function TrendBadge({ value }: { value: number | null | undefined }) {
  const positive = (value ?? 0) >= 0
  const color = positive ? '#059669' : '#e11d48'
  const bg = positive ? '#d1fae5' : '#ffe4e6'

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 9px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 800,
        color,
        background: bg,
        whiteSpace: 'nowrap',
      }}
    >
      {positive ? (
        <ArrowUpRight style={{ width: 13, height: 13 }} />
      ) : (
        <ArrowDownRight style={{ width: 13, height: 13 }} />
      )}
      {positive ? '+' : ''}
      {(value ?? 0).toFixed(1)}%
    </span>
  )
}
