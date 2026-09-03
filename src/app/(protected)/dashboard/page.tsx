'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ClipboardList, CheckCircle, Clock, XCircle, Plus, ArrowRight, MapPin, Calendar, Truck } from 'lucide-react'
import { formatDateTime, formatStatus } from '@/lib/utils'
import Link from 'next/link'
import type { Trip, Profile } from '@/types/database'

function getStatusVariant(status: string): 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' {
  const map: Record<string, any> = {
    pending: 'warning', approved: 'info', assigned: 'purple',
    in_progress: 'info', completed: 'success', cancelled: 'default', rejected: 'danger',
  }
  return map[status] ?? 'default'
}

export default function UserDashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }

      const [{ data: profileData }, { data: tripData }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('trips').select('*').eq('requester_id', user.id).order('created_at', { ascending: false }).limit(20),
      ])

      if (profileData?.role === 'admin' || profileData?.role === 'manager') { window.location.href = '/admin'; return }
      if (profileData?.role === 'driver') { window.location.href = '/driver'; return }

      setProfile(profileData)
      setTrips(tripData ?? [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div>
        <div style={{ height: 36, width: 224, background: '#f1f5f9', borderRadius: 12, marginBottom: 8 }} />
        <div style={{ height: 20, width: 288, background: '#f1f5f9', borderRadius: 8, marginBottom: 32 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
          {[...Array(4)].map((_, i) => <div key={i} style={{ height: 112, background: '#f1f5f9', borderRadius: 16 }} />)}
        </div>
        <div style={{ height: 256, background: '#f1f5f9', borderRadius: 16 }} />
      </div>
    )
  }

  const total     = trips.length
  const completed = trips.filter(t => t.status === 'completed').length
  const pending   = trips.filter(t => ['pending','approved','assigned','in_progress'].includes(t.status)).length
  const cancelled = trips.filter(t => t.status === 'cancelled').length
  const recent    = trips.slice(0, 6)
  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'
  const activeTrip = trips.find(t => t.status === 'in_progress')

  return (
    <div>
      <PageHeader
        title={`Hello, ${firstName} 👋`}
        subtitle="Manage your trips and transportation requests"
        actions={
          <Link href="/dashboard/book">
            <button style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 40, padding: '0 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              <Plus style={{ width: 16, height: 16 }} /> Book a Trip
            </button>
          </Link>
        }
      />

      {/* Active trip banner */}
      {activeTrip && (
        <div style={{ marginBottom: 24, borderRadius: 16, padding: '20px 24px', color: 'white', display: 'flex', alignItems: 'center', gap: 16, background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>
          <div style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.2)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Truck style={{ width: 20, height: 20 }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 700, fontSize: 14 }}>You have an active trip!</p>
            <p style={{ color: 'rgba(191,219,254,0.9)', fontSize: 12, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeTrip.pickup_address} → {activeTrip.destination_address}</p>
          </div>
          <Link href="/dashboard/trips" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.8)', textDecoration: 'none', flexShrink: 0 }}>
            Track <ArrowRight style={{ width: 14, height: 14 }} />
          </Link>
        </div>
      )}

      {/* Stats — auto-fill responsive grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Trips', value: total,     icon: ClipboardList, color: '#2563eb', bg: '#dbeafe' },
          { label: 'Completed',   value: completed,  icon: CheckCircle,  color: '#059669', bg: '#d1fae5' },
          { label: 'In Progress', value: pending,    icon: Clock,        color: '#d97706', bg: '#fef3c7' },
          { label: 'Cancelled',   value: cancelled,  icon: XCircle,      color: '#e11d48', bg: '#ffe4e6' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(15,23,42,0.06)', padding: 20, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</p>
              <p style={{ marginTop: 8, fontSize: 32, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{s.value}</p>
            </div>
            <div style={{ padding: 10, borderRadius: 12, flexShrink: 0, background: s.bg }}>
              <s.icon style={{ width: 20, height: 20, color: s.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16, marginBottom: 24 }}>
        <Link href="/dashboard/book?type=immediate" style={{ textDecoration: 'none' }}>
          <div style={{ borderRadius: 16, padding: 24, cursor: 'pointer', overflow: 'hidden', position: 'relative', background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', boxShadow: '0 4px 20px rgba(37,99,235,0.3)' }}>
            <div style={{ position: 'absolute', top: -32, right: -32, width: 128, height: 128, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
              <div>
                <div style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.25)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <MapPin style={{ width: 20, height: 20, color: 'white' }} />
                </div>
                <h3 style={{ fontWeight: 800, fontSize: 18, color: 'white', lineHeight: 1.2 }}>Book Now</h3>
                <p style={{ color: 'rgba(191,219,254,0.9)', fontSize: 14, marginTop: 4 }}>Request immediate transport</p>
              </div>
              <ArrowRight style={{ width: 20, height: 20, color: 'rgba(255,255,255,0.7)' }} />
            </div>
          </div>
        </Link>

        <Link href="/dashboard/book?type=scheduled" style={{ textDecoration: 'none' }}>
          <div style={{ borderRadius: 16, padding: 24, cursor: 'pointer', overflow: 'hidden', position: 'relative', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', boxShadow: '0 4px 20px rgba(124,58,237,0.3)' }}>
            <div style={{ position: 'absolute', top: -32, right: -32, width: 128, height: 128, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
              <div>
                <div style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.25)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <Calendar style={{ width: 20, height: 20, color: 'white' }} />
                </div>
                <h3 style={{ fontWeight: 800, fontSize: 18, color: 'white', lineHeight: 1.2 }}>Schedule a Trip</h3>
                <p style={{ color: 'rgba(221,214,254,0.9)', fontSize: 14, marginTop: 4 }}>Plan ahead for any date</p>
              </div>
              <ArrowRight style={{ width: 20, height: 20, color: 'rgba(255,255,255,0.7)' }} />
            </div>
          </div>
        </Link>
      </div>

      {/* Recent trips */}
      <Card>
        <CardHeader>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <CardTitle>Recent Trips</CardTitle>
              <CardDescription>Your latest trip activity</CardDescription>
            </div>
            <Link href="/dashboard/trips" style={{ fontSize: 14, color: '#2563eb', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
              All trips <ArrowRight style={{ width: 14, height: 14 }} />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {recent.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '56px 0' }}>
              <div style={{ width: 56, height: 56, background: '#f1f5f9', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <ClipboardList style={{ width: 28, height: 28, color: '#cbd5e1' }} />
              </div>
              <p style={{ color: '#94a3b8', fontWeight: 600, fontSize: 14 }}>No trips yet</p>
              <p style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>Book your first trip to get started</p>
              <Link href="/dashboard/book">
                <button style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 8, height: 36, padding: '0 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  <Plus style={{ width: 16, height: 16 }} /> Book a Trip
                </button>
              </Link>
            </div>
          ) : (
            <div>
              {recent.map(trip => (
                <Link key={trip.id} href="/dashboard/trips" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 24px', textDecoration: 'none', borderBottom: '1px solid #f8fafc', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#f8fafc'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <div style={{ width: 36, height: 36, background: '#f1f5f9', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <MapPin style={{ width: 16, height: 16, color: '#64748b' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
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
