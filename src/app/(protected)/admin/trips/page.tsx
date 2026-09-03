'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Select } from '@/components/ui/select'
import { ClipboardList, MapPin, Clock, CheckCircle, ChevronDown, User2 } from 'lucide-react'
import { SearchInput } from '@/components/ui/search-input'
import { formatDateTime, formatStatus } from '@/lib/utils'
import toast from 'react-hot-toast'

function getStatusVariant(s: string): 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' {
  const m: Record<string, any> = { pending: 'warning', approved: 'info', assigned: 'purple', in_progress: 'info', completed: 'success', cancelled: 'default', rejected: 'danger' }
  return m[s] ?? 'default'
}
function getPriorityVariant(p: string): 'danger' | 'warning' | 'info' | 'default' {
  if (p === 'urgent') return 'danger'
  if (p === 'high') return 'warning'
  if (p === 'normal') return 'info'
  return 'default'
}

const STATUS_FILTER_OPTS = [
  { value: '', label: 'All statuses' }, { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' }, { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In Progress' }, { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }, { value: 'rejected', label: 'Rejected' },
]

const NEXT_STATUS: Record<string, { value: string; label: string; variant: any }[]> = {
  pending:  [{ value: 'approved', label: 'Approve', variant: 'success' }, { value: 'rejected', label: 'Reject', variant: 'danger' }],
  approved: [{ value: 'assigned', label: 'Mark Assigned', variant: 'primary' }, { value: 'cancelled', label: 'Cancel', variant: 'danger' }],
  assigned: [{ value: 'in_progress', label: 'Start Trip', variant: 'primary' }, { value: 'cancelled', label: 'Cancel', variant: 'danger' }],
  in_progress: [{ value: 'completed', label: 'Complete Trip', variant: 'success' }],
}

export default function AdminTripsPage() {
  const [trips, setTrips] = useState<any[]>([])
  const [drivers, setDrivers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState<any>(null)
  const [assignDriverId, setAssignDriverId] = useState('')
  const [updating, setUpdating] = useState(false)

  const load = async () => {
    const supabase = createClient()
    const [{ data: tripData }, { data: driverData }] = await Promise.all([
      supabase.from('trips').select('*, profiles!requester_id(full_name, phone)').order('created_at', { ascending: false }),
      supabase.from('drivers').select('*, profiles(full_name)').eq('status', 'available').eq('is_active', true),
    ])
    setTrips(tripData ?? [])
    setDrivers(driverData ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    const supabase = createClient()
    const ch = supabase.channel('admin-trips').on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, load).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  const filtered = trips.filter((t) => {
    const matchSearch = [t.booking_reference, t.pickup_address, t.destination_address, t.profiles?.full_name].join(' ').toLowerCase().includes(search.toLowerCase())
    const matchStatus = !statusFilter || t.status === statusFilter
    return matchSearch && matchStatus
  })

  const updateStatus = async (tripId: string, status: string, driverId?: string) => {
    setUpdating(true)
    const supabase = createClient()
    const updates: any = { status }
    if (driverId) updates.driver_id = driverId
    const { error } = await supabase.from('trips').update(updates).eq('id', tripId)
    if (error) { toast.error(error.message) } else { toast.success(`Trip ${formatStatus(status)}`); setSelected(null); load() }
    setUpdating(false)
  }

  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="Trip Management"
        subtitle={`${trips.length} total trips · ${trips.filter(t => t.status === 'pending').length} pending approval`}
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div>
              <CardTitle>All Trips</CardTitle>
              <CardDescription>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap w-full sm:w-auto">
              <SearchInput value={search} onChange={setSearch} placeholder="Search trips…" className="w-full sm:w-44" />
              <Select options={STATUS_FILTER_OPTS} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9 text-sm" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-20 skeleton" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><ClipboardList className="h-7 w-7 text-slate-300" /></div>
              <p className="text-slate-400 font-semibold text-sm">No trips found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {filtered.map((trip) => (
                <button key={trip.id} onClick={() => { setSelected(trip); setAssignDriverId('') }}
                  className="w-full flex items-center gap-4 px-6 py-4 hover:bg-slate-50/60 transition-colors text-left"
                >
                  <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                    <MapPin className="h-4 w-4 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[11px] font-mono text-slate-400">#{trip.booking_reference}</span>
                      <Badge variant={getStatusVariant(trip.status)}>{formatStatus(trip.status)}</Badge>
                      <Badge variant={getPriorityVariant(trip.priority)}>{trip.priority}</Badge>
                    </div>
                    <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                      <User2 className="h-3.5 w-3.5 text-slate-400" />{trip.profiles?.full_name ?? 'Unknown'}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{trip.pickup_address} → {trip.destination_address}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[11px] text-slate-400">{formatDateTime(trip.created_at)}</p>
                    <ChevronDown className="h-3.5 w-3.5 text-slate-300 mt-1 mx-auto rotate-[-90deg]" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail / action modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Trip Details" size="lg">
        {selected && (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-xs font-mono text-slate-400">#{selected.booking_reference}</span>
                  <Badge variant={getStatusVariant(selected.status)}>{formatStatus(selected.status)}</Badge>
                  <Badge variant={getPriorityVariant(selected.priority)}>{selected.priority}</Badge>
                </div>
                <p className="text-sm font-bold text-slate-900">{selected.profiles?.full_name}</p>
                {selected.profiles?.phone && <p className="text-xs text-slate-500">{selected.profiles.phone}</p>}
              </div>
              <div className="text-xs text-slate-400 text-right">{formatDateTime(selected.created_at)}</div>
            </div>

            {/* Addresses */}
            <div className="space-y-2">
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-white text-[9px] font-bold">A</span>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Pickup</p>
                  <p className="text-sm text-slate-800 font-medium mt-0.5">{selected.pickup_address}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-xl">
                <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-white text-[9px] font-bold">B</span>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Destination</p>
                  <p className="text-sm text-slate-800 font-medium mt-0.5">{selected.destination_address}</p>
                </div>
              </div>
            </div>

            {selected.notes && (
              <div className="p-3 bg-amber-50 rounded-xl">
                <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1">Notes</p>
                <p className="text-sm text-slate-700">{selected.notes}</p>
              </div>
            )}

            {/* Assign driver */}
            {['pending', 'approved'].includes(selected.status) && drivers.length > 0 && (
              <Select
                label="Assign Driver (optional)"
                options={[{ value: '', label: 'No driver assigned' }, ...drivers.map((d: any) => ({ value: d.id, label: d.profiles?.full_name ?? 'Driver' }))]}
                value={assignDriverId}
                onChange={(e) => setAssignDriverId(e.target.value)}
              />
            )}

            {/* Actions */}
            {NEXT_STATUS[selected.status] && (
              <div className="flex gap-2 flex-wrap pt-2 border-t border-slate-100">
                {NEXT_STATUS[selected.status].map((action) => (
                  <Button
                    key={action.value}
                    variant={action.variant}
                    loading={updating}
                    onClick={() => updateStatus(selected.id, action.value, assignDriverId || undefined)}
                    size="sm"
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
