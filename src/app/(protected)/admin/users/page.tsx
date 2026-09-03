'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/layout/page-header'
import { Modal } from '@/components/ui/modal'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SearchInput } from '@/components/ui/search-input'
import {
  Shield, User, Users, Truck, Plus, Edit2, Trash2,
  AlertTriangle, ChevronDown, ChevronRight, Eye, EyeOff,
  UserCheck, UserPlus,
} from 'lucide-react'
import { generateInitials } from '@/lib/utils'
import toast from 'react-hot-toast'

/* ─── Role config ────────────────────────────────────── */
const ROLES = [
  {
    key: 'admin',
    label: 'Administrators',
    description: 'Full system access — manage everything',
    color: '#2563eb', bg: '#dbeafe', border: '#bfdbfe',
    darkColor: '#1e40af', icon: Shield, emoji: '⚡',
  },
  {
    key: 'manager',
    label: 'Managers',
    description: 'Oversee a driver team and their fleet',
    color: '#7c3aed', bg: '#ede9fe', border: '#ddd6fe',
    darkColor: '#6d28d9', icon: UserCheck, emoji: '📊',
  },
  {
    key: 'driver',
    label: 'Drivers',
    description: 'Receive and execute trip assignments',
    color: '#059669', bg: '#d1fae5', border: '#a7f3d0',
    darkColor: '#047857', icon: Truck, emoji: '🚗',
  },
  {
    key: 'user',
    label: 'End Users',
    description: 'Book transport and track their own trips',
    color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0',
    darkColor: '#475569', icon: User, emoji: '👤',
  },
]

const ROLE_CHANGE_OPTS = [
  { value: 'user',    label: '👤 User — book trips only' },
  { value: 'driver',  label: '🚗 Driver — receive assignments' },
  { value: 'manager', label: '📊 Manager — oversee a team' },
  { value: 'admin',   label: '⚡ Admin — full system access' },
]

/* ─── Create user form (admin only) ──────────────────── */
const BLANK_NEW_USER = { full_name: '', email: '', password: '', role: 'user', phone: '' }

export default function UserRolesPage() {
  const [profiles,    setProfiles]    = useState<any[]>([])
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState('')
  const [collapsed,   setCollapsed]   = useState<Record<string, boolean>>({})
  const [editing,     setEditing]     = useState<any>(null)
  const [newRole,     setNewRole]     = useState('')
  const [saving,      setSaving]      = useState(false)
  const [deactTarget, setDeactTarget] = useState<any>(null)
  const [showCreate,  setShowCreate]  = useState(false)
  const [newUser,     setNewUser]     = useState<any>(BLANK_NEW_USER)
  const [creating,    setCreating]    = useState(false)
  const [showPw,      setShowPw]      = useState(false)

  const load = async () => {
    const { data } = await createClient()
      .from('profiles')
      .select('id, full_name, phone, role, is_active, created_at')
      .order('role').order('full_name')
    setProfiles(data ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  /* Group by role */
  const byRole = ROLES.reduce((acc, r) => {
    acc[r.key] = profiles.filter(p =>
      p.role === r.key &&
      (search === '' || [p.full_name, p.phone, p.role].join(' ').toLowerCase().includes(search.toLowerCase()))
    )
    return acc
  }, {} as Record<string, any[]>)

  const total = profiles.length
  const active = profiles.filter(p => p.is_active).length

  const openEdit = (p: any) => { setEditing(p); setNewRole(p.role) }
  const toggleSection = (key: string) => setCollapsed(c => ({ ...c, [key]: !c[key] }))

  const saveRole = async () => {
    if (newRole === editing.role) { setEditing(null); return }
    setSaving(true)
    const { error } = await createClient().from('profiles').update({ role: newRole }).eq('id', editing.id)
    if (error) { toast.error(error.message) }
    else { toast.success(`Role changed to ${newRole}`); setEditing(null); load() }
    setSaving(false)
  }

  const deactivate = async () => {
    const { error } = await createClient().from('profiles').update({ is_active: false }).eq('id', deactTarget.id)
    if (error) { toast.error(error.message) }
    else { toast.success('User deactivated'); setDeactTarget(null); load() }
  }

  const createUser = async () => {
    if (!newUser.full_name.trim() || !newUser.email.trim() || !newUser.password.trim()) {
      toast.error('Name, email and password are required'); return
    }
    if (newUser.password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setCreating(true)
    try {
      // Sign up using Supabase auth — the handle_new_user trigger auto-creates the profile
      // We use a temporary client for signup so we don't log out the current admin
      const { data, error: signupErr } = await createClient().auth.admin
        ? await fetch('/api/admin/create-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: newUser.email.trim(), password: newUser.password, full_name: newUser.full_name.trim(), role: newUser.role, phone: newUser.phone.trim() || null }),
          }).then(r => r.json())
        : { data: null, error: { message: 'Admin API not available' } }

      if (signupErr?.message) {
        // Fallback: create via supabase signUp (will set their own session, then restore)
        const { error: e2 } = await createClient().auth.signUp({
          email: newUser.email.trim(),
          password: newUser.password,
          options: {
            data: { full_name: newUser.full_name.trim(), role: newUser.role },
            emailRedirectTo: undefined,
          },
        })
        if (e2) { toast.error(e2.message); setCreating(false); return }
        // Update profile immediately if created
        await new Promise(r => setTimeout(r, 800))
        const { data: prof } = await createClient().from('profiles').select('id').eq('full_name', newUser.full_name.trim()).order('created_at', { ascending: false }).limit(1).single()
        if (prof) {
          await createClient().from('profiles').update({ role: newUser.role, phone: newUser.phone.trim() || null }).eq('id', prof.id)
        }
      }

      toast.success(`${newUser.full_name} added as ${newUser.role} ✅`)
      setShowCreate(false)
      setNewUser(BLANK_NEW_USER)
      setTimeout(load, 1000)
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to create user')
    }
    setCreating(false)
  }

  return (
    <div>
      <PageHeader
        title="User Roles"
        subtitle={`${total} registered accounts · ${active} active`}
        actions={
          <button onClick={() => setShowCreate(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 40, padding: '0 18px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            <UserPlus style={{ width: 16, height: 16 }} /> Add User
          </button>
        }
      />

      {/* Search + summary */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10, flex: 1, minWidth: 0 }}>
          {ROLES.map(r => (
            <div key={r.key} style={{ background: 'white', borderRadius: 12, border: `1.5px solid ${r.border}`, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: r.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <r.icon style={{ width: 16, height: 16, color: r.color }} />
              </div>
              <div>
                <p style={{ fontSize: 22, fontWeight: 900, color: r.color, lineHeight: 1 }}>{byRole[r.key]?.length ?? 0}</p>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 1 }}>{r.label}</p>
              </div>
            </div>
          ))}
        </div>
        <SearchInput value={search} onChange={setSearch} placeholder="Search all users…" />
      </div>

      {/* Role sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {ROLES.map(role => {
          const group = byRole[role.key] ?? []
          const isOpen = !collapsed[role.key]
          return (
            <div key={role.key} style={{ background: 'white', borderRadius: 18, border: `1.5px solid ${role.border}`, overflow: 'hidden', boxShadow: '0 2px 8px rgba(15,23,42,0.05)' }}>
              {/* Section header */}
              <button
                onClick={() => toggleSection(role.key)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '18px 22px', background: role.bg, border: 'none', cursor: 'pointer', textAlign: 'left' }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 0 2px ${role.border}`, flexShrink: 0 }}>
                  <role.icon style={{ width: 22, height: 22, color: role.color }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <p style={{ fontSize: 16, fontWeight: 800, color: role.darkColor }}>{role.emoji} {role.label}</p>
                    <span style={{ background: role.color, color: 'white', fontSize: 12, fontWeight: 800, borderRadius: 99, height: 22, minWidth: 22, padding: '0 7px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {group.length}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: role.darkColor, opacity: 0.7, marginTop: 2 }}>{role.description}</p>
                </div>
                {isOpen
                  ? <ChevronDown style={{ width: 18, height: 18, color: role.color, flexShrink: 0 }} />
                  : <ChevronRight style={{ width: 18, height: 18, color: role.color, flexShrink: 0 }} />}
              </button>

              {/* Members list */}
              {isOpen && (
                <div>
                  {group.length === 0 ? (
                    <div style={{ padding: '24px 22px', textAlign: 'center' }}>
                      <p style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic' }}>
                        {search ? 'No matches in this group' : `No ${role.label.toLowerCase()} yet`}
                      </p>
                    </div>
                  ) : group.map((p, idx) => (
                    <div key={p.id}
                      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 22px', borderTop: '1px solid #f8fafc', transition: 'background 0.12s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#fafafa'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                    >
                      {/* Avatar */}
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: role.bg, border: `1.5px solid ${role.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: role.color, flexShrink: 0 }}>
                        {generateInitials(p.full_name)}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.full_name}</p>
                        <p style={{ fontSize: 12, color: '#94a3b8' }}>
                          {p.phone ?? 'No phone'} · Added {new Date(p.created_at).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: '2-digit' })}
                        </p>
                      </div>

                      {/* Status dot */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 99, background: p.is_active ? '#d1fae5' : '#f1f5f9', flexShrink: 0 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: p.is_active ? '#059669' : '#94a3b8' }} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: p.is_active ? '#059669' : '#94a3b8' }}>{p.is_active ? 'Active' : 'Inactive'}</span>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button title="Change role" onClick={() => openEdit(p)}
                          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', background: role.bg, border: `1px solid ${role.border}`, borderRadius: 8, fontSize: 12, fontWeight: 700, color: role.color, cursor: 'pointer' }}>
                          <Edit2 style={{ width: 12, height: 12 }} /> Role
                        </button>
                        <button title="Deactivate" onClick={() => setDeactTarget(p)}
                          style={{ padding: '6px 10px', background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 8, cursor: 'pointer', color: '#e11d48', display: 'flex', alignItems: 'center' }}>
                          <Trash2 style={{ width: 12, height: 12 }} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── EDIT ROLE MODAL ── */}
      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title="Change Role" size="sm">
        {editing && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, padding: '14px 16px', background: '#f8fafc', borderRadius: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: ROLES.find(r => r.key === editing.role)?.bg ?? '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: ROLES.find(r => r.key === editing.role)?.color ?? '#64748b' }}>
                {generateInitials(editing.full_name)}
              </div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{editing.full_name}</p>
                <p style={{ fontSize: 13, color: '#64748b' }}>Current role: <strong style={{ textTransform: 'capitalize', color: ROLES.find(r => r.key === editing.role)?.color }}>{editing.role}</strong></p>
              </div>
            </div>

            <Select label="Assign New Role" options={ROLE_CHANGE_OPTS} value={newRole} onChange={e => setNewRole(e.target.value)} />

            {newRole !== editing.role && (
              <div style={{ marginTop: 12, background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 14px', display: 'flex', gap: 10 }}>
                <AlertTriangle style={{ width: 16, height: 16, color: '#d97706', flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 12, color: '#92400e', lineHeight: 1.5 }}>
                  Changing from <strong>{editing.role}</strong> → <strong>{newRole}</strong> takes effect on the user's next login.
                </p>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 20, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
              <Button variant="outline" onClick={() => setEditing(null)} fullWidth>Cancel</Button>
              <Button onClick={saveRole} loading={saving} fullWidth>Save Role</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── CREATE USER MODAL ── */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Add New User to System" size="md">
        <div style={{ marginBottom: 20, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 12, padding: '12px 16px', display: 'flex', gap: 10 }}>
          <Shield style={{ width: 16, height: 16, color: '#0284c7', flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 13, color: '#0c4a6e', lineHeight: 1.5 }}>
            Only admins can create accounts. Drivers and managers cannot self-register — they must be added here by you.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="Full Name *" placeholder="e.g. John Dlamini" value={newUser.full_name} onChange={e => setNewUser((u: any) => ({ ...u, full_name: e.target.value }))} />
          <Input label="Email Address *" type="email" placeholder="john@company.co.za" value={newUser.email} onChange={e => setNewUser((u: any) => ({ ...u, email: e.target.value }))} />

          {/* Password field with show/hide */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>Password <span style={{ color: '#e11d48' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'}
                value={newUser.password}
                onChange={e => setNewUser((u: any) => ({ ...u, password: e.target.value }))}
                placeholder="Min 6 characters"
                style={{ height: 44, width: '100%', boxSizing: 'border-box', paddingLeft: 14, paddingRight: 44, border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: 14, color: '#0f172a', fontFamily: 'inherit', outline: 'none' }}
                onFocus={e => e.target.style.borderColor = '#2563eb'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
              <button type="button" onClick={() => setShowPw(v => !v)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
                {showPw ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
              </button>
            </div>
          </div>

          <Input label="Phone (optional)" type="tel" placeholder="+27 82 000 0000" value={newUser.phone} onChange={e => setNewUser((u: any) => ({ ...u, phone: e.target.value }))} />

          <Select
            label="Role *"
            options={ROLE_CHANGE_OPTS}
            value={newUser.role}
            onChange={e => setNewUser((u: any) => ({ ...u, role: e.target.value }))}
          />

          {/* Role description hint */}
          {(() => {
            const r = ROLES.find(x => x.key === newUser.role)
            return r ? (
              <div style={{ background: r.bg, border: `1px solid ${r.border}`, borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <r.icon style={{ width: 16, height: 16, color: r.color, flexShrink: 0 }} />
                <p style={{ fontSize: 12, color: r.darkColor, fontWeight: 500 }}>{r.description}</p>
              </div>
            ) : null
          })()}
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 20, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
          <Button variant="outline" onClick={() => setShowCreate(false)} fullWidth>Cancel</Button>
          <Button onClick={createUser} loading={creating} fullWidth icon={UserPlus}>Create Account</Button>
        </div>
      </Modal>

      {/* ── DEACTIVATE CONFIRM ── */}
      <Modal isOpen={!!deactTarget} onClose={() => setDeactTarget(null)} title="Deactivate Account" size="sm">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
          <div style={{ width: 40, height: 40, background: '#ffe4e6', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertTriangle style={{ width: 20, height: 20, color: '#e11d48' }} />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Deactivate <strong>{deactTarget?.full_name}</strong>?</p>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>They will lose access to the system immediately. This can be undone by contacting a developer.</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button variant="outline" onClick={() => setDeactTarget(null)} fullWidth>Cancel</Button>
          <Button variant="danger" onClick={deactivate} fullWidth>Deactivate</Button>
        </div>
      </Modal>
    </div>
  )
}
