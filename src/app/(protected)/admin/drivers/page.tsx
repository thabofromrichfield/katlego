'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Modal } from '@/components/ui/modal'
import { Users, Edit2, Trash2, Phone, Star, AlertTriangle, UserPlus, Wifi, WifiOff, Eye, EyeOff } from 'lucide-react'
import { SearchInput } from '@/components/ui/search-input'
import { generateInitials, formatStatus } from '@/lib/utils'
import toast from 'react-hot-toast'

function StatusPill({ status }: { status: string }) {
  const cfg: Record<string, { label: string; color: string; bg: string }> = {
    available: { label: 'Online',    color: '#059669', bg: '#d1fae5' },
    on_trip:   { label: 'On Trip',   color: '#2563eb', bg: '#dbeafe' },
    off_duty:  { label: 'Offline',   color: '#64748b', bg: '#f1f5f9' },
    leave:     { label: 'On Leave',  color: '#d97706', bg: '#fef3c7' },
    suspended: { label: 'Suspended', color: '#e11d48', bg: '#ffe4e6' },
  }
  const c = cfg[status] ?? cfg.off_duty
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 99, fontSize: 12, fontWeight: 700, color: c.color, background: c.bg }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: c.color }} />
      {c.label}
    </span>
  )
}

const STATUS_OPTS     = [{ value: 'available', label: 'Available' }, { value: 'on_trip', label: 'On Trip' }, { value: 'off_duty', label: 'Off Duty' }, { value: 'leave', label: 'On Leave' }, { value: 'suspended', label: 'Suspended' }]
const LICENSE_OPTS    = [{ value: 'code_8', label: 'Code 8' }, { value: 'code_10', label: 'Code 10' }, { value: 'code_14', label: 'Code 14' }, { value: 'pdp', label: 'PDP' }]

/* ─── ADMIN: All Drivers + assign-to-manager ────────── */
function AdminDrivers() {
  const [drivers,  setDrivers]  = useState<any[]>([])
  const [managers, setManagers] = useState<any[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [editing,  setEditing]  = useState<any>(null)
  const [form,     setForm]     = useState<any>({})
  const [saving,   setSaving]   = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [assignTarget, setAssignTarget] = useState<any>(null)
  const [assignManagerId, setAssignManagerId] = useState('')
  const [assigning, setAssigning] = useState(false)

  const load = async () => {
    const supabase = createClient()
    const [{ data: dr }, { data: mg }, { data: vh }] = await Promise.all([
      supabase.from('drivers').select('*, profiles(full_name, phone), vehicles(make, model, plate_number)').eq('is_active', true).order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, full_name').eq('role', 'manager').eq('is_active', true),
      supabase.from('vehicles').select('id, make, model, plate_number').eq('status', 'available').eq('is_active', true),
    ])
    setDrivers(dr ?? [])
    setManagers(mg ?? [])
    setVehicles(vh ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const filtered = drivers.filter(d =>
    [d.profiles?.full_name, d.license_number].join(' ').toLowerCase().includes(search.toLowerCase())
  )

  const openEdit = (d: any) => {
    setEditing(d)
    setForm({ license_number: d.license_number ?? '', license_class: d.license_class ?? 'code_8', license_expiry: d.license_expiry ?? '', status: d.status ?? 'available', current_vehicle_id: d.current_vehicle_id ?? '' })
  }

  const handleSave = async () => {
    setSaving(true)
    const { error } = await createClient().from('drivers').update({
      license_number: form.license_number,
      license_class: form.license_class,
      license_expiry: form.license_expiry || null,
      status: form.status,
      current_vehicle_id: form.current_vehicle_id || null,
    }).eq('id', editing.id)
    if (error) { toast.error(error.message) } else { toast.success('Driver updated!'); setEditing(null); load() }
    setSaving(false)
  }

  const handleDeactivate = async () => {
    const { error } = await createClient().from('drivers').update({ is_active: false }).eq('id', deleteTarget.id)
    if (error) { toast.error(error.message) } else { toast.success('Driver deactivated'); setDeleteTarget(null); load() }
  }

  const handleAssign = async () => {
    if (!assignManagerId) { toast.error('Select a manager'); return }
    setAssigning(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('manager_drivers').upsert({
      manager_id: assignManagerId,
      driver_id: assignTarget.id,
      assigned_by: user!.id,
    }, { onConflict: 'manager_id,driver_id' })
    if (error) { toast.error(error.message) } else { toast.success('Driver assigned to manager ✅'); setAssignTarget(null); setAssignManagerId('') }
    setAssigning(false)
  }

  return (
    <div>
      <PageHeader title="All Drivers" subtitle={`${drivers.length} active drivers in the system`} />

      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(15,23,42,0.06)' }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Drivers</p>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{filtered.length} shown</p>
          </div>
          <SearchInput value={search} onChange={setSearch} placeholder="Search drivers…" />
        </div>

        {loading ? (
          <div style={{ padding: 24 }}>{[...Array(4)].map((_, i) => <div key={i} style={{ height: 72, background: '#f1f5f9', borderRadius: 12, marginBottom: 12 }} />)}</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <Users style={{ width: 40, height: 40, color: '#e2e8f0', margin: '0 auto 12px' }} />
            <p style={{ color: '#94a3b8', fontWeight: 600, fontSize: 14 }}>No drivers found</p>
          </div>
        ) : filtered.map(d => (
          <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 24px', borderBottom: '1px solid #f8fafc', transition: 'background 0.15s' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#f8fafc'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
          >
            <div style={{ width: 42, height: 42, background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 14, fontWeight: 800, flexShrink: 0 }}>
              {generateInitials(d.profiles?.full_name ?? 'DR')}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 3 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{d.profiles?.full_name ?? 'Unknown'}</p>
                <StatusPill status={d.status} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                {d.profiles?.phone && <span style={{ fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}><Phone style={{ width: 12, height: 12 }} />{d.profiles.phone}</span>}
                {d.license_number && <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#94a3b8' }}>{d.license_number}</span>}
                {d.vehicles && <span style={{ fontSize: 12, color: '#64748b' }}>🚗 {d.vehicles.make} {d.vehicles.model}</span>}
                {d.rating && <span style={{ fontSize: 12, color: '#ca8a04', display: 'flex', alignItems: 'center', gap: 3 }}><Star style={{ width: 12, height: 12 }} />{Number(d.rating).toFixed(1)}</span>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <Button variant="ghost" size="sm" icon={UserPlus} onClick={() => setAssignTarget(d)}>Assign</Button>
              <Button variant="ghost" size="sm" icon={Edit2} onClick={() => openEdit(d)}>Edit</Button>
              <Button variant="ghost" size="sm" icon={Trash2} onClick={() => setDeleteTarget(d)} style={{ color: '#e11d48' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Edit modal */}
      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title="Edit Driver">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="License Number" value={form.license_number ?? ''} onChange={e => setForm((f: any) => ({ ...f, license_number: e.target.value }))} />
          <Select label="License Class" options={LICENSE_OPTS} value={form.license_class ?? 'code_8'} onChange={e => setForm((f: any) => ({ ...f, license_class: e.target.value }))} />
          <Input label="License Expiry" type="date" value={form.license_expiry ?? ''} onChange={e => setForm((f: any) => ({ ...f, license_expiry: e.target.value }))} />
          <Select label="Status" options={STATUS_OPTS} value={form.status ?? 'available'} onChange={e => setForm((f: any) => ({ ...f, status: e.target.value }))} />
          <Select label="Assign Vehicle" options={[{ value: '', label: 'No vehicle' }, ...vehicles.map(v => ({ value: v.id, label: `${v.make} ${v.model} (${v.plate_number})` }))]} value={form.current_vehicle_id ?? ''} onChange={e => setForm((f: any) => ({ ...f, current_vehicle_id: e.target.value }))} />
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 20, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
          <Button variant="outline" onClick={() => setEditing(null)} fullWidth>Cancel</Button>
          <Button onClick={handleSave} loading={saving} fullWidth>Save Changes</Button>
        </div>
      </Modal>

      {/* Assign to manager modal */}
      <Modal isOpen={!!assignTarget} onClose={() => setAssignTarget(null)} title="Assign Driver to Manager">
        {assignTarget && (
          <div>
            <div style={{ background: '#f8fafc', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 13, fontWeight: 800 }}>
                {generateInitials(assignTarget.profiles?.full_name ?? 'DR')}
              </div>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{assignTarget.profiles?.full_name}</p>
            </div>
            <Select
              label="Assign to Manager"
              placeholder="Select a manager…"
              options={managers.map(m => ({ value: m.id, label: m.full_name }))}
              value={assignManagerId}
              onChange={e => setAssignManagerId(e.target.value)}
            />
            <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>The driver will appear in the selected manager's team dashboard. They can belong to multiple managers.</p>
            <div style={{ display: 'flex', gap: 12, marginTop: 20, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
              <Button variant="outline" onClick={() => setAssignTarget(null)} fullWidth>Cancel</Button>
              <Button onClick={handleAssign} loading={assigning} fullWidth>Assign Driver</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Deactivate confirm */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Deactivate Driver">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ width: 40, height: 40, background: '#ffe4e6', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertTriangle style={{ width: 20, height: 20, color: '#e11d48' }} />
          </div>
          <p style={{ fontSize: 14, color: '#374151' }}>Deactivate <strong>{deleteTarget?.profiles?.full_name}</strong>? They will no longer receive trip assignments.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          <Button variant="outline" onClick={() => setDeleteTarget(null)} fullWidth>Cancel</Button>
          <Button variant="danger" onClick={handleDeactivate} fullWidth>Deactivate</Button>
        </div>
      </Modal>
    </div>
  )
}

/* ─── MANAGER: Team drivers only (read + create) ──────── */
function ManagerDrivers({ managerId }: { managerId: string }) {
  const [team,       setTeam]       = useState<any[]>([])
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [creating,   setCreating]   = useState(false)
  const [showPw,     setShowPw]     = useState(false)
  const [newDriver,  setNewDriver]  = useState({ full_name: '', email: '', password: '', phone: '', license_number: '', license_class: 'code_8', license_expiry: '' })

  const load = async () => {
    const { data, error } = await createClient().rpc('get_manager_team_stats', { p_manager_id: managerId })
    if (!error) setTeam(data ?? [])
    setLoading(false)
  }
  useEffect(() => {
    load()
    const ch = createClient().channel('mgr-drivers-page')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'drivers' }, load)
      .subscribe()
    return () => { createClient().removeChannel(ch) }
  }, [managerId])

  const createDriver = async () => {
    if (!newDriver.full_name.trim() || !newDriver.email.trim() || !newDriver.password.trim()) {
      toast.error('Name, email and password are required'); return
    }
    if (newDriver.password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setCreating(true)
    try {
      const res = await fetch('/api/manager/create-driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newDriver, license_number: newDriver.license_number || undefined, license_expiry: newDriver.license_expiry || undefined }),
      })
      const json = await res.json()
      if (json.error) { toast.error(json.error) }
      else {
        toast.success(`${newDriver.full_name} added to your team ✅`)
        setShowCreate(false)
        setNewDriver({ full_name: '', email: '', password: '', phone: '', license_number: '', license_class: 'code_8', license_expiry: '' })
        setTimeout(load, 800)
      }
    } catch { toast.error('Failed to create driver') }
    setCreating(false)
  }

  const filtered = team.filter(d => (d.driver_name ?? '').toLowerCase().includes(search.toLowerCase()))
  const online   = team.filter(d => d.driver_status === 'available').length
  const onTrip   = team.filter(d => d.driver_status === 'on_trip').length

  return (
    <div>
      <PageHeader title="My Drivers"
        subtitle={`${team.length} drivers · ${online} online · ${onTrip} on trip`}
        actions={
          <button onClick={() => setShowCreate(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 40, padding: '0 18px', background: '#059669', color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            <UserPlus style={{ width: 16, height: 16 }} /> Add Driver
          </button>
        }
      />

      {/* Quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Drivers', value: team.length,  color: '#2563eb', bg: '#dbeafe', icon: Users },
          { label: 'Online Now',    value: online,        color: '#059669', bg: '#d1fae5', icon: Wifi },
          { label: 'On Trip',       value: onTrip,        color: '#7c3aed', bg: '#ede9fe', icon: Users },
          { label: 'Offline',       value: team.length - online - onTrip, color: '#64748b', bg: '#f1f5f9', icon: WifiOff },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(15,23,42,0.06)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ padding: 10, borderRadius: 12, background: s.bg, flexShrink: 0 }}>
              <s.icon style={{ width: 18, height: 18, color: s.color }} />
            </div>
            <div>
              <p style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 3, fontWeight: 600 }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(15,23,42,0.06)' }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Driver Roster</p>
          <SearchInput value={search} onChange={setSearch} placeholder="Search…" />
        </div>

        {loading ? (
          <div style={{ padding: 24 }}>{[...Array(3)].map((_, i) => <div key={i} style={{ height: 72, background: '#f1f5f9', borderRadius: 12, marginBottom: 12 }} />)}</div>
        ) : team.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 24px' }}>
            <Users style={{ width: 40, height: 40, color: '#e2e8f0', margin: '0 auto 12px' }} />
            <p style={{ color: '#94a3b8', fontWeight: 600, fontSize: 14 }}>No drivers assigned to your team</p>
            <p style={{ color: '#cbd5e1', fontSize: 13, marginTop: 4 }}>Contact your admin to assign drivers.</p>
          </div>
        ) : filtered.map(d => (
          <div key={d.driver_id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 24px', borderBottom: '1px solid #f8fafc' }}>
            <div style={{ width: 42, height: 42, borderRadius: '50%', background: d.driver_status === 'available' ? '#d1fae5' : d.driver_status === 'on_trip' ? '#dbeafe' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: d.driver_status === 'available' ? '#059669' : d.driver_status === 'on_trip' ? '#2563eb' : '#94a3b8', flexShrink: 0, position: 'relative' }}>
              {(d.driver_name ?? '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
              {d.driver_status === 'available' && <span style={{ position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, borderRadius: '50%', background: '#059669', border: '2px solid white' }} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.driver_name}</p>
              <p style={{ fontSize: 12, color: '#94a3b8' }}>{d.phone ?? 'No phone'} · {d.total_trips ?? 0} trips · ★ {Number(d.rating ?? 0).toFixed(1)}</p>
            </div>
            <StatusPill status={d.driver_status} />
            {d.vehicle_plate && (
              <div style={{ flexShrink: 0, textAlign: 'right', minWidth: 110 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{d.vehicle_make} {d.vehicle_model}</p>
                <span style={{ fontSize: 11, fontFamily: 'monospace', background: '#f1f5f9', color: '#64748b', padding: '1px 6px', borderRadius: 4 }}>{d.vehicle_plate}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create driver modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Add Driver to Your Team" size="md">
        <div style={{ marginBottom: 16, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 14px', display: 'flex', gap: 8 }}>
          <UserPlus style={{ width: 15, height: 15, color: '#059669', flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 12, color: '#065f46', lineHeight: 1.5 }}>The driver will be automatically added to your team and can log in immediately. You can assign them a vehicle from the Fleet page.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="Full Name *" placeholder="e.g. Sipho Nkosi" value={newDriver.full_name} onChange={e => setNewDriver(d => ({ ...d, full_name: e.target.value }))} />
          <Input label="Email *" type="email" placeholder="sipho@company.co.za" value={newDriver.email} onChange={e => setNewDriver(d => ({ ...d, email: e.target.value }))} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>Password <span style={{ color: '#e11d48' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <input type={showPw ? 'text' : 'password'} value={newDriver.password}
                onChange={e => setNewDriver(d => ({ ...d, password: e.target.value }))}
                placeholder="Min 6 characters"
                style={{ height: 44, width: '100%', boxSizing: 'border-box', paddingLeft: 14, paddingRight: 44, border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: 14, fontFamily: 'inherit', outline: 'none', color: '#0f172a' }}
                onFocus={e => e.target.style.borderColor = '#059669'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
              <button type="button" onClick={() => setShowPw(v => !v)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
                {showPw ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
              </button>
            </div>
          </div>
          <Input label="Phone (optional)" type="tel" placeholder="+27 82 000 0000" value={newDriver.phone} onChange={e => setNewDriver(d => ({ ...d, phone: e.target.value }))} />
          <Input label="License Number (optional)" placeholder="Leave blank to auto-generate" value={newDriver.license_number} onChange={e => setNewDriver(d => ({ ...d, license_number: e.target.value }))} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Select label="License Class" options={LICENSE_OPTS} value={newDriver.license_class} onChange={e => setNewDriver(d => ({ ...d, license_class: e.target.value }))} />
            <Input label="Expiry Date" type="date" value={newDriver.license_expiry} onChange={e => setNewDriver(d => ({ ...d, license_expiry: e.target.value }))} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 20, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
          <Button variant="outline" onClick={() => setShowCreate(false)} fullWidth>Cancel</Button>
          <Button onClick={createDriver} loading={creating} fullWidth icon={UserPlus}>Add Driver</Button>
        </div>
      </Modal>
    </div>
  )
}

/* ─── ROOT PAGE ──────────────────────────────────────── */
export default function DriversPage() {
  const [role,    setRole]    = useState<string | null>(null)
  const [userId,  setUserId]  = useState<string | null>(null)
  const [ready,   setReady]   = useState(false)

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

  if (!ready) return <div style={{ padding: 40 }}><div style={{ height: 300, background: '#f1f5f9', borderRadius: 16 }} /></div>
  if (role === 'admin') return <AdminDrivers />
  return <ManagerDrivers managerId={userId!} />
}
