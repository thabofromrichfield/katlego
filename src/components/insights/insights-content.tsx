'use client'

import {
  Package, Truck, TrendingUp, Activity, Search, Bell, Sun, Moon,
  CalendarDays, ChevronRight, Globe,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  kpis, trendSeries, modesInTransit, lanes, agents, recentShipments,
  type AgentRow, type ShipmentRow,
} from './insights-data'
import { ShipmentTrendCard, ModeDonutCard, LanesBarsCard, Spark, Ring } from './insights-charts'

export type KgTheme = 'light' | 'dark'

interface PanelProps {
  title: string
  subtitle?: string
  right?: React.ReactNode
  children: React.ReactNode
  style?: React.CSSProperties
  bodyStyle?: React.CSSProperties
}

export function Panel({ title, subtitle, right, children, style, bodyStyle }: PanelProps) {
  return (
    <section className="kgl-card" style={{ padding: '18px 20px 20px', minWidth: 0, display: 'flex', flexDirection: 'column', ...style }}>
      <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--kgl-text)', letterSpacing: '-0.01em' }}>{title}</p>
          {subtitle && <p style={{ fontSize: 11.5, color: 'var(--kgl-muted)', marginTop: 2, fontWeight: 500 }}>{subtitle}</p>}
        </div>
        {right && <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>{right}</div>}
      </header>
      <div style={{ minWidth: 0, flex: 1, ...bodyStyle }}>{children}</div>
    </section>
  )
}

const TONES: Record<string, { c: string; bg: string }> = {
  navy: { c: '#203040', bg: 'rgba(32,48,64,0.08)' },
  orange: { c: '#f07000', bg: 'rgba(240,112,0,0.10)' },
  green: { c: '#0ea371', bg: 'rgba(14,163,113,0.10)' },
  sky: { c: '#1f7fd6', bg: 'rgba(31,127,214,0.10)' },
}

const KPI_ICONS: Record<string, LucideIcon> = {
  shipments: Package,
  intransit: Truck,
  ontime: Activity,
  util: TrendingUp,
}

export function DeltaChip({ value }: { value: number }) {
  const up = value >= 0
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 3,
        fontSize: 11.5, fontWeight: 800, padding: '3px 8px', borderRadius: 999,
        color: up ? 'var(--kgl-good)' : 'var(--kgl-bad)',
        background: up ? 'var(--kgl-good-soft)' : 'var(--kgl-bad-soft)',
      }}
    >
      {up ? '▲' : '▼'} {Math.abs(value).toFixed(1)}%
    </span>
  )
}

function KpiGrid() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16 }}>
      {kpis.map((k) => {
        const tone = TONES[k.tone] ?? TONES.navy
        const Icon = KPI_ICONS[k.id] ?? Activity
        return (
          <div key={k.id} className="kgl-card" style={{ padding: '16px 18px 14px', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ padding: 9, borderRadius: 12, background: tone.bg, display: 'flex' }}>
                <Icon style={{ width: 18, height: 18, color: tone.c }} strokeWidth={2} />
              </div>
              <DeltaChip value={k.delta} />
            </div>
            <p style={{ marginTop: 14, fontSize: 11.5, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--kgl-muted)' }}>{k.label}</p>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8, marginTop: 4 }}>
              <p style={{ fontSize: 30, fontWeight: 850, letterSpacing: '-0.02em', color: 'var(--kgl-text)', lineHeight: 1.05, fontVariantNumeric: 'tabular-nums' }}>{k.value}</p>
              <Spark color={tone.c} data={k.spark} width={92} height={30} />
            </div>
            <p style={{ marginTop: 4, fontSize: 11, color: 'var(--kgl-faint)', fontWeight: 500 }}>{k.deltaLabel}</p>
          </div>
        )
      })}
    </div>
  )
}

/* ── Charts ─────────────────────────────────────────── */

function ChartsGrid() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16 }}>
      <Panel
        title="Shipment volume"
        subtitle="Total shipments vs on-time deliveries · last 30 days"
        right={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 700, color: 'var(--kgl-good)', background: 'var(--kgl-good-soft)', padding: '3px 9px', borderRadius: 999 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--kgl-good)' }} /> Live
          </span>
        }
      >
        <ShipmentTrendCard points={trendSeries(30)} />
      </Panel>

      <Panel title="In transit by mode" subtitle="86 shipments currently moving">
        <ModeDonutCard centerLabel="In transit" modes={modesInTransit} />
      </Panel>
    </div>
  )
}

function SecondaryGrid() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
      <Panel title="Top trade lanes" subtitle="Shipments handled this month by route">
        <LanesBarsCard lanes={lanes} />
      </Panel>

      <Panel title="Warehouse occupancy" subtitle="Katlego national warehousing">
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <Ring color="var(--kgl-accent)" value={82}>
            <span style={{ fontSize: 22, fontWeight: 850, color: 'var(--kgl-text)', letterSpacing: '-0.02em' }}>82%</span>
            <span style={{ fontSize: 10, color: 'var(--kgl-muted)', fontWeight: 600, marginTop: 1 }}>used</span>
          </Ring>
          <div style={{ flex: 1, minWidth: 150, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { l: 'Total capacity', v: '12 400 m²', c: 'var(--kgl-text)' },
              { l: 'Utilised', v: '10 200 m²', c: 'var(--kgl-accent)' },
              { l: 'Available', v: '2 200 m²', c: 'var(--kgl-good)' },
              { l: 'Cold storage', v: '1 600 m²', c: 'var(--kgl-text-2)' },
            ].map((r) => (
              <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12.5 }}>
                <span style={{ color: 'var(--kgl-muted)', fontWeight: 500 }}>{r.l}</span>
                <strong style={{ color: r.c, fontWeight: 750, fontVariantNumeric: 'tabular-nums' }}>{r.v}</strong>
              </div>
            ))}
          </div>
        </div>
      </Panel>

      <Panel title="Global network" subtitle="Trusted agents in 255 cities worldwide">
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 14 }}>
          <div style={{ width: 46, height: 46, borderRadius: 15, background: 'var(--kgl-accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Globe style={{ width: 22, height: 22, color: 'var(--kgl-accent)' }} strokeWidth={1.8} />
          </div>
          <div>
            <p style={{ fontSize: 22, fontWeight: 850, color: 'var(--kgl-text)', lineHeight: 1 }}>80+ countries</p>
            <p style={{ fontSize: 11.5, color: 'var(--kgl-muted)', marginTop: 2 }}>Air · Sea · Road · customs & warehousing</p>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          {[
            { l: 'Sub-Saharan coverage', p: 92 },
            { l: 'EU / UK lanes', p: 84 },
            { l: 'Asia-Pacific lanes', p: 71 },
            { l: 'Americas lanes', p: 63 },
          ].map((row) => (
            <div key={row.l}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, marginBottom: 5 }}>
                <span style={{ color: 'var(--kgl-text-2)' }}>{row.l}</span>
                <span style={{ color: 'var(--kgl-text)', fontVariantNumeric: 'tabular-nums' }}>{row.p}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 99, background: 'var(--kgl-surface-2)', overflow: 'hidden', border: '1px solid var(--kgl-border)' }}>
                <div style={{ height: '100%', width: `${row.p}%`, borderRadius: 99, background: 'linear-gradient(90deg, var(--kgl-accent), var(--kgl-accent-bright))' }} />
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}

/* ── Team / agents ──────────────────────────────────── */

function AgentCard({ agent }: { agent: AgentRow }) {
  return (
    <div className="kgl-card" style={{ padding: '16px 16px 14px', minWidth: 0, flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <div
          style={{
            width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
            background: `linear-gradient(135deg, hsl(${agent.hue} 62% 52%), hsl(${agent.hue} 62% 32%))`,
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 800, letterSpacing: '0.02em',
            boxShadow: '0 6px 16px -6px rgba(0,0,0,0.35)',
          }}
        >
          {agent.initials}
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 13.5, fontWeight: 750, color: 'var(--kgl-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{agent.name}</p>
          <p style={{ fontSize: 11.5, color: 'var(--kgl-muted)', marginTop: 1, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{agent.role}</p>
        </div>
      </div>
      <div style={{ marginTop: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 21, fontWeight: 850, color: 'var(--kgl-accent)', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{agent.stat}</span>
          <span style={{ fontSize: 11, color: 'var(--kgl-muted)', fontWeight: 600 }}>{agent.statLabel}</span>
        </div>
        <div style={{ marginTop: 8, height: 5, borderRadius: 99, background: 'var(--kgl-surface-2)', border: '1px solid var(--kgl-border)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${agent.score}%`, borderRadius: 99, background: 'linear-gradient(90deg, var(--kgl-accent), var(--kgl-accent-bright))', transition: 'width 700ms ease' }} />
        </div>
      </div>
    </div>
  )
}

function AgentsRow() {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
        <div>
          <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--kgl-text)' }}>Top performing agents</p>
          <p style={{ fontSize: 11.5, color: 'var(--kgl-muted)', marginTop: 2 }}>Recognition from the last 30 days of operations</p>
        </div>
        <button
          type="button"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12.5, fontWeight: 700, color: 'var(--kgl-accent)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          View leaderboard <ChevronRight style={{ width: 14, height: 14 }} />
        </button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
        {agents.map((a) => <AgentCard agent={a} key={a.id} />)}
      </div>
    </div>
  )
}

/* ── Table ──────────────────────────────────────────── */

const MODE_STYLE: Record<ShipmentRow['mode'], { label: string; c: string; bg: string }> = {
  Air: { label: 'Air', c: '#1f7fd6', bg: 'rgba(31,127,214,0.10)' },
  Sea: { label: 'Sea', c: '#203040', bg: 'rgba(32,48,64,0.08)' },
  Road: { label: 'Road', c: '#f07000', bg: 'rgba(240,112,0,0.10)' },
}

const STATUS_STYLE: Record<ShipmentRow['status'], { c: string; bg: string; dot: string }> = {
  'In Transit': { c: '#f07000', bg: 'rgba(240,112,0,0.10)', dot: '#f07000' },
  'At Customs': { c: '#b45309', bg: 'rgba(217,119,6,0.12)', dot: '#d97706' },
  'Cleared': { c: '#0ea371', bg: 'rgba(14,163,113,0.10)', dot: '#0ea371' },
  'Delivered': { c: '#203040', bg: 'rgba(32,48,64,0.08)', dot: '#203040' },
  'Awaiting Docs': { c: '#d1385f', bg: 'rgba(209,56,95,0.10)', dot: '#d1385f' },
}

function StatusPill({ status }: { status: ShipmentRow['status'] }) {
  const s = STATUS_STYLE[status]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 9px', borderRadius: 999, fontSize: 11.5, fontWeight: 750, color: s.c, background: s.bg, whiteSpace: 'nowrap' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot }} />
      {status}
    </span>
  )
}

function ShipmentsTable() {
  return (
    <Panel
      title="Recent shipments"
      subtitle="Latest jobs across air, sea and road freight"
      right={
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--kgl-accent)', cursor: 'pointer' }}>
          View all <ChevronRight style={{ width: 14, height: 14 }} />
        </span>
      }
      bodyStyle={{ margin: '0 -8px -6px' }}
    >
      <div style={{ overflowX: 'auto' }}>
        <div style={{ minWidth: 860 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(150px,1.3fr) minmax(150px,1.4fr) minmax(170px,1.5fr) 64px minmax(150px,1.1fr) 120px 96px', gap: 12, padding: '8px 8px 10px', alignItems: 'center' }}>
            {['Job reference', 'Customer', 'Route', 'Mode', 'Status', 'Value', 'Date'].map((h) => (
              <p key={h} style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--kgl-faint)' }}>{h}</p>
            ))}
          </div>
          {recentShipments.map((s, i) => {
            const mode = MODE_STYLE[s.mode]
            return (
              <div
                key={s.id}
                style={{
                  display: 'grid', gridTemplateColumns: 'minmax(150px,1.3fr) minmax(150px,1.4fr) minmax(170px,1.5fr) 64px minmax(150px,1.1fr) 120px 96px', gap: 12, alignItems: 'center',
                  padding: '11px 8px', borderRadius: 14,
                  borderTop: i === 0 ? '1px solid var(--kgl-border)' : 'none',
                  background: i % 2 === 1 ? 'var(--kgl-surface-2)' : 'transparent',
                }}
              >
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--kgl-accent)', fontVariantNumeric: 'tabular-nums' }}>{s.ref}</p>
                <p style={{ fontSize: 13, fontWeight: 650, color: 'var(--kgl-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.customer}</p>
                <p style={{ fontSize: 12.5, color: 'var(--kgl-text-2)', fontWeight: 550, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.route}</p>
                <span style={{ fontSize: 11.5, fontWeight: 800, color: mode.c, background: mode.bg, padding: '3px 0', borderRadius: 8, textAlign: 'center', width: 52 }}>{mode.label}</span>
                <StatusPill status={s.status} />
                <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--kgl-text)', fontVariantNumeric: 'tabular-nums' }}>{s.value}</p>
                <p style={{ fontSize: 12, color: 'var(--kgl-muted)', fontWeight: 550 }}>{s.date}</p>
              </div>
            )
          })}
        </div>
      </div>
    </Panel>
  )
}

/* ── Header ─────────────────────────────────────────── */

export function InsightsHeader({ standalone, theme, onToggle }: {
  standalone: boolean
  theme: KgTheme
  onToggle: () => void
}) {
  const today = new Date().toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  return (
    <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 22 }}>
      <div>
        <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--kgl-accent)' }}>Katlego Global Logistics</p>
        <h1 style={{ fontSize: 24, fontWeight: 850, letterSpacing: '-0.02em', color: 'var(--kgl-text)', marginTop: 3 }}>Operations Overview</h1>
        <p style={{ fontSize: 12.5, color: 'var(--kgl-muted)', marginTop: 3, fontWeight: 550 }}>{today}</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {standalone && (
          <label style={{ display: 'none', alignItems: 'center', gap: 8, height: 40, padding: '0 14px', borderRadius: 14, border: '1px solid var(--kgl-border)', background: 'var(--kgl-surface)', color: 'var(--kgl-faint)', minWidth: 220 }} className="md:flex">
            <Search style={{ width: 15, height: 15 }} />
            <input placeholder="Search shipments, customers…" aria-label="Search" style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 12.5, color: 'var(--kgl-text)', width: '100%' }} />
          </label>
        )}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 40, padding: '0 13px', borderRadius: 14, border: '1px solid var(--kgl-border)', background: 'var(--kgl-surface)', fontSize: 12.5, fontWeight: 700, color: 'var(--kgl-text-2)', whiteSpace: 'nowrap' }}>
          <CalendarDays style={{ width: 15, height: 15, color: 'var(--kgl-muted)' }} /> Last 30 days
        </span>
        <button
          type="button"
          onClick={onToggle}
          aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
          style={{ width: 40, height: 40, borderRadius: 14, border: '1px solid var(--kgl-border)', background: 'var(--kgl-surface)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--kgl-text-2)' }}
        >
          {theme === 'light' ? <Moon style={{ width: 16, height: 16 }} /> : <Sun style={{ width: 16, height: 16 }} />}
        </button>
        {standalone && (
          <>
            <button type="button" aria-label="Notifications" style={{ position: 'relative', width: 40, height: 40, borderRadius: 14, border: '1px solid var(--kgl-border)', background: 'var(--kgl-surface)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--kgl-text-2)' }}>
              <Bell style={{ width: 16, height: 16 }} />
              <span style={{ position: 'absolute', top: 9, right: 10, width: 7, height: 7, borderRadius: '50%', background: 'var(--kgl-accent)', border: '1.5px solid var(--kgl-surface-solid)' }} />
            </button>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '4px 6px 4px 4px', borderRadius: 16, border: '1px solid var(--kgl-border)', background: 'var(--kgl-surface)' }}>
              <div style={{ width: 32, height: 32, borderRadius: 11, background: 'linear-gradient(135deg,#f07000,#c75a00)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 }}>KG</div>
              <div style={{ display: 'none', flexDirection: 'column', lineHeight: 1.25 }} className="lg:flex">
                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--kgl-text)' }}>Katlego Ops</span>
                <span style={{ fontSize: 10.5, color: 'var(--kgl-muted)' }}>Head office · JHB</span>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  )
}

/* ── Full content (used standalone + embedded) ─────── */

export function InsightsContent({ standalone, theme, onToggle }: {
  standalone: boolean
  theme: KgTheme
  onToggle: () => void
}) {
  return (
    <div className="kgl" data-kgl-theme={theme} style={{ background: 'var(--kgl-bg)', color: 'var(--kgl-text)', minHeight: '100vh', fontFamily: "inherit" }}>
      <div style={{ padding: '26px clamp(16px, 3vw, 34px) 40px', maxWidth: 1440, margin: '0 auto', width: '100%' }}>
        <InsightsHeader onToggle={onToggle} standalone={standalone} theme={theme} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <KpiGrid />
          <ChartsGrid />
          <SecondaryGrid />
          <AgentsRow />
          <ShipmentsTable />
        </div>
        <footer style={{ marginTop: 26, textAlign: 'center', fontSize: 11.5, color: 'var(--kgl-faint)', fontWeight: 600 }}>
          Katlego Global Logistics (Pty) Ltd · Licensed SARS customs clearing · Black-owned & managed · Trusted agents in 255 cities worldwide
        </footer>
      </div>
    </div>
  )
}
