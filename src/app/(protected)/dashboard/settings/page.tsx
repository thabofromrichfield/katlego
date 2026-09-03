'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/layout/page-header'
import { Shield, Save, KeyRound } from 'lucide-react'
import { generateInitials } from '@/lib/utils'
import toast from 'react-hot-toast'

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>
        {label}{required && <span style={{ color: '#e11d48', marginLeft: 2 }}>*</span>}
      </label>
      {children}
      {hint && <p style={{ fontSize: 12, color: '#94a3b8' }}>{hint}</p>}
    </div>
  )
}

function TextInput({ value, onChange, placeholder, type = 'text', disabled }: {
  value: string; onChange?: (v: string) => void; placeholder?: string; type?: string; disabled?: boolean
}) {
  return (
    <input
      type={type} value={value}
      onChange={e => onChange?.(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      style={{
        height: 44, width: '100%', boxSizing: 'border-box',
        padding: '0 14px', border: '1.5px solid #e2e8f0', borderRadius: 12,
        fontSize: 14, color: '#0f172a', fontFamily: 'inherit',
        background: disabled ? '#f8fafc' : 'white', outline: 'none',
        cursor: disabled ? 'not-allowed' : 'text',
        opacity: disabled ? 0.6 : 1,
      }}
      onFocus={e => { if (!disabled) e.target.style.borderColor = '#2563eb' }}
      onBlur={e => e.target.style.borderColor = '#e2e8f0'}
    />
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(15,23,42,0.06)', marginBottom: 20 }}>{children}</div>
}
function CardHead({ title, sub }: { title: string; sub: string }) {
  return <div style={{ padding: '20px 24px 0', borderBottom: '1px solid #f1f5f9', paddingBottom: 16, marginBottom: 0 }}><p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{title}</p><p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{sub}</p></div>
}
function CardBody({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>{children}</div>
}

export default function SettingsPage() {
  const [profile,        setProfile]        = useState<any>(null)
  const [fullName,       setFullName]       = useState('')
  const [phone,          setPhone]          = useState('')
  const [email,          setEmail]          = useState('')
  const [newPw,          setNewPw]          = useState('')
  const [confirmPw,      setConfirmPw]      = useState('')
  const [savingProfile,  setSavingProfile]  = useState(false)
  const [savingPw,       setSavingPw]       = useState(false)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(prof)
      setFullName(prof?.full_name ?? '')
      setPhone(prof?.phone ?? '')
      setEmail(user.email ?? '')
    }
    load()
  }, [])

  const saveProfile = async () => {
    if (!fullName.trim()) { toast.error('Name cannot be empty'); return }
    setSavingProfile(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('profiles').update({ full_name: fullName.trim(), phone: phone.trim() || null }).eq('id', user!.id)
    if (error) { toast.error(error.message) } else { toast.success('Profile updated!') }
    setSavingProfile(false)
  }

  const savePassword = async () => {
    if (!newPw) { toast.error('Enter a new password'); return }
    if (newPw.length < 6) { toast.error('Password must be at least 6 characters'); return }
    if (newPw !== confirmPw) { toast.error('Passwords do not match'); return }
    setSavingPw(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPw })
    if (error) { toast.error(error.message) } else { toast.success('Password updated!'); setNewPw(''); setConfirmPw('') }
    setSavingPw(false)
  }

  if (!profile) {
    return (
      <div style={{ maxWidth: 640 }}>
        {[...Array(3)].map((_, i) => <div key={i} style={{ height: 120, background: '#f1f5f9', borderRadius: 16, marginBottom: 20 }} />)}
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <PageHeader title="Account Settings" subtitle="Manage your profile and security settings" />

      {/* Avatar card */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(15,23,42,0.06)', padding: 20, marginBottom: 20 }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 20, fontWeight: 800, flexShrink: 0, background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', boxShadow: '0 4px 16px rgba(37,99,235,0.3)' }}>
          {generateInitials(fullName || profile.full_name)}
        </div>
        <div>
          <p style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>{profile.full_name}</p>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Shield style={{ width: 14, height: 14, color: '#2563eb' }} /> {profile.role}
          </p>
        </div>
      </div>

      {/* Personal info */}
      <Card>
        <CardHead title="Personal Information" sub="Update your name and phone number" />
        <CardBody>
          <Field label="Full Name" required>
            <TextInput value={fullName} onChange={setFullName} placeholder="Your full name" />
          </Field>
          <Field label="Email" hint="Email address cannot be changed">
            <TextInput value={email} disabled />
          </Field>
          <Field label="Phone">
            <TextInput value={phone} onChange={setPhone} placeholder="+27 82 000 0000" type="tel" />
          </Field>
          <div>
            <button
              onClick={saveProfile} disabled={savingProfile}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 40, padding: '0 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: savingProfile ? 0.6 : 1 }}
            >
              <Save style={{ width: 16, height: 16 }} />
              {savingProfile ? 'Saving…' : 'Save Profile'}
            </button>
          </div>
        </CardBody>
      </Card>

      {/* Password */}
      <Card>
        <CardHead title="Change Password" sub="Use a strong, unique password to keep your account secure" />
        <CardBody>
          <Field label="New Password" hint="Must be at least 6 characters">
            <TextInput type="password" value={newPw} onChange={setNewPw} placeholder="Min 6 characters" />
          </Field>
          <Field label="Confirm New Password">
            <TextInput type="password" value={confirmPw} onChange={setConfirmPw} placeholder="Repeat new password" />
          </Field>
          <div>
            <button
              onClick={savePassword} disabled={savingPw}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 40, padding: '0 20px', background: '#1e293b', color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: savingPw ? 0.6 : 1 }}
            >
              <KeyRound style={{ width: 16, height: 16 }} />
              {savingPw ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
