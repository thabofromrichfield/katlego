'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { ClipboardList, MapPin, Navigation, CheckCircle } from 'lucide-react'
import { SearchInput } from '@/components/ui/search-input'
import { formatDateTime, formatRelativeTime, formatStatus } from '@/lib/utils'
import toast from 'react-hot-toast'

function getStatusVariant(s: string): 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' {
  const m: Record<string, any> = { assigned: 'purple', approved: 'info', in_progress: 'info', completed: 'success', cancelled: 'default' }
  return m[s] ?? 'default'
}

export default function DriverTripsPage() {
  const [driverId, setDriverId] = useState<string | null>(null)
  const [trips, setTrips] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<any>(null)
  const [updating, setUpdating] = useState(false)

  const load = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }

    const { data: drv } = await supabase.from('drivers').select('id').eq('profile_id', user.id).single()
    if (!drv) { setLoading(false); return }

    setDriverId(drv.id)
    const { data } = await supabase.from('trips').select('*, profiles!requester_id(full_name, phone)').eq('driver_id', drv.id).order('created_at', { ascending: false })
    setTrips(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    const supabase = createClient()
    const ch = supabase.channel('driver-trips').on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, load).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  const updateTripStatus = async (tripId: string, status: string) => {
    setUpdating(true)
    const supabase = createClient()
    const { error } = await supabase.from('trips').update({ status }).eq('id', tripId)
    if (error) { toast.error(error.message) } else {
      toast.success(`Trip ${formatStatus(status)}`)
      setSelected(null)
      load()
    }
    setUpdating(false)
  }

  const filtered = trips.filter((t) =>
    [t.booking_reference, t.pickup_address, t.destination_address].join(' ').toLowerCase().includes(search.toLowerCase())
  )

  const activeTrip = trips.find((t) => t.status === 'in_progress')

  return (
    <div className="animate-fadeIn">
      <PageHeader title="My Trips" subtitle={`${trips.length} assigned trip${trips.length !== 1 ? 's' : ''}`} />

      {activeTrip && (
        <div className="mb-6 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-2xl p-5 text-white flex items-center gap-4">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0"><Navigation className="h-5 w-5" /></div>
          <div className="flex-1">
            <p className="font-bold text-sm">Active trip in progress</p>
            <p className="text-emerald-100 text-xs mt-0.5 truncate">{activeTrip.pickup_address} → {activeTrip.destination_address}</p>
          </div>
          <button onClick={() => setSelected(activeTrip)} className="flex items-center gap-1 text-sm font-bold text-white/80 hover:text-white shrink-0">
            Complete →
          </button>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <CardTitle>Trip Assignments</CardTitle>
              <CardDescription>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</CardDescription>
            </div>
            <SearchInput value={search} onChange={setSearch} placeholder="Search trips…" className="w-full sm:w-48" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 skeleton" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><ClipboardList className="h-7 w-7 text-slate-300" /></div>
              <p className="text-slate-400 font-semibold text-sm">No trips assigned yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {filtered.map((trip) => (
                <button key={trip.id} onClick={() => setSelected(trip)}
                  className="w-full flex items-center gap-4 px-6 py-4 hover:bg-slate-50/60 transition-colors text-left"
                >
                  <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                    <MapPin className="h-4 w-4 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[11px] font-mono text-slate-400">#{trip.booking_reference}</span>
                      <Badge variant={getStatusVariant(trip.status)}>{formatStatus(trip.status)}</Badge>
                    </div>
                    <p className="text-sm font-semibold text-slate-800 truncate">{trip.pickup_address}</p>
                    <p className="text-xs text-slate-500 truncate">→ {trip.destination_address}</p>
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0">{formatRelativeTime(trip.created_at)}</span>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Trip Details">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono text-slate-400">#{selected.booking_reference}</span>
              <Badge variant={getStatusVariant(selected.status)}>{formatStatus(selected.status)}</Badge>
            </div>

            {/* Requester */}
            <div className="p-3 bg-slate-50 rounded-xl">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Passenger</p>
              <p className="font-semibold text-slate-800">{selected.profiles?.full_name ?? 'Unknown'}</p>
              {selected.profiles?.phone && <p className="text-sm text-slate-500 mt-0.5">{selected.profiles.phone}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shrink-0 mt-0.5"><span className="text-white text-[9px] font-bold">A</span></div>
                <div><p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Pickup</p><p className="text-sm text-slate-800 font-medium mt-0.5">{selected.pickup_address}</p></div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-xl">
                <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shrink-0 mt-0.5"><span className="text-white text-[9px] font-bold">B</span></div>
                <div><p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Destination</p><p className="text-sm text-slate-800 font-medium mt-0.5">{selected.destination_address}</p></div>
              </div>
            </div>

            {selected.notes && (
              <div className="p-3 bg-amber-50 rounded-xl">
                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">Passenger Notes</p>
                <p className="text-sm text-slate-700">{selected.notes}</p>
              </div>
            )}

            <div className="text-xs text-slate-400">{formatDateTime(selected.created_at)}</div>

            {/* Actions */}
            <div className="pt-2 border-t border-slate-100 flex gap-2">
              {selected.status === 'assigned' && (
                <Button variant="primary" icon={Navigation} onClick={() => updateTripStatus(selected.id, 'in_progress')} loading={updating} fullWidth>
                  Start Trip
                </Button>
              )}
              {selected.status === 'in_progress' && (
                <Button variant="success" icon={CheckCircle} onClick={() => updateTripStatus(selected.id, 'completed')} loading={updating} fullWidth>
                  Complete Trip
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
