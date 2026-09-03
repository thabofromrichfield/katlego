'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/layout/page-header'
import { Modal } from '@/components/ui/modal'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SearchInput } from '@/components/ui/search-input'
import { Car, Plus, Edit2, Trash2, AlertTriangle, Wrench, UserCheck, ChevronRight } from 'lucide-react'
import { formatStatus } from '@/lib/utils'
import toast from 'react-hot-toast'

/* ─── Status badge ───────────────────────────────────── */
const STATUS_CFG: Record<string, { color: string; bg: string; dot: string }> = {
  available:   { color: '#059669', bg: '#d1fae5', dot: '#059669' },
  on_trip:     { color: '#2563eb', bg: '#dbeafe', dot: '#2563eb' },
  maintenance: { color: '#d97706', bg: '#fef3c7', dot: '#d97706' },
  offline:     { color: '#64748b', bg: '#f1f5f9', dot: '#94a3b8' },
}
function VStatusBadge({ status }: { status: string }) {
  const c = STATUS_CFG[status] ?? STATUS_CFG.offline
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 99, fontSize: 12, fontWeight: 700, color: c.color, background: c.bg }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: c.dot }} />
      {formatStatus(status)}
    </span>
  )
}

/* ─── Options ────────────────────────────────────────── */
const STATUS_OPTS = [
  { value: 'available',   label: 'Available' },
  { value: 'on_trip',     label: 'On Trip' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'offline',     label: 'Offline' },
]
const FUEL_OPTS = [
  { value: 'petrol', label: 'Petrol' }, { value: 'diesel', label: 'Diesel' },
  { value: 'electric', label: 'Electric' }, { value: 'hybrid', label: 'Hybrid' },
]
const TYPE_OPTS = [
  { value: 'sedan', label: 'Sedan' }, { value: 'suv', label: 'SUV' },
  { value: 'van', label: 'Van' },     { value: 'truck', label: 'Truck' },
  { value: 'minibus', label: 'Minibus' }, { value: 'bus', label: 'Bus' },
]
const REQUEST_TYPE_OPTS = [
  { value: 'repair',        label: 'Repair Needed' },
  { value: 'status_change', label: 'Status Change Request' },
  { value: 'inspection',    label: 'Inspection Required' },
  { value: 'other',         label: 'Other' },
]
const PRIORITY_OPTS = [
  { value: 'low', label: 'Low' }, { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' }, { value: 'urgent', label: 'Urgent' },
]

const BLANK_FORM = {
  make: '', model: '', year: new Date().getFullYear(),
  plate_number: '', color: '', fuel_type: 'petrol',
  vehicle_type: 'sedan', capacity: 4, status: 'available',
  manager_id: '',
}

/* ════════════════════════════════════════════════════════
   ADMIN VEHICLES — full CRUD + assign to manager
════════════════════════════════════════════════════════ */
function AdminVehicles() {
  const [vehicles,  setVehicles]  = useState<any[]>([])
  const [managers,  setManagers]  = useState<any[]>([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [filter,    setFilter]    = useState<'all' | 'available' | 'on_trip' | 'maintenance' | 'offline'>('all')
  const [showForm,  setShowForm]  = useState(false)
  const [editing,   setEditing]   = useState<any>(null)
  const [form,      setForm]      = useState<any>(BLANK_FORM)
  const [saving,    setSaving]    = useState(false)
  const [delTarget, setDelTarget] = useState<any>(null)
  const [assignV,   setAssignV]   = useState<any>(null)   // vehicle being assigned
  const [assignMgr, setAssignMgr] = useState('')
  const [assigning, setAssigning] = useState(false)

  const load = async () => {
    const supabase = createClient()
    const [{ data: veh }, { data: mgr }] = await Promise.all([
      supabase
        .from('vehicles')
        .select('*, profiles!manager_id(full_name)')
        .eq('is_active', true)
        .order('make'),
      supabase.from('profiles').select('id, full_name').eq('role', 'manager').eq('is_active', true).order('full_name'),
    ])
    setVehicles(veh ?? [])
    setManagers(mgr ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const filtered = vehicles.filter(v => {
    const matchSearch = [v.make, v.model, v.plate_number, v.color, v.profiles?.full_name]
      .join(' ').toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || v.status === filter
    return matchSearch && matchFilter
  })

  const openCreate = () => { setEditing(null); setForm(BLANK_FORM); setShowForm(true) }
  const openEdit   = (v: any) => {
    setEditing(v)
    setForm({ make: v.make, model: v.model, year: v.year, plate_number: v.plate_number, color: v.color, fuel_type: v.fuel_type, vehicle_type: v.vehicle_type, capacity: v.capacity, status: v.status, manager_id: v.manager_id ?? '' })
    setShowForm(true)
  }
  const setF = (k: string, val: any) => setForm((f: any) => ({ ...f, [k]: val }))

  const handleSave = async () => {
    if (!form.make || !form.model || !form.plate_number) { toast.error('Make, model and plate are required'); return }
    setSaving(true)
    const supabase = createClient()
    const payload: any = {
      make: form.make.trim(), model: form.model.trim(), year: Number(form.year),
      plate_number: form.plate_number.trim().toUpperCase(),
      color: form.color.trim(), fuel_type: form.fuel_type,
      vehicle_type: form.vehicle_type, capacity: Number(form.capacity),
      status: form.status, is_active: true,
      manager_id: form.manager_id || null,
    }
    const { error } = editing
      ? await supabase.from('vehicles').update(payload).eq('id', editing.id)
      : await supabase.from('vehicles').insert(payload)
    if (error) { toast.error(error.message) }
    else { toast.success(editing ? 'Vehicle updated!' : 'Vehicle added!'); setShowForm(false); load() }
    setSaving(false)
  }

  const handleDelete = async () => {
    const { error } = await createClient().from('vehicles').update({ is_active: false }).eq('id', delTarget.id)
    if (error) { toast.error(error.message) }
    else { toast.success('Vehicle removed from fleet'); setDelTarget(null); load() }
  }

  const handleAssign = async () => {
    if (!assignMgr) { toast.error('Select a manager'); return }
    setAssigning(true)
    const { error } = await createClient().from('vehicles').update({ manager_id: assignMgr || null }).eq('id', assignV.id)
    if (error) { toast.error(error.message) }
    else {
      const mgr = managers.find(m => m.id === assignMgr)
      toast.success(assignMgr ? `Assigned to ${mgr?.full_name}` : 'Manager assignment cleared')
      setAssignV(null); setAssignMgr(''); load()
    }
    setAssigning(false)
  }

  /* Status filter bar */
  const statusFilters: { key: typeof filter; label: string }[] = [
    { key: 'all', label: `All (${vehicles.length})` },
    { key: 'available',   label: `Available (${vehicles.filter(v => v.status === 'available').length})` },
    { key: 'on_trip',     label: `On Trip (${vehicles.filter(v => v.status === 'on_trip').length})` },
    { key: 'maintenance', label: `Maintenance (${vehicles.filter(v => v.status === 'maintenance').length})` },
    { key: 'offline',     label: `Offline (${vehicles.filter(v => v.status === 'offline').length})` },
  ]

  return (
    <div>
      <PageHeader
        title="Fleet Vehicles"
        subtitle={`${vehicles.length} vehicles · admin has full control`}
        actions={
          <button onClick={openCreate} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 40, padding: '0 18px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            <Plus style={{ width: 16, height: 16 }} /> Add Vehicle
          </button>
        }
      />

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total',       value: vehicles.length,                                   color: '#2563eb', bg: '#dbeafe' },
          { label: 'Available',   value: vehicles.filter(v => v.status === 'available').length,   color: '#059669', bg: '#d1fae5' },
          { label: 'On Trip',     value: vehicles.filter(v => v.status === 'on_trip').length,      color: '#7c3aed', bg: '#ede9fe' },
          { label: 'Maintenance', value: vehicles.filter(v => v.status === 'maintenance').length,  color: '#d97706', bg: '#fef3c7' },
          { label: 'Offline',     value: vehicles.filter(v => v.status === 'offline').length,      color: '#64748b', bg: '#f1f5f9' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', borderRadius: 14, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(15,23,42,0.05)', padding: '14px 18px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{s.label}</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(15,23,42,0.06)' }}>
        {/* Toolbar */}
        <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid #f8fafc' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 14 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Vehicle Registry <span style={{ fontSize: 13, fontWeight: 500, color: '#94a3b8', marginLeft: 6 }}>{filtered.length} shown</span></p>
            <SearchInput value={search} onChange={setSearch} placeholder="Search make, model, plate, manager…" />
          </div>
          {/* Filter pills */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {statusFilters.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                style={{ padding: '5px 14px', borderRadius: 99, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', background: filter === f.key ? '#0f172a' : '#f1f5f9', color: filter === f.key ? 'white' : '#64748b', transition: 'all 0.15s' }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 24 }}>{[...Array(5)].map((_, i) => <div key={i} style={{ height: 68, background: '#f8fafc', borderRadius: 12, marginBottom: 10 }} />)}</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <Car style={{ width: 40, height: 40, color: '#e2e8f0', margin: '0 auto 12px' }} />
            <p style={{ color: '#94a3b8', fontWeight: 600, fontSize: 14 }}>{search ? 'No vehicles match your search' : 'No vehicles yet'}</p>
            {!search && (
              <button onClick={openCreate} style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 6, height: 36, padding: '0 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                <Plus style={{ width: 14, height: 14 }} /> Add First Vehicle
              </button>
            )}
          </div>
        ) : filtered.map(v => (
          <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 24px', borderBottom: '1px solid #f8fafc', transition: 'background 0.12s' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#fafafa'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
          >
            {/* Icon */}
            <div style={{ width: 44, height: 44, borderRadius: 12, background: STATUS_CFG[v.status]?.bg ?? '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Car style={{ width: 22, height: 22, color: STATUS_CFG[v.status]?.color ?? '#64748b' }} />
            </div>

            {/* Vehicle info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 3 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{v.year} {v.make} {v.model}</p>
                <VStatusBadge status={v.status} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, fontFamily: 'monospace', background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>{v.plate_number}</span>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>{v.color} · {v.vehicle_type} · {v.capacity} seats · {v.fuel_type}</span>
              </div>
            </div>

            {/* Manager assignment */}
            <div style={{ flexShrink: 0, minWidth: 140 }}>
              {v.profiles?.full_name ? (
                <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: '5px 10px' }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 1 }}>Manager</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#0c4a6e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.profiles.full_name}</p>
                </div>
              ) : (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '5px 10px' }}>
                  <p style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>Unassigned</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <button title="Assign to manager" onClick={() => { setAssignV(v); setAssignMgr(v.manager_id ?? '') }}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, fontSize: 12, fontWeight: 700, color: '#0284c7', cursor: 'pointer' }}>
                <UserCheck style={{ width: 14, height: 14 }} /> Assign
              </button>
              <button title="Edit" onClick={() => openEdit(v)}
                style={{ padding: '6px 10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center' }}>
                <Edit2 style={{ width: 14, height: 14 }} />
              </button>
              <button title="Remove" onClick={() => setDelTarget(v)}
                style={{ padding: '6px 10px', background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 8, cursor: 'pointer', color: '#e11d48', display: 'flex', alignItems: 'center' }}>
                <Trash2 style={{ width: 14, height: 14 }} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── ADD / EDIT MODAL ── */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editing ? `Edit — ${editing.make} ${editing.model}` : 'Add New Vehicle'} size="lg">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
          <Input label="Make *"       placeholder="Toyota"     value={form.make}         onChange={e => setF('make', e.target.value)} />
          <Input label="Model *"      placeholder="Hilux"      value={form.model}        onChange={e => setF('model', e.target.value)} />
          <Input label="Year *"       type="number"            value={form.year}         onChange={e => setF('year', e.target.value)} />
          <Input label="Plate No. *"  placeholder="CA 123-456" value={form.plate_number} onChange={e => setF('plate_number', e.target.value)} />
          <Input label="Colour"       placeholder="White"      value={form.color}        onChange={e => setF('color', e.target.value)} />
          <Input label="Capacity"     type="number"            value={form.capacity}     onChange={e => setF('capacity', e.target.value)} />
          <Select label="Type"        options={TYPE_OPTS}   value={form.vehicle_type} onChange={e => setF('vehicle_type', e.target.value)} />
          <Select label="Fuel"        options={FUEL_OPTS}   value={form.fuel_type}    onChange={e => setF('fuel_type', e.target.value)} />
          <Select label="Status"      options={STATUS_OPTS} value={form.status}        onChange={e => setF('status', e.target.value)} />
          <Select
            label="Assign to Manager"
            options={[{ value: '', label: 'Unassigned' }, ...managers.map(m => ({ value: m.id, label: m.full_name }))]}
            value={form.manager_id}
            onChange={e => setF('manager_id', e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: 12, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
          <Button variant="outline" onClick={() => setShowForm(false)} fullWidth>Cancel</Button>
          <Button onClick={handleSave} loading={saving} fullWidth>{editing ? 'Save Changes' : 'Add Vehicle'}</Button>
        </div>
      </Modal>

      {/* ── ASSIGN MODAL ── */}
      <Modal isOpen={!!assignV} onClose={() => setAssignV(null)} title="Assign Vehicle to Manager" size="sm">
        {assignV && (
          <div>
            <div style={{ background: '#f8fafc', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: STATUS_CFG[assignV.status]?.bg ?? '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Car style={{ width: 20, height: 20, color: STATUS_CFG[assignV.status]?.color ?? '#64748b' }} />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{assignV.year} {assignV.make} {assignV.model}</p>
                <p style={{ fontSize: 12, fontFamily: 'monospace', color: '#64748b' }}>{assignV.plate_number}</p>
              </div>
            </div>
            <Select
              label="Assign to Manager"
              options={[{ value: '', label: 'Remove assignment (unassigned)' }, ...managers.map(m => ({ value: m.id, label: m.full_name }))]}
              value={assignMgr}
              onChange={e => setAssignMgr(e.target.value)}
            />
            <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>
              The vehicle will appear in that manager's fleet view. Drivers in the manager's team can be assigned this vehicle.
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 20, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
              <Button variant="outline" onClick={() => setAssignV(null)} fullWidth>Cancel</Button>
              <Button onClick={handleAssign} loading={assigning} fullWidth>Confirm Assignment</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── DELETE CONFIRM ── */}
      <Modal isOpen={!!delTarget} onClose={() => setDelTarget(null)} title="Remove Vehicle" size="sm">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
          <div style={{ width: 40, height: 40, background: '#ffe4e6', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertTriangle style={{ width: 20, height: 20, color: '#e11d48' }} />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Remove <strong>{delTarget?.year} {delTarget?.make} {delTarget?.model}</strong> ({delTarget?.plate_number})?</p>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>This marks the vehicle as inactive. It can be restored by re-adding it.</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button variant="outline" onClick={() => setDelTarget(null)} fullWidth>Cancel</Button>
          <Button variant="danger" onClick={handleDelete} fullWidth>Remove Vehicle</Button>
        </div>
      </Modal>
    </div>
  )
}

/* ════════════════════════════════════════════════════════
   MANAGER VEHICLES — team view + maintenance requests
════════════════════════════════════════════════════════ */
function ManagerVehicles({ managerId }: { managerId: string }) {
  const [vehicles,   setVehicles]   = useState<any[]>([])
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [selected,   setSelected]   = useState<any | null>(null)
  const [showReq,    setShowReq]    = useState(false)
  const [reqForm,    setReqForm]    = useState({ request_type: 'repair', requested_status: '', description: '', priority: 'normal' })
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    const { data } = await createClient().rpc('get_manager_vehicles', { p_manager_id: managerId })
    setVehicles(data ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [managerId])

  const filtered = vehicles.filter(v =>
    [v.make, v.model, v.plate_number, v.driver_name].join(' ').toLowerCase().includes(search.toLowerCase())
  )

  const submitRequest = async () => {
    if (!reqForm.description.trim()) { toast.error('Please describe the issue'); return }
    setSubmitting(true)
    const { data: { user } } = await createClient().auth.getUser()
    const payload: any = {
      vehicle_id: selected.vehicle_id, requested_by: user!.id,
      request_type: reqForm.request_type, current_status: selected.status,
      description: reqForm.description.trim(), priority: reqForm.priority,
    }
    if (reqForm.request_type === 'status_change' && reqForm.requested_status)
      payload.requested_status = reqForm.requested_status

    const { error } = await createClient().from('vehicle_maintenance_requests').insert(payload)
    if (error) { toast.error(error.message) }
    else { toast.success('Request sent to admin ✅'); setShowReq(false); setReqForm({ request_type: 'repair', requested_status: '', description: '', priority: 'normal' }); load() }
    setSubmitting(false)
  }

  return (
    <div>
      <PageHeader title="Team Fleet" subtitle="Vehicles assigned to your team by admin" />

      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(15,23,42,0.06)' }}>
        <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid #f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Assigned Vehicles <span style={{ fontSize: 13, fontWeight: 400, color: '#94a3b8' }}>{filtered.length}</span></p>
          <SearchInput value={search} onChange={setSearch} placeholder="Search…" />
        </div>

        {loading ? (
          <div style={{ padding: 24 }}>{[...Array(3)].map((_, i) => <div key={i} style={{ height: 72, background: '#f8fafc', borderRadius: 12, marginBottom: 10 }} />)}</div>
        ) : vehicles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 24px' }}>
            <Car style={{ width: 40, height: 40, color: '#e2e8f0', margin: '0 auto 12px' }} />
            <p style={{ color: '#94a3b8', fontWeight: 600, fontSize: 14 }}>No vehicles assigned to your team yet</p>
            <p style={{ color: '#cbd5e1', fontSize: 13, marginTop: 4 }}>Your admin will assign vehicles to your fleet.</p>
          </div>
        ) : filtered.map(v => (
          <div key={v.vehicle_id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 24px', borderBottom: '1px solid #f8fafc', cursor: 'pointer', transition: 'background 0.12s' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#fafafa'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
            onClick={() => { setSelected(v); setShowReq(false) }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 12, background: STATUS_CFG[v.status]?.bg ?? '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Car style={{ width: 22, height: 22, color: STATUS_CFG[v.status]?.color ?? '#64748b' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 3 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{v.year} {v.make} {v.model}</p>
                <VStatusBadge status={v.status} />
                {Number(v.pending_requests) > 0 && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700, color: '#d97706', background: '#fef3c7', border: '1px solid #fde68a' }}>
                    <Wrench style={{ width: 11, height: 11 }} />{v.pending_requests} pending
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 12, fontFamily: 'monospace', background: '#f1f5f9', color: '#475569', padding: '1px 7px', borderRadius: 6, fontWeight: 600 }}>{v.plate_number}</span>
                {v.driver_name && <span style={{ fontSize: 12, color: '#64748b' }}>👤 {v.driver_name}</span>}
              </div>
            </div>
            <ChevronRight style={{ width: 16, height: 16, color: '#cbd5e1', flexShrink: 0 }} />
          </div>
        ))}
      </div>

      {/* Vehicle detail modal */}
      <Modal isOpen={!!selected && !showReq} onClose={() => setSelected(null)} title="Vehicle Details" size="md">
        {selected && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: STATUS_CFG[selected.status]?.bg ?? '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Car style={{ width: 26, height: 26, color: STATUS_CFG[selected.status]?.color ?? '#64748b' }} />
              </div>
              <div>
                <p style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{selected.year} {selected.make} {selected.model}</p>
                <VStatusBadge status={selected.status} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              {[
                { l: 'Plate', v: selected.plate_number },
                { l: 'Colour', v: selected.color },
                { l: 'Type', v: selected.vehicle_type },
                { l: 'Fuel', v: selected.fuel_type },
                { l: 'Capacity', v: `${selected.capacity} seats` },
                { l: 'Driver', v: selected.driver_name ?? 'Unassigned' },
              ].map(({ l, v }) => (
                <div key={l} style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 14px' }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{l}</p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{v}</p>
                </div>
              ))}
            </div>
            {Number(selected.pending_requests) > 0 && (
              <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 12, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle style={{ width: 16, height: 16, color: '#d97706', flexShrink: 0 }} />
                <p style={{ fontSize: 13, color: '#92400e', fontWeight: 600 }}>{selected.pending_requests} open maintenance request{Number(selected.pending_requests) > 1 ? 's' : ''}</p>
              </div>
            )}
            <button onClick={() => setShowReq(true)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, height: 44, background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 12, fontSize: 14, fontWeight: 700, color: '#92400e', cursor: 'pointer' }}>
              <Wrench style={{ width: 16, height: 16 }} /> Submit Maintenance / Status Request
            </button>
          </div>
        )}
      </Modal>

      {/* Request form modal */}
      <Modal isOpen={showReq} onClose={() => setShowReq(false)} title="Submit Request to Admin" size="md">
        {selected && (
          <div>
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 14px', marginBottom: 18 }}>
              <p style={{ fontSize: 13, color: '#64748b' }}>Vehicle: <strong style={{ color: '#0f172a' }}>{selected.year} {selected.make} {selected.model} ({selected.plate_number})</strong></p>
              <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Current status: <strong>{formatStatus(selected.status)}</strong></p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Select label="Request Type" options={REQUEST_TYPE_OPTS} value={reqForm.request_type} onChange={e => setReqForm(f => ({ ...f, request_type: e.target.value }))} />
              {reqForm.request_type === 'status_change' && (
                <Select label="Requested New Status" options={STATUS_OPTS} placeholder="Select new status…" value={reqForm.requested_status} onChange={e => setReqForm(f => ({ ...f, requested_status: e.target.value }))} />
              )}
              <Select label="Priority" options={PRIORITY_OPTS} value={reqForm.priority} onChange={e => setReqForm(f => ({ ...f, priority: e.target.value }))} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>Description <span style={{ color: '#e11d48' }}>*</span></label>
                <textarea value={reqForm.description} onChange={e => setReqForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Describe the issue or reason in detail…" rows={4}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: 14, fontFamily: 'inherit', resize: 'none', outline: 'none', color: '#0f172a' }}
                  onFocus={e => e.target.style.borderColor = '#2563eb'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 18, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
              <Button variant="outline" onClick={() => setShowReq(false)} fullWidth>Cancel</Button>
              <Button onClick={submitRequest} loading={submitting} fullWidth>Submit to Admin</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

/* ════════════════════════════════════════════════════════
   ROOT — role split
════════════════════════════════════════════════════════ */
export default function VehiclesPage() {
  const [role,   setRole]   = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [ready,  setReady]  = useState(false)

  useEffect(() => {
    createClient().auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { window.location.href = '/login'; return }
      const { data: prof } = await createClient().from('profiles').select('role').eq('id', user.id).single()
      setRole(prof?.role ?? 'manager')
      setUserId(user.id)
      setReady(true)
    })
  }, [])

  if (!ready) return <div style={{ padding: 40 }}><div style={{ height: 300, background: '#f1f5f9', borderRadius: 16 }} /></div>
  return role === 'admin' ? <AdminVehicles /> : <ManagerVehicles managerId={userId!} />
}
