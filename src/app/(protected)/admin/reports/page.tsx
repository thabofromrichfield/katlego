'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/layout/page-header'
import { ChartCard } from '@/components/charts/chart-card'
import { TripTrendChart } from '@/components/charts/trip-trend-chart'
import { FleetDonut } from '@/components/charts/fleet-donut'
import { AvailabilitySplit } from '@/components/charts/availability-split'
import {
  Users, Car, Truck, CheckCircle, Clock, TrendingUp, Wifi, WifiOff, Wrench,
  UserCheck, Activity, AlertTriangle, BarChart3,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/* ─── Small stat block (reports keep text primary; charts secondary) ─── */
function PulseStat({ label, value, sub, color, icon: Icon, tone = '#0f172a' }: {
  label: string; value: number | string; sub?: string; color: string
  icon: LucideIcon; tone?: string
}) {
  return (
    <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 6px rgba(15,23,42,0.06)', padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: 0 }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
        <p style={{ fontSize: 26, fontWeight: 900, color: tone, lineHeight: 1.1, marginTop: 5, fontVariantNumeric: 'tabular-nums' }}>{value}</p>
        {sub && <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 3, fontWeight: 500 }}>{sub}</p>}
      </div>
      <div style={{ padding: 8, borderRadius: 10, flexShrink: 0, marginLeft: 8, background: `${color}1a` }}>
        <Icon style={{ width: 18, height: 18, color }} />
      </div>
    </div>
  )
}

export default function ReportsPage() {
  interface ManagerRow {
    manager_id: string
    manager_name: string | null
    team_size?: number | null
    online_count?: number | null
    total_trips?: number | null
    completed_trips?: number | null
    vehicle_count?: number | null
  }

  interface PulseRow {
    trips_today: number
    trips_this_week: number
    total_trips_ever: number
    completed_ever: number
    completion_rate: number
    active_now: number
    pending_now: number
    pending_maintenance: number
    total_drivers: number
    online_drivers: number
    on_trip_drivers: number
    total_vehicles: number
    available_vehicles: number
    in_use_vehicles: number
    maintenance_vehicles: number
    total_managers: number
    total_users: number
  }

  const [pulse, setPulse] = useState<PulseRow | null>(null)
  const [managers, setManagers] = useState<ManagerRow[]>([])
  const [history, setHistory] = useState<{ date: Date; count: number; completed: number }[]>([])
  const [historyTrend, setHistoryTrend] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const [{ data: p }, { data: m }] = await Promise.all([
        supabase.rpc('get_system_pulse'),
        supabase.rpc('get_manager_summary'),
      ])
      setPulse((p?.[0] ?? null) as PulseRow | null)
      setManagers(m ?? [])

      // Trip history series for the volume trend chart
      try {
        const res = await fetch('/api/reports/trip-history?days=30')
        if (res.ok) {
          const j = await res.json()
          const series = (j.series as { date: string; count: number; completed: number }[] ?? []).map((s) => ({ date: new Date(s.date + 'T00:00:00Z'), count: Number(s.count ?? 0), completed: Number(s.completed ?? 0) }))
          setHistory(series)
          const prev = Number(j.prevWindow ?? 0)
          const curr = Number(j.currWindow ?? 0)
          setHistoryTrend(prev > 0 ? Math.round(((curr - prev) / prev) * 1000) / 10 : null)
        }
      } catch {
        /* chart shows empty state */
      }

      setLoading(false)
    }
    load()
  }, [])

  const driverData = useMemo(() => {
    const total = Number(pulse?.total_drivers ?? 0)
    const online = Number(pulse?.online_drivers ?? 0)
    const onTrip = Number(pulse?.on_trip_drivers ?? 0)
    const offline = Math.max(0, total - online - onTrip)
    return [
      { label: 'Online', value: online, color: 'var(--chart-3)' },
      { label: 'On Trip', value: onTrip, color: 'var(--chart-1)' },
      { label: 'Offline', value: offline, color: 'var(--chart-7)' },
    ].filter((d) => d.value > 0)
  }, [pulse])

  const fleetData = useMemo(() => {
    const total = Number(pulse?.total_vehicles ?? 0)
    const available = Number(pulse?.available_vehicles ?? 0)
    const inUse = Number(pulse?.in_use_vehicles ?? 0)
    const maintenance = Number(pulse?.maintenance_vehicles ?? 0)
    const offline = Math.max(0, total - available - inUse - maintenance)
    return [
      { label: 'Available', value: available, color: 'var(--chart-3)' },
      { label: 'In Use', value: inUse, color: 'var(--chart-1)' },
      { label: 'Maintenance', value: maintenance, color: 'var(--chart-2)' },
      { label: 'Offline', value: offline, color: 'var(--chart-7)' },
    ].filter((d) => d.value > 0)
  }, [pulse])



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

  const completionRate = Number(pulse.completion_rate ?? 0)
  const onlinePct = Number(pulse.total_drivers) > 0 ? Math.round((Number(pulse.online_drivers) / Number(pulse.total_drivers)) * 100) : 0
  const availPct = Number(pulse.total_vehicles) > 0 ? Math.round((Number(pulse.available_vehicles) / Number(pulse.total_vehicles)) * 100) : 0

  return (
    <div>
      <PageHeader title="Reports & Analytics" subtitle="Complete system health — all managers, drivers and fleet" />

      {/* ── Headline stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
        <PulseStat label="Trips Today" value={pulse.trips_today} sub="bookings so far today" color="#2563eb" icon={TrendingUp} />
        <PulseStat label="Trips This Week" value={pulse.trips_this_week} sub="rolling 7-day window" color="#7c3aed" icon={BarChart3} />
        <PulseStat label="Total Trips" value={pulse.total_trips_ever} sub="all time" color="#475569" icon={BarChart3} />
        <PulseStat label="Completed" value={pulse.completed_ever} sub={`${completionRate}% rate`} color="#059669" icon={CheckCircle} />
        <PulseStat label="Active Now" value={pulse.active_now} sub="in progress right now" color="#0284c7" icon={Activity} />
        <PulseStat label="Awaiting Approval" value={pulse.pending_now} sub="need action" color="#d97706" icon={Clock} />
      </div>

      {/* ── Trip volume trend (area chart) ── */}
      <div style={{ marginBottom: 24 }}>
        <ChartCard
          title="Trip Volume — last 30 days"
          subtitle="Booked vs completed per day"
          action={historyTrend != null ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: historyTrend >= 0 ? '#059669' : '#e11d48', background: historyTrend >= 0 ? '#d1fae5' : '#ffe4e6', padding: '3px 9px', borderRadius: 999 }}>
              <TrendingUp style={{ width: 13, height: 13 }} />
              {historyTrend >= 0 ? '+' : ''}{historyTrend}% vs prev 30d
            </span>
          ) : undefined}
        >
          {history.length > 0 ? (
            <TripTrendChart data={history} />
          ) : (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8' }}>
              <p>No trip history yet — bookings will appear here.</p>
            </div>
          )}
        </ChartCard>
      </div>

      {/* ── People + Fleet composition ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20, marginBottom: 24 }}>
        <ChartCard title="People" subtitle={`${pulse.total_managers} managers · ${pulse.total_drivers} drivers · ${pulse.total_users} users`}>
          <div style={{ marginBottom: 12 }}>
            <PulseStat label="Online Drivers" value={pulse.online_drivers} sub={`${onlinePct}% of drivers available now`} color="#059669" icon={Wifi} />
          </div>
          <div style={{ marginBottom: 10 }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: '#374151', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Driver availability</p>
            {driverData.length > 0 ? <AvailabilitySplit data={driverData} /> : <p style={{ fontSize: 13, color: '#94a3b8' }}>No drivers yet</p>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginTop: 6 }}>
            <PulseStat label="Managers" value={pulse.total_managers} color="#7c3aed" icon={UserCheck} />
            <PulseStat label="Users" value={pulse.total_users} color="#ca8a04" icon={Users} />
            <PulseStat label="On Trip" value={pulse.on_trip_drivers} color="#2563eb" icon={Truck} />
            <PulseStat label="Offline" value={Math.max(0, Number(pulse.total_drivers) - Number(pulse.online_drivers) - Number(pulse.on_trip_drivers))} color="#64748b" icon={WifiOff} />
          </div>
        </ChartCard>

        <ChartCard title="Fleet Health" subtitle={`${pulse.total_vehicles} vehicles in the fleet`}>
          {fleetData.length > 0 ? (
            <FleetDonut data={fleetData} centerLabel="Fleet" />
          ) : (
            <p style={{ fontSize: 13, color: '#94a3b8', padding: '24px 0' }}>No vehicles yet</p>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10, marginTop: 14 }}>
            <PulseStat label="Available" value={pulse.available_vehicles} sub={`${availPct}%`} color="#059669" icon={Car} />
            <PulseStat label="In Use" value={pulse.in_use_vehicles} color="#2563eb" icon={Truck} />
            <PulseStat label="Maintenance" value={pulse.maintenance_vehicles} color="#d97706" icon={Wrench} />
            <PulseStat label="Open Requests" value={pulse.pending_maintenance} color="#e11d48" icon={AlertTriangle} />
          </div>
        </ChartCard>
      </div>

      {/* ── Per-Manager summary table ── */}
      {managers.length > 0 && (
        <div style={{ marginBottom: 20, background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(15,23,42,0.05)', overflow: 'hidden' }}>
          <div style={{ padding: '18px 22px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <UserCheck style={{ width: 18, height: 18, color: '#ca8a04' }} />
            <div>
              <p style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>Manager Teams</p>
              <p style={{ fontSize: 12, color: '#94a3b8' }}>Performance snapshot per manager</p>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: 620 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(150px, 1.4fr) repeat(5, minmax(70px, 1fr))', gap: 10, padding: '10px 22px', borderBottom: '1px solid #f8fafc', background: '#fafafa' }}>
                {['Manager', 'Team', 'Online', 'Trips', 'Done', 'Vehicles'].map((h) => (
                  <p key={h} style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: h === 'Manager' ? 'left' : 'center' }}>{h}</p>
                ))}
              </div>
              {managers.map((m) => (
                <div key={m.manager_id} style={{ display: 'grid', gridTemplateColumns: 'minmax(150px, 1.4fr) repeat(5, minmax(70px, 1fr))', gap: 10, padding: '12px 22px', borderBottom: '1px solid #fafafa', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#7c3aed', flexShrink: 0 }}>
                      {(m.manager_name ?? '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.manager_name}</p>
                  </div>
                  {[m.team_size, m.online_count, m.total_trips, m.completed_trips, m.vehicle_count].map((v, i) => (
                    <p key={i} style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{v ?? 0}</p>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Completion rate highlight ── */}
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
