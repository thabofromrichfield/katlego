'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Clock, Truck, MapPin, ArrowRight, Navigation, Star } from 'lucide-react'
import { formatDateTime, formatStatus } from '@/lib/utils'
import Link from 'next/link'
import toast from 'react-hot-toast'

function getStatusVariant(status: string): 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' {
  const map: Record<string, any> = {
    pending: 'warning', approved: 'info', assigned: 'purple', in_progress: 'info', completed: 'success', cancelled: 'default',
  }
  return map[status] ?? 'default'
}

export default function DriverDashboardPage() {
  const [profile, setProfile] = useState<any>(null)
  const [driver, setDriver] = useState<any>(null)
  const [trips, setTrips] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }

      const [{ data: prof }, { data: drv }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('drivers').select('*, vehicles(make, model, plate_number)').eq('profile_id', user.id).single(),
      ])

      setProfile(prof)
      setDriver(drv)

      if (drv?.id) {
        const { data: tripData } = await supabase.from('trips').select('*').eq('driver_id', drv.id).order('created_at', { ascending: false }).limit(20)
        setTrips(tripData ?? [])
      }
      setLoading(false)
    }
    load()

    const supabase = createClient()
    const ch = supabase.channel('driver-dashboard').on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, load).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  const toggleAvailability = async () => {
    if (!driver) return
    setToggling(true)
    const supabase = createClient()
    const newStatus = driver.status === 'available' ? 'off_duty' : 'available'
    const { error } = await supabase
      .from('drivers')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', driver.id)
    if (error) {
      toast.error('Failed to update status')
    } else {
      setDriver({ ...driver, status: newStatus })
      toast.success(newStatus === 'available' ? '✅ You are now Online' : '🔴 You are now Offline')
      // Notify manager — find manager(s) for this driver and send notification
      try {
        const { data: assignments } = await supabase
          .from('manager_drivers')
          .select('manager_id')
          .eq('driver_id', driver.id)
        if (assignments && assignments.length > 0) {
          const notifications = assignments.map((a: any) => ({
            user_id: a.manager_id,
            title: newStatus === 'available' ? '🟢 Driver Online' : '🔴 Driver Offline',
            message: `${profile?.full_name ?? 'A driver'} is now ${newStatus === 'available' ? 'online and available' : 'offline (off duty)'}.`,
            type: newStatus === 'available' ? 'success' : 'warning',
          }))
          await supabase.from('notifications').insert(notifications)
        }
      } catch {
        // non-critical — don't break the toggle
      }
    }
    setToggling(false)
  }

  if (loading) {
    return (
      <div>
        <div style={{ height: 40, width: 256, background: '#f1f5f9', borderRadius: 12, marginBottom: 8 }} />
        <div style={{ height: 20, width: 320, background: '#f1f5f9', borderRadius: 8, marginBottom: 32 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
          {[...Array(4)].map((_, i) => <div key={i} style={{ height: 112, background: '#f1f5f9', borderRadius: 16 }} />)}
        </div>
        <div style={{ height: 256, background: '#f1f5f9', borderRadius: 16 }} />
      </div>
    )
  }

  const totalTrips     = trips.length
  const completedTrips = trips.filter(t => t.status === 'completed').length
  const pendingTrips   = trips.filter(t => ['assigned', 'approved'].includes(t.status)).length
  const activeTrip     = trips.find(t => t.status === 'in_progress')
  const firstName      = profile?.full_name?.split(' ')[0] ?? 'Driver'
  const isAvailable    = driver?.status === 'available'

  return (
    <div>
      <PageHeader
        title={`Hey, ${firstName} 🙌`}
        subtitle="Your driver dashboard — manage trips and availability"
        actions={
          <button
            onClick={toggleAvailability}
            disabled={toggling}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '0 16px', height: 40,
              borderRadius: 12, fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer',
              background: isAvailable ? '#059669' : '#e2e8f0',
              color: isAvailable ? 'white' : '#374151',
              boxShadow: isAvailable ? '0 4px 12px rgba(5,150,105,0.3)' : 'none',
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: isAvailable ? 'white' : '#94a3b8' }} />
            {toggling ? 'Updating…' : isAvailable ? 'Available' : 'Off Duty'}
          </button>
        }
      />

      {/* Active trip alert */}
      {activeTrip && (
        <div style={{ marginBottom: 24, background: 'linear-gradient(135deg,#059669,#047857)', borderRadius: 16, padding: '20px 24px', color: 'white', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.2)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Navigation style={{ width: 20, height: 20 }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 700, fontSize: 14 }}>You&apos;re on a trip right now!</p>
            <p style={{ color: 'rgba(167,243,208,0.9)', fontSize: 12, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeTrip.pickup_address} → {activeTrip.destination_address}</p>
          </div>
          <Link href="/driver/trips" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.8)', textDecoration: 'none', flexShrink: 0 }}>
            View <ArrowRight style={{ width: 14, height: 14 }} />
          </Link>
        </div>
      )}

      {/* Stats — auto-fill responsive */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Trips', value: totalTrips,     color: '#059669', bg: '#d1fae5', icon: Truck },
          { label: 'Completed',   value: completedTrips, color: '#2563eb', bg: '#dbeafe', icon: CheckCircle },
          { label: 'Assigned',    value: pendingTrips,   color: '#d97706', bg: '#fef3c7', icon: Clock },
          { label: 'Rating',      value: driver?.rating ? `${driver.rating}/5` : 'N/A', color: '#ca8a04', bg: '#fef9c3', icon: Star },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(15,23,42,0.06)', padding: 20, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', minWidth: 0 }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.label}</p>
              <p style={{ marginTop: 8, fontSize: 32, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{s.value}</p>
            </div>
            <div style={{ padding: 10, borderRadius: 12, flexShrink: 0, marginLeft: 12, background: s.bg }}>
              <s.icon style={{ width: 20, height: 20, color: s.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* Vehicle info */}
      {driver?.vehicles && (
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(15,23,42,0.06)', padding: 20, display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{ width: 48, height: 48, background: '#d1fae5', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Truck style={{ width: 24, height: 24, color: '#059669' }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Assigned Vehicle</p>
            <p style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{driver.vehicles.make} {driver.vehicles.model}</p>
            <p style={{ fontSize: 14, color: '#64748b', fontWeight: 600 }}>{driver.vehicles.plate_number}</p>
          </div>
          <Badge variant="success" dot>Ready</Badge>
        </div>
      )}

      {/* Recent trips */}
      <Card>
        <CardHeader>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <CardTitle>Recent Trips</CardTitle>
              <CardDescription>Your latest assignments</CardDescription>
            </div>
            <Link href="/driver/trips" style={{ fontSize: 14, color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
              All trips <ArrowRight style={{ width: 14, height: 14 }} />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {trips.slice(0, 6).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '56px 0' }}>
              <div style={{ width: 56, height: 56, background: '#f1f5f9', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Truck style={{ width: 28, height: 28, color: '#cbd5e1' }} />
              </div>
              <p style={{ color: '#94a3b8', fontWeight: 600, fontSize: 14 }}>No trips assigned yet</p>
            </div>
          ) : (
            <div>
              {trips.slice(0, 6).map(trip => (
                <Link key={trip.id} href="/driver/trips" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 24px', textDecoration: 'none', borderBottom: '1px solid #f8fafc', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#f8fafc'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <div style={{ width: 36, height: 36, background: '#f1f5f9', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <MapPin style={{ width: 16, height: 16, color: '#64748b' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#94a3b8' }}>#{trip.booking_reference}</span>
                      <Badge variant={getStatusVariant(trip.status)}>{formatStatus(trip.status)}</Badge>
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{trip.pickup_address}</p>
                    <p style={{ fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>→ {trip.destination_address}</p>
                  </div>
                  <span style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>{formatDateTime(trip.created_at)}</span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
