'use client'

import type { ReactNode } from 'react'

/* Lightweight chart card wrapper in Katlego's visual language.
   Mirrors the `Card`/`CardHeader`/`CardContent` primitives but tuned for
   hosting bklit-ui charts (edge-to-edge chart area, right-aligned action). */

interface ChartCardProps {
  title: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
  style?: React.CSSProperties
  contentStyle?: React.CSSProperties
}

export function ChartCard({
  title,
  subtitle,
  action,
  children,
  style,
  contentStyle,
}: ChartCardProps) {
  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: 16,
        border: '1px solid #f1f5f9',
        boxShadow: '0 1px 4px rgba(15,23,42,0.06)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        ...style,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
          padding: '18px 20px 6px',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', lineHeight: 1.3 }}>{title}</p>
          {subtitle && (
            <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 3, fontWeight: 500 }}>{subtitle}</p>
          )}
        </div>
        {action && <div style={{ flexShrink: 0 }}>{action}</div>}
      </div>
      <div style={{ padding: '10px 20px 18px', minWidth: 0, ...contentStyle }}>{children}</div>
    </div>
  )
}
