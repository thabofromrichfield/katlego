'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Truck, ArrowRight, AlertCircle } from 'lucide-react'

async function writeLog(message: string) {
  try {
    await fetch('/api/auth/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    })
  } catch { /* silent */ }
}

function getRoleDestination(role: string): string {
  if (role === 'admin' || role === 'manager') return '/admin'
  if (role === 'driver') return '/driver'
  return '/dashboard'
}

export default function LoginPage() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    await writeLog(`--- LOGIN ATTEMPT: ${email} ---`)

    try {
      const supabase = createClient()
      const { data, error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password })

      if (err) {
        await writeLog(`AUTH ERROR: ${err.message}`)
        if (err.message.includes('Email not confirmed')) {
          setError('Email not confirmed. Ask your admin to run the confirmation SQL fix.')
        } else if (err.message.includes('Invalid login') || err.message.includes('invalid_credentials')) {
          setError('Incorrect email or password.')
        } else {
          setError(err.message)
        }
        setLoading(false)
        return
      }

      if (!data?.user) { setError('Sign in failed. Please try again.'); setLoading(false); return }

      await writeLog(`Auth OK: ${data.user.id}`)

      const { data: rpcRole, error: rpcErr } = await supabase.rpc('get_my_role')
      if (!rpcErr && rpcRole) { window.location.href = getRoleDestination(rpcRole); return }

      const { data: profile, error: profErr } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
      if (!profErr && profile?.role) { window.location.href = getRoleDestination(profile.role); return }

      window.location.href = getRoleDestination(data.user.user_metadata?.role ?? 'user')
    } catch (ex: any) {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>

      {/* ── Left brand panel ── */}
      <div style={{
        width: 480, minWidth: 480, flexShrink: 0,
        background: 'linear-gradient(160deg, #0f172a 0%, #1e3a6e 50%, #0f172a 100%)',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '48px 48px',
        position: 'relative', overflow: 'hidden',
      }} className="hidden lg:flex">
        {/* Glow orbs */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, background: 'rgba(37,99,235,0.15)', borderRadius: '50%', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 280, height: 280, background: 'rgba(37,99,235,0.12)', borderRadius: '50%', filter: 'blur(60px)' }} />

        {/* Logo */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, background: '#2563eb', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(37,99,235,0.4)' }}>
            <Truck style={{ width: 22, height: 22, color: 'white' }} />
          </div>
          <div>
            <p style={{ fontWeight: 800, color: 'white', fontSize: 20, lineHeight: 1.1, letterSpacing: '-0.3px' }}>Katlego</p>
            <p style={{ fontWeight: 600, color: 'rgba(147,197,253,0.7)', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase' }}>Logistics</p>
          </div>
        </div>

        {/* Hero */}
        <div style={{ position: 'relative' }}>
          <h2 style={{ fontSize: 44, fontWeight: 900, color: 'white', lineHeight: 1.15, letterSpacing: '-1px', marginBottom: 16 }}>
            Moving South Africa<br />
            <span style={{ color: '#60a5fa' }}>Forward.</span>
          </h2>
          <p style={{ color: 'rgba(191,219,254,0.75)', fontSize: 17, lineHeight: 1.65, marginBottom: 36, maxWidth: 340 }}>
            Professional fleet, driver & trip management — all in one place.
          </p>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {[{ label: 'Trips Managed', value: '10k+' }, { label: 'Fleet Vehicles', value: '500+' }, { label: 'Active Drivers', value: '200+' }].map(s => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '16px 12px' }}>
                <p style={{ fontSize: 26, fontWeight: 900, color: 'white', lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(147,197,253,0.7)', marginTop: 4, lineHeight: 1.3 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p style={{ position: 'relative', fontSize: 12, color: 'rgba(147,197,253,0.4)', fontWeight: 500 }}>
          © {new Date().getFullYear()} Katlego Logistics · Johannesburg, ZA
        </p>
      </div>

      {/* ── Right form panel ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', background: '#f8fafc', overflowY: 'auto' }}>

        {/* Mobile logo */}
        <div className="lg:hidden" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36 }}>
          <div style={{ width: 38, height: 38, background: '#2563eb', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Truck style={{ width: 20, height: 20, color: 'white' }} />
          </div>
          <p style={{ fontWeight: 800, fontSize: 20, color: '#0f172a' }}>Katlego Logistics</p>
        </div>

        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 30, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px', marginBottom: 6 }}>Welcome back</h1>
            <p style={{ fontSize: 15, color: '#64748b', fontWeight: 500 }}>Sign in to your account to continue.</p>
          </div>

          {/* Form card */}
          <div style={{ background: 'white', borderRadius: 20, border: '1px solid #e2e8f0', boxShadow: '0 4px 32px rgba(15,23,42,0.08)', padding: 32 }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Email */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 14, fontWeight: 700, color: '#374151' }}>Email address</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.co.za" required autoComplete="email"
                  style={{
                    height: 46, width: '100%', padding: '0 14px',
                    border: '1.5px solid #e2e8f0', borderRadius: 12,
                    fontSize: 15, color: '#0f172a', background: 'white',
                    outline: 'none', transition: 'border-color 0.15s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => e.target.style.borderColor = '#2563eb'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>

              {/* Password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: 14, fontWeight: 700, color: '#374151' }}>Password</label>
                  <Link href="/forgot-password" style={{ fontSize: 13, color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>
                    Forgot password?
                  </Link>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" required autoComplete="current-password"
                    style={{
                      height: 46, width: '100%', padding: '0 44px 0 14px',
                      border: '1.5px solid #e2e8f0', borderRadius: 12,
                      fontSize: 15, color: '#0f172a', background: 'white',
                      outline: 'none', transition: 'border-color 0.15s',
                      boxSizing: 'border-box',
                    }}
                    onFocus={e => e.target.style.borderColor = '#2563eb'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} tabIndex={-1}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#94a3b8' }}>
                    {showPw ? <EyeOff style={{ width: 18, height: 18 }} /> : <Eye style={{ width: 18, height: 18 }} />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 12, padding: '12px 14px' }}>
                  <AlertCircle style={{ width: 16, height: 16, color: '#e11d48', flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontSize: 14, color: '#be123c', fontWeight: 500 }}>{error}</p>
                </div>
              )}

              {/* Submit */}
              <button type="submit" disabled={loading}
                style={{
                  height: 48, width: '100%', background: loading ? '#93c5fd' : '#2563eb',
                  color: 'white', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: '0 4px 16px rgba(37,99,235,0.3)', transition: 'background 0.15s',
                }}
                onMouseEnter={e => !loading && ((e.target as any).style.background = '#1d4ed8')}
                onMouseLeave={e => !loading && ((e.target as any).style.background = '#2563eb')}
              >
                {loading ? (
                  <>
                    <svg style={{ width: 18, height: 18, animation: 'spin 0.75s linear infinite' }} viewBox="0 0 24 24" fill="none">
                      <circle opacity=".25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path opacity=".75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Signing in…
                  </>
                ) : (
                  <>Sign in <ArrowRight style={{ width: 18, height: 18 }} /></>
                )}
              </button>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </form>
          </div>

          <p style={{ marginTop: 24, textAlign: 'center', fontSize: 14, color: '#64748b', fontWeight: 500 }}>
            Don&apos;t have an account?{' '}
            <Link href="/register" style={{ color: '#2563eb', fontWeight: 700, textDecoration: 'none' }}>
              Create one →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
