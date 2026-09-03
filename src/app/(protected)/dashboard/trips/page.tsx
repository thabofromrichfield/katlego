'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { ClipboardList, MapPin, Calendar, Plus, XCircle } from 'lucide-react'
import { SearchInput } from '@/components/ui/search-input'
import { formatDateTime, formatRelativeTime, formatStatus } from '@/lib/utils'
import Link from 'next/link'
import toast from 'react-hot-toast'
import type { Trip } from '@/types/database'

function getStatusVariant(s: string): 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' {
  const m: Record<string, any> = { pending: 'warning', approved: 'info', assigned: 'purple', in_progress: 'info', completed: 'success', cancelled: 'default', rejected: 'danger' }
  return m[s] ?? 'default'
}

export default function UserTripsPage() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Trip | null>(null)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      const { data } = await supabase.from('trips').select('*').eq('requester_id', user.id).order('created_at', { ascending: false })
      setTrips(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const canCancel = (t: Trip) => ['pending', 'approved'].includes(t.status)

  const handleCancel = async () => {
    if (!selected) return
    setCancelling(true)
    const supabase = createClient()
    const { error } = await supabase.from('trips').update({ status: 'cancelled' }).eq('id', selected.id)
    if (error) { toast.error(error.message) } else {
      toast.success('Trip cancelled')
      setTrips((prev) => prev.map((t) => t.id === selected.id ? { ...t, status: 'cancelled' } : t))
      setSelected(null)
    }
    setCancelling(false)
  }

  const filtered = trips.filter((t) =>
    [t.booking_reference, t.pickup_address, t.destination_address].join(' ').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="My Trips"
        subtitle={`${trips.length} total trip${trips.length !== 1 ? 's' : ''}`}
        actions={
          <Link href="/dashboard/book">
            <Button icon={Plus}>Book a Trip</Button>
          </Link>
        }
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div>
              <CardTitle>Trip History</CardTitle>
              <CardDescription>{filtered.length} trip{filtered.length !== 1 ? 's' : ''} shown</CardDescription>
            </div>
            <SearchInput value={search} onChange={setSearch} placeholder="Search trips…" className="w-full sm:w-52" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 skeleton" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><ClipboardList className="h-7 w-7 text-slate-300" /></div>
              <p className="text-slate-400 font-semibold text-sm">{search ? 'No trips match your search' : 'No trips yet'}</p>
              {!search && <Link href="/dashboard/book"><Button icon={Plus} className="mt-4">Book Your First Trip</Button></Link>}
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
                  <div className="text-right shrink-0">
                    <p className="text-[11px] text-slate-400">{formatRelativeTime(trip.created_at)}</p>
                  </div>
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
              <Badge variant="default">{selected.priority}</Badge>
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

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Trip Type</p>
                <p className="font-semibold text-slate-700 capitalize">{selected.trip_type}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Passengers</p>
                <p className="font-semibold text-slate-700">{selected.passenger_count}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Booked</p>
                <p className="font-semibold text-slate-700">{formatDateTime(selected.created_at)}</p>
              </div>
              {selected.scheduled_datetime && (
                <div className="bg-amber-50 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">Scheduled For</p>
                  <p className="font-semibold text-slate-700">{formatDateTime(selected.scheduled_datetime)}</p>
                </div>
              )}
            </div>

            {selected.notes && (
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Notes</p>
                <p className="text-sm text-slate-700">{selected.notes}</p>
              </div>
            )}

            {canCancel(selected) && (
              <div className="pt-2 border-t border-slate-100">
                <Button variant="danger" icon={XCircle} onClick={handleCancel} loading={cancelling} fullWidth size="sm">
                  Cancel This Trip
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
