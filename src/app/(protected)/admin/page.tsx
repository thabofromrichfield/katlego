'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { SearchInput } from '@/components/ui/search-input'
import { Modal } from '@/components/ui/modal'
import {
  Car, Users, ClipboardList, CheckCircle, Clock,
  AlertTriangle, TrendingUp, ArrowRight, Activity,
  Wifi, WifiOff, Star, Truck, BarChart3,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { formatDateTime, formatStatus } from '@/lib/utils'
import Link from 'next/link'
import { ChartCard } from '@/components/charts/chart-card'
import { TrendBadge } from '@/components/charts/trend-badge'
import { TripTrendChart } from '@/components/charts/trip-trend-chart'
import { FleetDonut } from '@/components/charts/fleet-donut'
import { AvailabilitySplit } from '@/components/charts/availability-split'
import { MiniBarChart } from '@/components/charts/mini-bar-chart'

/* ─── Shared ─────────────────────────────────────────── */
function StatBox({ label, value, sub, color, bg, icon: Icon }: { label: string; value: number | string; sub?: string; color: string; bg: string; icon: LucideIcon }) {
  return (
    <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(15,23,42,0.06)', padding: 20, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', minWidth: 0 }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</p>
        <p style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{value}</p>
        {sub && <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{sub}</p>}
      </div>
      <div style={{ padding: 10, borderRadius: 12, flexShrink: 0, marginLeft: 12, background: bg }}>
        <Icon style={{ width: 20, height: 20, color }} />
      </div>
    </div>
  )
}

function DriverStatusPill({ status }: { status: string }) {
  const cfg: Record<string, { label: string; color: string; bg: string; dot: string }> = {
    available: { label: 'Online',   color: '#059669', bg: '#d1fae5', dot: '#059669' },
    on_trip:   { label: 'On Trip',  color: '#2563eb', bg: '#dbeafe', dot: '#2563eb' },
    off_duty:  { label: 'Offline',  color: '#64748b', bg: '#f1f5f9', dot: '#94a3b8' },
    leave:     { label: 'On Leave', color: '#d97706', bg: '#fef3c7', dot: '#d97706' },
    suspended: { label: 'Suspended',color: '#e11d48', bg: '#ffe4e6', dot: '#e11d48' },
  }
  const c = cfg[status] ?? cfg.off_duty
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 99, fontSize: 12, fontWeight: 700, color: c.color, background: c.bg }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: c.dot, boxShadow: status === 'available' ? `0 0 0 3px ${c.dot}30` : 'none' }} />
      {c.label}
    </span>
  )
}

/* ─── ADMIN DASHBOARD ────────────────────────────────── */
function AdminDashboard() {
  const [stats, setStats] = useState({ totalVehicles: 0, availableVehicles: 0, totalDrivers: 0, availableDrivers: 0, pendingTrips: 0, activeTrips: 0, completedTrips: 0, totalTrips: 0 })
  const [urgentTrips, setUrgentTrips] = useState<any[]>([])
  const [recentTrips, setRecentTrips] = useState<any[]>([])
  const [vehicleStatuses, setVehicleStatuses] = useState<{ status: string }[]>([])
  const [driverStatuses, setDriverStatuses] = useState<{ status: string }[]>([])
  const [history, setHistory] = useState<{ date: Date; count: number; completed: number }[]>([])
  const [historyTrend, setHistoryTrend] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const [
        { count: totalVehicles }, { count: availableVehicles },
        { count: totalDrivers }, { count: availableDrivers },
        { count: totalTrips }, { count: pendingTrips },
        { count: activeTrips }, { count: completedTrips },
        { data: recent }, { data: urgent },
        { data: vStatuses }, { data: dStatuses },
      ] = await Promise.all([
        supabase.from('vehicles').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('vehicles').select('*', { count: 'exact', head: true }).eq('status', 'available').eq('is_active', true),
        supabase.from('drivers').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('drivers').select('*', { count: 'exact', head: true }).eq('status', 'available').eq('is_active', true),
        supabase.from('trips').select('*', { count: 'exact', head: true }),
        supabase.from('trips').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('trips').select('*', { count: 'exact', head: true }).in('status', ['approved','assigned','in_progress']),
        supabase.from('trips').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
        supabase.from('trips').select('*, profiles!requester_id(full_name)').order('created_at', { ascending: false }).limit(6),
        supabase.from('trips').select('*, profiles!requester_id(full_name)').eq('status', 'pending').eq('priority', 'urgent').limit(5),
        supabase.from('vehicles').select('status').eq('is_active', true),
        supabase.from('drivers').select('status').eq('is_active', true),
      ])
      setStats({ totalVehicles: totalVehicles ?? 0, availableVehicles: availableVehicles ?? 0, totalDrivers: totalDrivers ?? 0, availableDrivers: availableDrivers ?? 0, pendingTrips: pendingTrips ?? 0, activeTrips: activeTrips ?? 0, completedTrips: completedTrips ?? 0, totalTrips: totalTrips ?? 0 })
      setRecentTrips(recent ?? [])
      setUrgentTrips(urgent ?? [])
      setVehicleStatuses((vStatuses ?? []) as { status: string }[])
      setDriverStatuses((dStatuses ?? []) as { status: string }[])

      // 14-day trip volume for the trend chart
      try {
        const res = await fetch('/api/reports/trip-history?days=14')
        if (res.ok) {
          const j = await res.json()
          const series = ((j.series ?? []) as { date: string; count: number; completed: number }[]).map(
            (row) => ({ date: new Date(row.date + 'T00:00:00Z'), count: Number(row.count ?? 0), completed: Number(row.completed ?? 0) }),
          )
          setHistory(series)
          const prev = Number(j.prevWindow ?? 0)
          const curr = Number(j.currWindow ?? 0)
          setHistoryTrend(prev > 0 ? Math.round(((curr - prev) / prev) * 1000) / 10 : null)
        }
      } catch {
        /* chart falls back to empty state */
      }

      setLoading(false)
    }
    load()
    const supabase = createClient()
    const ch = supabase.channel('admin-dash').on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, load).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  if (loading) return <LoadingSkeleton />

  const vUtil = stats.totalVehicles ? Math.round((stats.availableVehicles / stats.totalVehicles) * 100) : 0
  const dUtil = stats.totalDrivers  ? Math.round((stats.availableDrivers  / stats.totalDrivers)  * 100) : 0

  const countBy = (rows: { status: string }[], status: string) =>
    rows.reduce((n, r) => n + (r.status === status ? 1 : 0), 0)

  const fleetStatus = [
    { label: 'Available', value: countBy(vehicleStatuses, 'available'), color: 'var(--chart-3)' },
    { label: 'On Trip', value: countBy(vehicleStatuses, 'on_trip'), color: 'var(--chart-1)' },
    { label: 'Maintenance', value: countBy(vehicleStatuses, 'maintenance'), color: 'var(--chart-2)' },
    { label: 'Offline', value: countBy(vehicleStatuses, 'offline'), color: 'var(--chart-7)' },
  ].filter((d) => d.value > 0)

  const driverStatus = [
    { label: 'Available', value: countBy(driverStatuses, 'available'), color: 'var(--chart-3)' },
    { label: 'On Trip', value: countBy(driverStatuses, 'on_trip'), color: 'var(--chart-1)' },
    { label: 'Off Duty', value: countBy(driverStatuses, 'off_duty'), color: 'var(--chart-7)' },
    { label: 'On Leave', value: countBy(driverStatuses, 'leave'), color: 'var(--chart-2)' },
    { label: 'Suspended', value: countBy(driverStatuses, 'suspended'), color: 'var(--chart-5)' },
  ].filter((d) => d.value > 0)

  return (
    <div>
      <PageHeader title="Operations Dashboard" subtitle="System-wide overview of all logistics operations"
        actions={
          <Link href="/admin/trips">
            <button style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 40, padding: '0 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              <Activity style={{ width: 16, height: 16 }} /> Live Trips
            </button>
          </Link>
        }
      />

      {urgentTrips.length > 0 && (
        <div style={{ marginBottom: 20, background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 16, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <AlertTriangle style={{ width: 22, height: 22, color: '#e11d48', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, color: '#9f1239', fontSize: 14 }}>{urgentTrips.length} urgent trip{urgentTrips.length > 1 ? 's' : ''} awaiting approval</p>
          </div>
          <Link href="/admin/trips" style={{ fontSize: 14, fontWeight: 700, color: '#9f1239', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            Review <ArrowRight style={{ width: 14, height: 14 }} />
          </Link>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 20 }}>
        <StatBox label="Fleet Vehicles"  value={stats.totalVehicles}  sub={`${stats.availableVehicles} available`} color="#2563eb" bg="#dbeafe" icon={Car} />
        <StatBox label="Active Drivers"  value={stats.totalDrivers}   sub={`${stats.availableDrivers} online`}     color="#7c3aed" bg="#ede9fe" icon={Users} />
        <StatBox label="Pending Trips"   value={stats.pendingTrips}   sub="Awaiting approval"                       color="#d97706" bg="#fef3c7" icon={Clock} />
        <StatBox label="Active Trips"    value={stats.activeTrips}    sub="Currently in motion"                     color="#059669" bg="#d1fae5" icon={TrendingUp} />
      </div>

      {/* Operations trend — last 14 days */}
      <div style={{ marginBottom: 20 }}>
        <ChartCard
          title="Trip Volume — last 14 days"
          subtitle="Booked vs completed per day across the fleet"
          action={historyTrend != null ? <TrendBadge value={historyTrend} /> : undefined}
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

      {/* Totals + live status composition */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 20 }}>
        <StatBox label="Completed Trips" value={stats.completedTrips} color="#059669" bg="#d1fae5" icon={CheckCircle} />
        <StatBox label="Total Trips"     value={stats.totalTrips}     color="#475569" bg="#f1f5f9" icon={ClipboardList} />
        <div style={{ minWidth: 0 }}>
          <ChartCard title="Fleet Status" subtitle={`${stats.availableVehicles} of ${stats.totalVehicles} vehicles available (${vUtil}%)`}>
            {fleetStatus.length > 0 ? (
              <FleetDonut centerLabel="Vehicles" data={fleetStatus} size={200} />
            ) : (
              <p style={{ fontSize: 13, color: '#94a3b8', padding: '20px 0' }}>No vehicles yet</p>
            )}
          </ChartCard>
        </div>
        <div style={{ minWidth: 0 }}>
          <ChartCard title="Driver Availability" subtitle={`${stats.availableDrivers} of ${stats.totalDrivers} drivers online (${dUtil}%)`}>
            {driverStatus.length > 0 ? (
              <AvailabilitySplit data={driverStatus} />
            ) : (
              <p style={{ fontSize: 13, color: '#94a3b8', padding: '20px 0' }}>No drivers yet</p>
            )}
          </ChartCard>
        </div>
      </div>

      {/* Recent trips — admin only */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(15,23,42,0.06)' }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Recent Trip Requests</p>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Latest activity across the fleet</p>
          </div>
          <Link href="/admin/trips" style={{ fontSize: 14, fontWeight: 700, color: '#2563eb', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            View all <ArrowRight style={{ width: 14, height: 14 }} />
          </Link>
        </div>
        {recentTrips.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <ClipboardList style={{ width: 36, height: 36, color: '#e2e8f0', margin: '0 auto 12px' }} />
            <p style={{ color: '#94a3b8', fontSize: 14, fontWeight: 500 }}>No trips yet</p>
          </div>
        ) : recentTrips.map(trip => (
          <Link key={trip.id} href="/admin/trips" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 24px', textDecoration: 'none', borderBottom: '1px solid #f8fafc' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#f8fafc'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
          >
            <div style={{ width: 36, height: 36, background: '#f1f5f9', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Car style={{ width: 16, height: 16, color: '#64748b' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#94a3b8' }}>#{trip.booking_reference}</span>
                <Badge variant={{ pending:'warning', approved:'info', assigned:'purple', in_progress:'info', completed:'success', cancelled:'default', rejected:'danger' }[trip.status] as any ?? 'default'}>{formatStatus(trip.status)}</Badge>
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{trip.profiles?.full_name}</p>
              <p style={{ fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{trip.pickup_address} → {trip.destination_address}</p>
            </div>
            <span style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>{formatDateTime(trip.created_at)}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

/* ─── MANAGER DASHBOARD ──────────────────────────────── */
function ManagerDashboard({ managerId }: { managerId: string }) {
  const [team, setTeam] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedDriver, setSelectedDriver] = useState<any | null>(null)

  const load = async () => {
    const supabase = createClient()
    const { data, error } = await supabase.rpc('get_manager_team_stats', { p_manager_id: managerId })
    if (!error && data) setTeam(data)
    setLoading(false)
  }

  useEffect(() => {
    load()
    // Realtime: listen for driver status changes
    const supabase = createClient()
    const ch = supabase.channel('manager-team-drivers')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'drivers' }, load)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [managerId])

  if (loading) return <LoadingSkeleton />

  const online   = team.filter(d => d.driver_status === 'available').length
  const onTrip   = team.filter(d => d.driver_status === 'on_trip').length
  const offline  = team.filter(d => ['off_duty', 'leave', 'suspended'].includes(d.driver_status)).length
  const totalTrips = team.reduce((s, d) => s + (d.total_trips ?? 0), 0)
  const avgRating  = team.length ? (team.reduce((s, d) => s + (Number(d.rating) || 0), 0) / team.length).toFixed(1) : '—'

  const availCount = (statuses: string[]) =>
    team.filter((d) => statuses.includes(d.driver_status)).length
  const teamAvailability = [
    { label: 'Available', value: online, color: 'var(--chart-3)' },
    { label: 'On Trip', value: onTrip, color: 'var(--chart-1)' },
    { label: 'Off Duty', value: availCount(['off_duty']), color: 'var(--chart-7)' },
    { label: 'On Leave', value: availCount(['leave']), color: 'var(--chart-2)' },
    { label: 'Suspended', value: availCount(['suspended']), color: 'var(--chart-5)' },
  ].filter((d) => d.value > 0)

  const shortName = (full: string) => {
    const parts = (full ?? '').trim().split(/\s+/)
    if (parts.length === 0) return '?'
    return parts[0] + (parts.length > 1 ? ` ${parts[parts.length - 1][0]}.` : '')
  }
  const driverTripBars = [...team]
    .sort((a, b) => (b.total_trips ?? 0) - (a.total_trips ?? 0))
    .slice(0, 8)
    .map((d) => ({ label: shortName(d.driver_name ?? 'Driver'), value: d.total_trips ?? 0 }))

  const filtered = team.filter(d =>
    (d.driver_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (d.employee_id ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <PageHeader title="Team Dashboard" subtitle="Live status and performance of your assigned drivers" />

      {/* Team stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatBox label="Team Size"      value={team.length}  sub="assigned drivers"        color="#2563eb" bg="#dbeafe" icon={Users} />
        <StatBox label="Online Now"     value={online}       sub="available for trips"      color="#059669" bg="#d1fae5" icon={Wifi} />
        <StatBox label="On Trip"        value={onTrip}       sub="currently driving"        color="#7c3aed" bg="#ede9fe" icon={Truck} />
        <StatBox label="Offline"        value={offline}      sub="off duty / leave"         color="#64748b" bg="#f1f5f9" icon={WifiOff} />
        <StatBox label="Total Trips"    value={totalTrips}   sub="all time, team total"     color="#d97706" bg="#fef3c7" icon={BarChart3} />
        <StatBox label="Avg Rating"     value={avgRating}    sub="team average"             color="#ca8a04" bg="#fef9c3" icon={Star} />
      </div>

      {/* Team charts */}
      {team.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 20 }}>
          <ChartCard title="Team Availability" subtitle="Live status composition of your drivers">
            {teamAvailability.length > 0 ? (
              <FleetDonut centerLabel="Team" data={teamAvailability} size={200} />
            ) : (
              <p style={{ fontSize: 13, color: '#94a3b8', padding: '20px 0' }}>No drivers with status yet</p>
            )}
          </ChartCard>
          <ChartCard title="Trips by Driver" subtitle="All-time total trips — top 8 drivers">
            {driverTripBars.length > 0 ? (
              <MiniBarChart color="var(--chart-4)" data={driverTripBars} showAxis />
            ) : (
              <p style={{ fontSize: 13, color: '#94a3b8', padding: '20px 0' }}>No trip activity yet</p>
            )}
          </ChartCard>
        </div>
      )}

      {/* Driver table */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(15,23,42,0.06)' }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>My Drivers</p>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{filtered.length} of {team.length} shown</p>
          </div>
          <SearchInput value={search} onChange={setSearch} placeholder="Search drivers…" />
        </div>

        {team.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '56px 24px' }}>
            <Users style={{ width: 40, height: 40, color: '#e2e8f0', margin: '0 auto 12px' }} />
            <p style={{ color: '#94a3b8', fontSize: 14, fontWeight: 600 }}>No drivers assigned to your team yet</p>
            <p style={{ color: '#cbd5e1', fontSize: 13, marginTop: 4 }}>Ask your admin to assign drivers to your team.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p style={{ color: '#94a3b8', fontSize: 14 }}>No drivers match your search</p>
          </div>
        ) : filtered.map(driver => (
          <div key={driver.driver_id}
            onClick={() => setSelectedDriver(driver)}
            style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 24px', borderBottom: '1px solid #f8fafc', cursor: 'pointer', transition: 'background 0.15s' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#f8fafc'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
          >
            {/* Avatar */}
            <div style={{ width: 42, height: 42, borderRadius: '50%', background: driver.driver_status === 'available' ? '#d1fae5' : driver.driver_status === 'on_trip' ? '#dbeafe' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14, fontWeight: 800, color: driver.driver_status === 'available' ? '#059669' : driver.driver_status === 'on_trip' ? '#2563eb' : '#94a3b8', position: 'relative' }}>
              {(driver.driver_name ?? '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
              {/* Online dot */}
              {driver.driver_status === 'available' && (
                <span style={{ position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, borderRadius: '50%', background: '#059669', border: '2px solid white' }} />
              )}
            </div>

            {/* Name + employee ID */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{driver.driver_name}</p>
              <p style={{ fontSize: 12, color: '#94a3b8' }}>{driver.employee_id ?? 'No employee ID'} · {driver.phone ?? 'No phone'}</p>
            </div>

            {/* Status */}
            <div style={{ flexShrink: 0 }}>
              <DriverStatusPill status={driver.driver_status} />
            </div>

            {/* Trip stats */}
            <div style={{ flexShrink: 0, textAlign: 'right', minWidth: 80 }}>
              <p style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{driver.total_trips ?? 0}</p>
              <p style={{ fontSize: 11, color: '#94a3b8' }}>total trips</p>
            </div>

            {/* Vehicle */}
            <div style={{ flexShrink: 0, minWidth: 120 }}>
              {driver.vehicle_plate ? (
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{driver.vehicle_make} {driver.vehicle_model}</p>
                  <span style={{ fontSize: 11, fontFamily: 'monospace', background: '#f1f5f9', color: '#64748b', padding: '1px 6px', borderRadius: 4 }}>{driver.vehicle_plate}</span>
                </div>
              ) : (
                <p style={{ fontSize: 12, color: '#cbd5e1' }}>No vehicle</p>
              )}
            </div>

            {/* Rating */}
            <div style={{ flexShrink: 0, textAlign: 'right' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#ca8a04' }}>★ {Number(driver.rating ?? 0).toFixed(1)}</p>
              <p style={{ fontSize: 11, color: '#94a3b8' }}>{driver.completed_trips ?? 0} done</p>
            </div>
          </div>
        ))}
      </div>

      {/* Driver detail modal */}
      <Modal isOpen={!!selectedDriver} onClose={() => setSelectedDriver(null)} title="Driver Details" size="md">
        {selectedDriver && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, padding: '0 0 20px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: '#2563eb' }}>
                {(selectedDriver.driver_name ?? '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{selectedDriver.driver_name}</p>
                <DriverStatusPill status={selectedDriver.driver_status} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { l: 'Employee ID', v: selectedDriver.employee_id ?? '—' },
                { l: 'Phone', v: selectedDriver.phone ?? '—' },
                { l: 'Total Trips', v: selectedDriver.total_trips ?? 0 },
                { l: 'Completed', v: selectedDriver.completed_trips ?? 0 },
                { l: 'Active Trips', v: selectedDriver.active_trips ?? 0 },
                { l: 'Rating', v: `★ ${Number(selectedDriver.rating ?? 0).toFixed(1)} / 5` },
              ].map(({ l, v }) => (
                <div key={l} style={{ background: '#f8fafc', borderRadius: 12, padding: '12px 16px' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{l}</p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{v}</p>
                </div>
              ))}
            </div>
            {selectedDriver.vehicle_plate && (
              <div style={{ marginTop: 16, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <Car style={{ width: 18, height: 18, color: '#059669', flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#059669' }}>Assigned Vehicle</p>
                  <p style={{ fontSize: 14, color: '#0f172a', fontWeight: 600 }}>{selectedDriver.vehicle_make} {selectedDriver.vehicle_model} · <span style={{ fontFamily: 'monospace' }}>{selectedDriver.vehicle_plate}</span></p>
                  <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Vehicle status: <strong>{formatStatus(selectedDriver.vehicle_status ?? 'unknown')}</strong></p>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div>
      <div style={{ height: 36, width: 256, background: '#f1f5f9', borderRadius: 12, marginBottom: 8 }} />
      <div style={{ height: 20, width: 320, background: '#f1f5f9', borderRadius: 8, marginBottom: 28 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
        {[...Array(4)].map((_, i) => <div key={i} style={{ height: 108, background: '#f1f5f9', borderRadius: 16 }} />)}
      </div>
      <div style={{ height: 300, background: '#f1f5f9', borderRadius: 16 }} />
    </div>
  )
}

/* ─── ROOT PAGE ──────────────────────────────────────── */
export default function AdminPage() {
  const [role, setRole]       = useState<string | null>(null)
  const [userId, setUserId]   = useState<string | null>(null)
  const [ready, setReady]     = useState(false)

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      const { data: prof } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      setRole(prof?.role ?? 'manager')
      setUserId(user.id)
      setReady(true)
    }
    init()
  }, [])

  if (!ready) return <LoadingSkeleton />
  if (role === 'admin') return <AdminDashboard />
  return <ManagerDashboard managerId={userId!} />
}
