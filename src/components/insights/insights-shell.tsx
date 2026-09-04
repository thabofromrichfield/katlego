'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  LayoutDashboard, Truck, Ship, Plane, Users, BarChart3, Globe,
  Settings, LogOut, ChevronRight,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { InsightsContent, type KgTheme } from './insights-content'

/* Shell for the premium Katlego Insights dashboard.
   - standalone: floating rounded app frame with its own thin sidebar (the
     screenshot look). Use for public preview / a kiosk view.
   - embedded: content only — mounts inside the app's existing (protected)
     shell where the global sidebar already provides navigation. */
export function InsightsDashboard({ standalone = false }: { standalone?: boolean }) {
  const [theme, setTheme] = useState<KgTheme>('light')

  if (!standalone) {
    return <InsightsContent onToggle={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))} standalone={false} theme={theme} />
  }

  return (
    <div
      className="kgl"
      data-kgl-theme={theme}
      style={{
        minHeight: '100vh',
        padding: 14,
        display: 'flex',
        justifyContent: 'center',
        background:
          'radial-gradient(900px 520px at 88% -8%, var(--kgl-bg-glow-a), transparent 60%), radial-gradient(820px 560px at -6% 108%, var(--kgl-bg-glow-b), transparent 55%), var(--kgl-bg)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 1600,
          display: 'flex',
          borderRadius: 30,
          overflow: 'hidden',
          border: '1px solid var(--kgl-border-strong)',
          boxShadow: '0 40px 110px -40px rgba(3, 10, 20, 0.65), 0 4px 18px -8px rgba(3,10,20,0.25)',
          background: 'var(--kgl-bg)',
          minHeight: 'calc(100vh - 28px)',
        }}
      >
        <InsightsSidebar theme={theme} />
        <main style={{ flex: 1, minWidth: 0, overflowX: 'hidden' }}>
          <InsightsContent
            onToggle={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
            standalone
            theme={theme}
          />
        </main>
      </div>
    </div>
  )
}

/* ── Thin, minimal sidebar ──────────────────────────── */

interface NavItem {
  label: string
  icon: LucideIcon
  active?: boolean
  href?: string
}

const MAIN_NAV: NavItem[] = [
  { label: 'Overview', icon: LayoutDashboard, active: true },
  { label: 'Road Freight', icon: Truck, href: '/admin/vehicles' },
  { label: 'Sea Freight', icon: Ship, href: '/admin/reports' },
  { label: 'Air Freight', icon: Plane, href: '/admin/reports' },
  { label: 'Fleet & Drivers', icon: Users, href: '/admin/drivers' },
  { label: 'Reports', icon: BarChart3, href: '/admin/reports' },
  { label: 'Network', icon: Globe },
]

function InsightsSidebar({ theme }: { theme: KgTheme }) {
  const section = 'MAIN MENU'
  return (
    <aside
      className="kgl-aside"
      style={{
        width: 250,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, #1c2e47 0%, #12203a 55%, #0e1a2f 100%)',
        color: 'rgba(255,255,255,0.85)',
        padding: '20px 14px 16px',
      }}
    >
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '2px 8px 20px' }}>
        <div
          style={{
            width: 38, height: 38, borderRadius: 12, flexShrink: 0,
            background: 'linear-gradient(135deg, #ff8a2a, #e05f00)',
            boxShadow: '0 8px 22px -6px rgba(240,112,0,0.65)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 17, fontWeight: 900, color: '#fff',
          }}
        >
          K
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 16, fontWeight: 850, letterSpacing: '-0.01em', color: '#fff', lineHeight: 1.1 }}>Katlego</p>
          <p style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: 2.4, textTransform: 'uppercase', color: 'rgba(255,255,255,0.38)', marginTop: 3 }}>Global Logistics</p>
        </div>
      </div>

      {/* Section label */}
      <p style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: 2, color: 'rgba(255,255,255,0.32)', padding: '2px 10px 8px', textTransform: 'uppercase' }}>{section}</p>

      {/* Nav */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {MAIN_NAV.map((item) => {
          const Icon = item.icon
          const el = (
            <span
              style={{
                display: 'flex', alignItems: 'center', gap: 11,
                padding: '8px 11px', borderRadius: 11,
                fontSize: 13, fontWeight: item.active ? 750 : 600,
                color: item.active ? '#fff' : 'rgba(255,255,255,0.55)',
                background: item.active ? 'rgba(255,255,255,0.09)' : 'transparent',
                position: 'relative', cursor: 'pointer',
                transition: 'background 0.15s ease, color 0.15s ease',
              }}
              className={item.active ? undefined : 'kgl-nav-hover'}
            >
              {item.active && (
                <span style={{ position: 'absolute', left: -14, top: 6, bottom: 6, width: 3, borderRadius: 99, background: 'linear-gradient(180deg,#ff8a2a,#e05f00)' }} />
              )}
              <Icon style={{ width: 16, height: 16, strokeWidth: item.active ? 2.1 : 1.8 }} />
              {item.label}
            </span>
          )
          return item.href ? (
            <Link href={item.href} key={item.label} style={{ textDecoration: 'none', display: 'block' }}>
              {el}
            </Link>
          ) : (
            <span key={item.label}>{el}</span>
          )
        })}
      </nav>

      {/* Lower utility */}
      <div style={{ marginTop: 22 }}>
        <p style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: 2, color: 'rgba(255,255,255,0.32)', padding: '2px 10px 8px', textTransform: 'uppercase' }}>System</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {[
            { label: 'Settings', icon: Settings },
            { label: 'Sign out', icon: LogOut },
          ].map(({ label, icon: Icon }) => (
            <span
              key={label}
              style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '8px 11px', borderRadius: 11, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.45)', cursor: 'pointer' }}
            >
              <Icon style={{ width: 16, height: 16, strokeWidth: 1.8 }} />
              {label}
            </span>
          ))}
        </div>
      </div>

      <div style={{ flex: 1 }} />

      {/* Coverage mini-card */}
      <div style={{ margin: '12px 2px 14px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.045)', padding: '13px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 11.5, fontWeight: 750, color: 'rgba(255,255,255,0.85)' }}>Network coverage</span>
          <span style={{ fontSize: 12, fontWeight: 850, color: '#ff8a2a' }}>92%</span>
        </div>
        <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.12)', overflow: 'hidden' }}>
          <div style={{ width: '92%', height: '100%', borderRadius: 99, background: 'linear-gradient(90deg,#ff8a2a,#e05f00)' }} />
        </div>
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 9, fontWeight: 600, lineHeight: 1.45 }}>
          80+ countries · 255 cities<br />Licensed SARS customs clearing
        </p>
      </div>

      {/* User chip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.045)', padding: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 11, background: 'linear-gradient(135deg,#ff8a2a,#c75a00)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 850, flexShrink: 0 }}>KG</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 12, fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Katlego Ops</p>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.42)', fontWeight: 600 }}>Administrator</p>
        </div>
        <ChevronRight style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.35)' }} />
      </div>
      <span style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.25)', textAlign: 'center', marginTop: 12, fontWeight: 600, letterSpacing: 0.4 }}>
        {theme === 'dark' ? 'Dark' : 'Light'} theme · v1.0
      </span>
    </aside>
  )
}
