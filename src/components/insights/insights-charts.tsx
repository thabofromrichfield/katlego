'use client'

import { useId } from 'react'
import { Area, AreaChart } from '@/components/charts/vendor/charts/area-chart'
import { Grid } from '@/components/charts/vendor/charts/grid'
import { XAxis } from '@/components/charts/vendor/charts/x-axis'
import { YAxis } from '@/components/charts/vendor/charts/y-axis'
import { ChartTooltip } from '@/components/charts/vendor/charts/tooltip'
import { LinearGradient } from '@visx/gradient'
import { FleetDonut } from '@/components/charts/fleet-donut'
import { MiniBarChart } from '@/components/charts/mini-bar-chart'
import type { LaneDatum, ModeDatum, TrendPoint } from './insights-data'

/* Tiny SVG sparkline used inside KPI cards (pure SVG, theme-aware via CSS). */
export function Spark({ data, color = 'var(--kgl-accent)', width = 110, height = 34 }: {
  data: number[]
  color?: string
  width?: number
  height?: number
}) {
  const gid = useId().replace(/:/g, '')
  if (data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const span = max - min || 1
  const step = width / (data.length - 1)
  const pts = data.map((v, i) => [i * step, height - 3 - ((v - min) / span) * (height - 6)])
  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `${line} L${width},${height} L0,${height} Z`
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.35} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={2.6} fill={color} />
    </svg>
  )
}

/* Circular progress ring (used for occupancy / delivery rate mini stats). */
export function Ring({ value, size = 132, stroke = 11, color = 'var(--kgl-accent)', track = 'var(--kgl-border-strong)', children }: {
  value: number
  size?: number
  stroke?: number
  color?: string
  track?: string
  children?: React.ReactNode
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          fill="none"
          r={r}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * c} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dasharray 600ms ease' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </div>
    </div>
  )
}

const trendFmt = (d: Date) => d.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' })

/* Main area chart — shipments vs on-time, last 30 days. */
export function ShipmentTrendCard({ points }: { points: TrendPoint[] }) {
  const rows = points as unknown as Record<string, unknown>[]
  return (
    <div style={{ width: '100%', minWidth: 0 }}>
      {/* legend row */}
      <div style={{ display: 'flex', gap: 18, alignItems: 'center', padding: '2px 2px 4px', flexWrap: 'wrap' }}>
        <LegendDot color="var(--kgl-accent)" label="Shipments" />
        <LegendDot color="var(--kgl-good)" label="On-time deliveries" />
        <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--kgl-faint)' }}>Last 30 days</span>
      </div>
      <AreaChart aspectRatio="21 / 10" className="w-full" data={rows} margin={{ top: 8, right: 8, bottom: 24, left: 36 }}>
        <Grid horizontal />
        <LinearGradient from="var(--kgl-accent)" fromOpacity={0.3} id="kgl-shipment-fill" to="var(--kgl-accent)" toOpacity={0.01} />
        <Area
          dataKey="shipments"
          fill="url(#kgl-shipment-fill)"
          gradientToOpacity={0}
          stroke="var(--kgl-accent)"
          strokeWidth={2.5}
          showHighlight
        />
        <Area dataKey="onTime" fill="transparent" stroke="var(--kgl-good)" strokeWidth={2} dashArray="4 3" showHighlight />
        <ChartTooltip
          content={({ point }) => {
            const raw = point.date
            const d = raw instanceof Date ? raw : new Date(String(raw ?? ''))
            const shipments = typeof point.shipments === 'number' ? point.shipments : 0
            const onTime = typeof point.onTime === 'number' ? point.onTime : 0
            const pct = shipments > 0 ? Math.round((onTime / shipments) * 100) : 0
            return (
              <div style={{ padding: '10px 12px', fontSize: 12, minWidth: 168 }}>
                <p style={{ fontWeight: 800, marginBottom: 7 }}>{trendFmt(d)}</p>
                <Row label="Shipments" value={String(shipments)} dot="var(--kgl-accent)" />
                <Row label="On-time" value={String(onTime)} dot="var(--kgl-good)" />
                <p style={{ marginTop: 8, paddingTop: 7, borderTop: '1px solid rgba(255,255,255,0.12)', fontWeight: 700 }}>{pct}% on-time</p>
              </div>
            )
          }}
          showCrosshair
          showDots
        />
        <XAxis numTicks={6} />
        <YAxis numTicks={5} />
      </AreaChart>
    </div>
  )
}

function Row({ label, value, dot }: { label: string; value: string; dot: string }) {
  return (
    <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, marginTop: 3 }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: 3, background: dot, display: 'inline-block' }} />
        <span style={{ opacity: 0.7 }}>{label}</span>
      </span>
      <strong>{value}</strong>
    </p>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 600, color: 'var(--kgl-text-2)' }}>
      <span style={{ width: 9, height: 9, borderRadius: 3, background: color, display: 'inline-block' }} />
      {label}
    </span>
  )
}

/* Donut — in-transit shipments by mode. */
export function ModeDonutCard({ modes, centerLabel }: { modes: ModeDatum[]; centerLabel: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0 2px', width: '100%' }}>
      <FleetDonut centerLabel={centerLabel} data={modes} size={196} />
    </div>
  )
}

/* Bars from zero — top trade lanes. */
export function LanesBarsCard({ lanes }: { lanes: LaneDatum[] }) {
  return (
    <MiniBarChart color="var(--kgl-accent)" data={lanes} showAxis />
  )
}
