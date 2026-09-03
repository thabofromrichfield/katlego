'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Truck, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (err) { setError(err.message); setLoading(false); return }
    setSent(true)
    setLoading(false)
  }

  const inputCls = `h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900
    placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500
    focus:border-transparent hover:border-slate-300 transition-all`

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '24px' }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
        <div style={{ width: 40, height: 40, background: '#2563eb', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Truck style={{ width: 20, height: 20, color: 'white' }} />
        </div>
        <p style={{ fontWeight: 800, fontSize: 18, color: '#0f172a' }}>Katlego Logistics</p>
      </div>

      <div style={{ width: '100%', maxWidth: 420 }}>
        {sent ? (
          <div style={{ background: 'white', borderRadius: 20, border: '1px solid #e2e8f0', boxShadow: '0 4px 32px rgba(15,23,42,0.08)', padding: 32, textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, background: '#d1fae5', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircle2 style={{ width: 28, height: 28, color: '#059669' }} />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>Check your email</h1>
            <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, marginBottom: 24 }}>
              We sent a reset link to <strong style={{ color: '#0f172a' }}>{email}</strong>.<br />
              Click the link to set a new password.
            </p>
            <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#2563eb', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
              <ArrowLeft style={{ width: 16, height: 16 }} /> Back to Sign In
            </Link>
          </div>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px', marginBottom: 6 }}>Reset password</h1>
              <p style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>Enter your email and we&apos;ll send a reset link.</p>
            </div>

            <div style={{ background: 'white', borderRadius: 20, border: '1px solid #e2e8f0', boxShadow: '0 4px 32px rgba(15,23,42,0.08)', padding: 32 }}>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 14, fontWeight: 700, color: '#374151' }}>Email address</label>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@company.co.za" required autoComplete="email"
                    style={{ height: 46, width: '100%', padding: '0 14px', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: 15, color: '#0f172a', background: 'white', outline: 'none', boxSizing: 'border-box' }}
                    onFocus={e => e.target.style.borderColor = '#2563eb'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>

                {error && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 12, padding: '12px 14px' }}>
                    <AlertCircle style={{ width: 16, height: 16, color: '#e11d48', flexShrink: 0, marginTop: 1 }} />
                    <p style={{ fontSize: 14, color: '#be123c', fontWeight: 500 }}>{error}</p>
                  </div>
                )}

                <button type="submit" disabled={loading}
                  style={{ height: 48, background: loading ? '#93c5fd' : '#2563eb', color: 'white', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 16px rgba(37,99,235,0.3)' }}>
                  {loading
                    ? <svg style={{ width: 18, height: 18, animation: 'spin 0.75s linear infinite' }} viewBox="0 0 24 24" fill="none"><circle opacity=".25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path opacity=".75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    : <>Send reset link <ArrowRight style={{ width: 18, height: 18 }} /></>}
                </button>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </form>
            </div>

            <div style={{ marginTop: 20, textAlign: 'center' }}>
              <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#2563eb', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
                <ArrowLeft style={{ width: 16, height: 16 }} /> Back to Sign In
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
