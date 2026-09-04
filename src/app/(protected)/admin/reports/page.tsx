'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/layout/page-header'
import {
  Users, Car, Truck, BarChart3, CheckCircle, Clock,
  TrendingUp, Wifi, WifiOff, Wrench, UserCheck, Activity,
} from 'lucide-react'

/* ─── Pulse card ──────────────────────────────────────── */
function PulseCard({ label, value, sub, color, bg, icon: Icon, large }: {
  label: string; value: number | string; sub?: string
  color: string; bg: string; icon: any; large?: boolean
}) {
  return (
    <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 6px rgba(15,23,42,0.06)', padding: large ? 24 : 18, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', minWidth: 0 }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: large ? 10 : 7 }}>{label}</p>
        <p style={{ fontSize: large ? 44 : 34, fontWeight: 900, color: '#0f172a', lineHeight: 1, letterSpacing: '-1px' }}>{value}</p>
        {sub && <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 5, fontWeight: 500 }}>{sub}</p>}
      </div>
      <div style={{ padding: large ? 14 : 10, borderRadius: 14, flexShrink: 0, marginLeft: 12, background: bg }}>
        <Icon style={{ width: large ? 28 : 22, height: large ? 28 : 22, color }} />
      </div>
    </div>
  )
}

/* ─── Progress bar ────────────────────────────────────── */
function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
        <span>{label}</span>
        <span style={{ color: '#0f172a', fontWeight: 700 }}>{value} <span style={{ color: '#94a3b8', fontWeight: 400 }}>/ {max}</span></span>
      </div>
      <div style={{ height: 10, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width 0.8s ease' }} />
      </div>
    </div>
  )
}

/* ─── Section header ─────────────────────────────────── */
function SectionTitle({ icon: Icon, title, sub, color }: { icon: any; title: string; sub?: string; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon style={{ width: 18, height: 18, color }} />
      </div>
      <div>
        <p style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{title}</p>
        {sub && <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{sub}</p>}
      </div>
    </div>
  )
}

export default function ReportsPage() {
  const [pulse,    setPulse]    = useState<any>(null)
  const [managers, setManagers] = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const [{ data: p }, { data: m }] = await Promise.all([
        supabase.rpc('get_system_pulse'),
        supabase.rpc('get_manager_summary'),
      ])
      setPulse(p?.[0] ?? null)
      setManagers(m ?? [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div>
        <div style={{ height: 40, width: 280, background: '#f1f5f9', borderRadius: 12, marginBottom: 8 }} />
        <div style={{ height: 20, width: 360, background: '#f1f5f9', borderRadius: 8, marginBottom: 28 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
          {[...Array(6)].map((_, i) => <div key={i} style={{ height: 108, background: '#f1f5f9', borderRadius: 16 }} />)}
        </div>
        <div style={{ height: 300, background: '#f1f5f9', borderRadius: 16 }} />
      </div>
    )
  }

  if (!pulse) {
    return (
      <div>
        <PageHeader title="Reports & Analytics" subtitle="System-wide business health" />
        <div style={{ textAlign: 'center', padding: '64px 0', color: '#94a3b8' }}>
          <p>Run the latest SQL migrations to enable analytics.</p>
        </div>
      </div>
    )
  }

  const driverOnlinePct  = pulse.total_drivers  > 0 ? Math.round((Number(pulse.online_drivers)    / Number(pulse.total_drivers))   * 100) : 0
  const vehicleUsePct    = pulse.total_vehicles > 0 ? Math.round((Number(pulse.in_use_vehicles)   / Number(pulse.total_vehicles))  * 100) : 0
  const vehicleAvailPct  = pulse.total_vehicles > 0 ? Math.round((Number(pulse.available_vehicles) / Number(pulse.total_vehicles)) * 100) : 0
  const completionRate   = Number(pulse.completion_rate)

  return (
    <div>
      <PageHeader title="Reports & Analytics" subtitle="Complete system health — all managers, drivers and fleet" />

      {/* ── SECTION 1: System Pulse ── */}
      <div style={{ marginBottom: 28 }}>
        <SectionTitle icon={Activity} title="System Pulse" sub="Live snapshot of the entire operation" color="#2563eb" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
          <PulseCard label="Trips Today"     value={pulse.trips_today}       sub="bookings so far today"        color="#2563eb" bg="#dbeafe" icon={TrendingUp} large />
          <PulseCard label="Trips This Week" value={pulse.trips_this_week}   sub="rolling 7-day window"         color="#7c3aed" bg="#ede9fe" icon={BarChart3} large />
          <PulseCard label="Total Trips"     value={pulse.total_trips_ever}  sub="all time"                     color="#475569" bg="#f1f5f9" icon={BarChart3} />
          <PulseCard label="Completed"       value={pulse.completed_ever}    sub={`${completionRate}% rate`}    color="#059669" bg="#d1fae5" icon={CheckCircle} />
          <PulseCard label="Active Now"      value={pulse.active_now}        sub="in progress right now"        color="#0284c7" bg="#e0f2fe" icon={Activity} />
          <PulseCard label="Awaiting Approval" value={pulse.pending_now}     sub="need action"                 color="#d97706" bg="#fef3c7" icon={Clock} />
        </div>
      </div>

      {/* ── SECTION 2: People ── */}
      <div style={{ marginBottom: 28 }}>
        <SectionTitle icon={Users} title="People" sub="Managers, drivers and users across the platform" color="#7c3aed" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14, marginBottom: 18 }}>
          <PulseCard label="Managers"       value={pulse.total_managers}  color="#7c3aed" bg="#ede9fe" icon={UserCheck} />
          <PulseCard label="Total Drivers"  value={pulse.total_drivers}   color="#2563eb" bg="#dbeafe" icon={Truck} />
          <PulseCard label="Online Drivers" value={pulse.online_drivers}  sub="available right now"  color="#059669" bg="#d1fae5" icon={Wifi} />
          <PulseCard label="On Trip"        value={pulse.on_trip_drivers} color="#0284c7" bg="#e0f2fe" icon={Activity} />
          <PulseCard label="Offline"        value={Number(pulse.total_drivers) - Number(pulse.online_drivers) - Number(pulse.on_trip_drivers)} color="#64748b" bg="#f1f5f9" icon={WifiOff} />
          <PulseCard label="Registered Users" value={pulse.total_users}  color="#ca8a04" bg="#fef9c3" icon={Users} />
        </div>

        {/* Driver availability bar */}
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(15,23,42,0.05)', padding: '18px 22px' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 16 }}>Driver Availability Breakdown</p>
          <Bar label="Online / Available" value={Number(pulse.online_drivers)} max={Number(pulse.total_drivers)} color="#059669" />
          <Bar label="Currently On Trip"  value={Number(pulse.on_trip_drivers)} max={Number(pulse.total_drivers)} color="#2563eb" />
          <Bar label="Offline / Off Duty" value={Number(pulse.total_drivers) - Number(pulse.online_drivers) - Number(pulse.on_trip_drivers)} max={Number(pulse.total_drivers)} color="#94a3b8" />
        </div>
      </div>

      {/* ── SECTION 3: Fleet ── */}
      <div style={{ marginBottom: 28 }}>
        <SectionTitle icon={Car} title="Fleet Health" sub="Vehicle status across all managers" color="#059669" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14, marginBottom: 18 }}>
          <PulseCard label="Total Vehicles"     value={pulse.total_vehicles}       color="#2563eb" bg="#dbeafe" icon={Car} />
          <PulseCard label="Available"          value={pulse.available_vehicles}   color="#059669" bg="#d1fae5" icon={Car} />
          <PulseCard label="In Use"             value={pulse.in_use_vehicles}      color="#7c3aed" bg="#ede9fe" icon={Truck} />
          <PulseCard label="Maintenance"        value={pulse.maintenance_vehicles} color="#d97706" bg="#fef3c7" icon={Wrench} />
          <PulseCard label="Open Requests"      value={pulse.pending_maintenance}  sub="awaiting admin action" color="#e11d48" bg="#ffe4e6" icon={AlertIcon} />
        </div>
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(15,23,42,0.05)', padding: '18px 22px' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 16 }}>Fleet Status Breakdown</p>
          <Bar label="Available"  value={Number(pulse.available_vehicles)}   max={Number(pulse.total_vehicles)} color="#059669" />
          <Bar label="In Use"     value={Number(pulse.in_use_vehicles)}      max={Number(pulse.total_vehicles)} color="#2563eb" />
          <Bar label="Maintenance" value={Number(pulse.maintenance_vehicles)} max={Number(pulse.total_vehicles)} color="#d97706" />
        </div>
      </div>

      {/* ── SECTION 4: Per-Manager Summary ── */}
      {managers.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <SectionTitle icon={UserCheck} title="Manager Teams" sub="Performance snapshot per manager" color="#ca8a04" />
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(15,23,42,0.05)', overflowX: 'auto' }}>
            {/* Header row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(140px, 1fr) repeat(5, minmax(56px, 80px))', gap: 12, padding: '12px 20px', borderBottom: '1px solid #f8fafc', minWidth: 440 }}>
              {['Manager', 'Team', 'Online', 'Trips', 'Done', 'Vehicles'].map(h => (
                <p key={h} style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: h === 'Manager' ? 'left' : 'center' }}>{h}</p>
              ))}
            </div>
            {managers.map((m, i) => (
              <div key={m.manager_id} style={{ display: 'grid', gridTemplateColumns: 'minmax(140px, 1fr) repeat(5, minmax(56px, 80px))', gap: 12, padding: '14px 20px', borderBottom: i < managers.length - 1 ? '1px solid #f8fafc' : 'none', alignItems: 'center', transition: 'background 0.12s', minWidth: 440 }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#fafafa'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#7c3aed', flexShrink: 0 }}>
                    {(m.manager_name ?? '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.manager_name}</p>
                </div>
                {[m.team_size, m.online_count, m.total_trips, m.completed_trips, m.vehicle_count].map((v, idx) => (
                  <p key={idx} style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', textAlign: 'center', lineHeight: 1 }}>{v ?? 0}</p>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completion rate highlight */}
      <div style={{ marginTop: 20, background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', borderRadius: 16, padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Overall Trip Completion Rate</p>
          <p style={{ fontSize: 56, fontWeight: 900, color: 'white', lineHeight: 1, letterSpacing: '-2px' }}>{completionRate}<span style={{ fontSize: 28, color: 'rgba(255,255,255,0.6)' }}>%</span></p>
          <p style={{ fontSize: 14, color: 'rgba(191,219,254,0.85)', marginTop: 6 }}>{pulse.completed_ever} completed of {pulse.total_trips_ever} total trips</p>
        </div>
        <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <CheckCircle style={{ width: 44, height: 44, color: 'rgba(255,255,255,0.8)' }} />
        </div>
      </div>
    </div>
  )
}

// Inline icon since AlertTriangle needs an import alias
function AlertIcon(props: any) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}
