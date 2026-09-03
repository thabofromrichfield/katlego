'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Truck, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react'

type Role = 'user' | 'driver' | 'manager' | 'admin'

const ROLES: { role: Role; emoji: string; label: string; desc: string; ring: string; activeBg: string; activeText: string }[] = [
  { role: 'user',    emoji: '👤', label: 'User',    desc: 'Book & track trips',   ring: '#2563eb', activeBg: '#eff6ff', activeText: '#1d4ed8' },
  { role: 'driver',  emoji: '🚗', label: 'Driver',  desc: 'Handle trip runs',     ring: '#059669', activeBg: '#f0fdf4', activeText: '#047857' },
  { role: 'manager', emoji: '📊', label: 'Manager', desc: 'Manage fleet & trips', ring: '#7c3aed', activeBg: '#f5f3ff', activeText: '#6d28d9' },
  { role: 'admin',   emoji: '⚡', label: 'Admin',   desc: 'Full system access',   ring: '#d97706', activeBg: '#fffbeb', activeText: '#92400e' },
]

const ROLE_PERKS: Record<Role, string[]> = {
  user:    ['Request trips immediately or schedule ahead', 'Track trip status in real time', 'View your complete trip history'],
  driver:  ['See and manage your trip assignments', 'Start & complete trips with one tap', 'Track your stats and performance'],
  manager: ['Full fleet & driver management', 'Approve or reject trip requests', 'Access reports and analytics'],
  admin:   ['Complete system administration', 'Manage users, roles & permissions', 'All manager capabilities included'],
}

function getRoleDestination(role: string): string {
  if (role === 'admin' || role === 'manager') return '/admin'
  if (role === 'driver') return '/driver'
  return '/dashboard'
}

// Consistent plain input — NO icons inside
function PlainInput({ label, required, hint, type = 'text', value, onChange, placeholder, disabled, rightEl }: {
  label?: string; required?: boolean; hint?: string; type?: string
  value: string; onChange?: (v: string) => void; placeholder?: string
  disabled?: boolean; rightEl?: React.ReactNode
}) {
  const base: React.CSSProperties = {
    height: 44, width: '100%', padding: '0 14px', border: '1.5px solid #e2e8f0',
    borderRadius: 12, fontSize: 14, color: '#0f172a', background: disabled ? '#f8fafc' : 'white',
    outline: 'none', boxSizing: 'border-box', paddingRight: rightEl ? 44 : 14,
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && (
        <label style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>
          {label}{required && <span style={{ color: '#e11d48', marginLeft: 2 }}>*</span>}
          {hint && <span style={{ fontWeight: 400, color: '#94a3b8', marginLeft: 6 }}>{hint}</span>}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        <input type={type} value={value} onChange={e => onChange?.(e.target.value)}
          placeholder={placeholder} disabled={disabled} required={required}
          style={base}
          onFocus={e => { if (!disabled) e.target.style.borderColor = '#2563eb' }}
          onBlur={e => { e.target.style.borderColor = '#e2e8f0' }}
        />
        {rightEl && (
          <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
            {rightEl}
          </div>
        )}
      </div>
    </div>
  )
}

export default function RegisterPage() {
  const [role,     setRole]     = useState<Role>('user')
  const [fullName, setFullName] = useState('')
  const [email,    setEmail]    = useState('')
  const [phone,    setPhone]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [done,     setDone]     = useState(false)

  const activeRole = ROLES.find(r => r.role === role)!

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!fullName.trim()) { setError('Please enter your full name.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error: err } = await supabase.auth.signUp({
        email: email.trim(), password,
        options: { data: { full_name: fullName.trim(), role } },
      })
      if (err) { setError(err.message); setLoading(false); return }
      if (data?.session) {
        try {
          await supabase.from('profiles').upsert({ id: data.user!.id, full_name: fullName.trim(), role, phone: phone.trim() || null }, { onConflict: 'id' })
        } catch { /* ignore */ }
        window.location.href = getRoleDestination(role)
        return
      }
      setDone(true)
      setLoading(false)
    } catch (ex: any) {
      setError(ex?.message ?? 'Something went wrong.')
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: 24 }}>
        <div style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, background: '#d1fae5', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <CheckCircle2 style={{ width: 32, height: 32, color: '#059669' }} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>Check your inbox</h1>
          <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, marginBottom: 24 }}>
            We sent a confirmation link to <strong style={{ color: '#0f172a' }}>{email}</strong>.<br />
            Click the link to activate your account.
          </p>
          <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#2563eb', color: 'white', padding: '12px 24px', borderRadius: 12, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
            Back to Sign In <ArrowRight style={{ width: 16, height: 16 }} />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      {/* Left brand panel */}
      <div className="hidden lg:flex" style={{ width: 420, flexShrink: 0, background: 'linear-gradient(160deg,#0f172a 0%,#1e3a6e 50%,#0f172a 100%)', flexDirection: 'column', justifyContent: 'space-between', padding: '48px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, background: 'rgba(37,99,235,0.15)', borderRadius: '50%', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 260, height: 260, background: 'rgba(37,99,235,0.1)', borderRadius: '50%', filter: 'blur(60px)' }} />

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, background: '#2563eb', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(37,99,235,0.4)' }}>
            <Truck style={{ width: 22, height: 22, color: 'white' }} />
          </div>
          <div>
            <p style={{ fontWeight: 800, color: 'white', fontSize: 20, lineHeight: 1.1 }}>Katlego</p>
            <p style={{ fontWeight: 600, color: 'rgba(147,197,253,0.7)', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase' }}>Logistics</p>
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <h2 style={{ fontSize: 36, fontWeight: 900, color: 'white', lineHeight: 1.2, marginBottom: 12 }}>
            Join Katlego<br /><span style={{ color: '#60a5fa' }}>Today.</span>
          </h2>
          <p style={{ color: 'rgba(191,219,254,0.7)', fontSize: 15, lineHeight: 1.7, marginBottom: 28 }}>
            Create your account and start managing logistics smarter.
          </p>
          <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>
              {activeRole.emoji} {activeRole.label} access includes
            </p>
            {ROLE_PERKS[role].map(perk => (
              <div key={perk} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 18, height: 18, background: '#2563eb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                  <span style={{ color: 'white', fontSize: 9, fontWeight: 900 }}>✓</span>
                </div>
                <p style={{ fontSize: 13, color: 'rgba(191,219,254,0.8)', lineHeight: 1.5 }}>{perk}</p>
              </div>
            ))}
          </div>
        </div>
        <p style={{ position: 'relative', fontSize: 12, color: 'rgba(147,197,253,0.4)' }}>© {new Date().getFullYear()} Katlego Logistics</p>
      </div>

      {/* Right form panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 20px', background: '#f8fafc', overflowY: 'auto' }}>
        <div className="lg:hidden" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <div style={{ width: 36, height: 36, background: '#2563eb', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Truck style={{ width: 18, height: 18, color: 'white' }} />
          </div>
          <p style={{ fontWeight: 800, fontSize: 18, color: '#0f172a' }}>Katlego Logistics</p>
        </div>

        <div style={{ width: '100%', maxWidth: 440 }}>
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px', marginBottom: 4 }}>Create account</h1>
            <p style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>Choose your account type and fill in your details.</p>
          </div>

          {/* Role selector */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
            {ROLES.map(r => {
              const active = role === r.role
              return (
                <button key={r.role} type="button" onClick={() => setRole(r.role)}
                  style={{
                    textAlign: 'left', padding: '12px 14px',
                    borderRadius: 14, border: `2px solid ${active ? r.ring : '#e2e8f0'}`,
                    background: active ? r.activeBg : 'white',
                    cursor: 'pointer', transition: 'all 0.15s', position: 'relative',
                    outline: 'none',
                  }}
                >
                  <span style={{ fontSize: 20, display: 'block', marginBottom: 4 }}>{r.emoji}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, display: 'block', color: active ? r.activeText : '#374151' }}>{r.label}</span>
                  <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', lineHeight: 1.4, marginTop: 1 }}>{r.desc}</span>
                  {active && (
                    <div style={{ position: 'absolute', top: 8, right: 8, width: 18, height: 18, background: r.ring, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ color: 'white', fontSize: 9, fontWeight: 900 }}>✓</span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Form card */}
          <div style={{ background: 'white', borderRadius: 20, border: '1px solid #e2e8f0', boxShadow: '0 4px 32px rgba(15,23,42,0.08)', padding: 24 }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <PlainInput label="Full Name" required value={fullName} onChange={setFullName} placeholder="Katlego Mokoena" />
              <PlainInput label="Email" required type="email" value={email} onChange={setEmail} placeholder="you@company.co.za" />
              <PlainInput label="Phone" hint="(optional)" type="tel" value={phone} onChange={setPhone} placeholder="+27 82 000 0000" />
              <PlainInput
                label="Password" required type={showPw ? 'text' : 'password'}
                value={password} onChange={setPassword} placeholder="Min 6 characters"
                rightEl={
                  <button type="button" onClick={() => setShowPw(!showPw)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#94a3b8', display: 'flex' }}>
                    {showPw ? <EyeOff style={{ width: 17, height: 17 }} /> : <Eye style={{ width: 17, height: 17 }} />}
                  </button>
                }
              />
              <PlainInput label="Confirm Password" required type={showPw ? 'text' : 'password'} value={confirm} onChange={setConfirm} placeholder="Repeat password" />

              {error && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 12, padding: '12px 14px' }}>
                  <AlertCircle style={{ width: 16, height: 16, color: '#e11d48', flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontSize: 13, color: '#be123c', fontWeight: 500 }}>{error}</p>
                </div>
              )}

              <button type="submit" disabled={loading} style={{ height: 46, background: loading ? '#93c5fd' : '#2563eb', color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 16px rgba(37,99,235,0.3)', marginTop: 4 }}>
                {loading
                  ? <svg style={{ width: 16, height: 16, animation: 'spin 0.75s linear infinite' }} viewBox="0 0 24 24" fill="none"><circle opacity=".25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path opacity=".75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  : <>Create {activeRole.label} account <ArrowRight style={{ width: 16, height: 16 }} /></>
                }
              </button>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </form>
          </div>

          <p style={{ marginTop: 16, textAlign: 'center', fontSize: 14, color: '#64748b', fontWeight: 500 }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: '#2563eb', fontWeight: 700, textDecoration: 'none' }}>Sign in →</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
