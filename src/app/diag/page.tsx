'use client'
import { useEffect, useState } from 'react'

export default function DiagPage() {
  const [info, setInfo] = useState<Record<string, string>>({ status: 'loading...' })

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'NOT SET'
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'NOT SET'

    setInfo({
      js_working: 'YES',
      supabase_url: url,
      anon_key_first30: key.slice(0, 30) + '...',
      browser_origin: window.location.origin,
      health_check: 'fetching...',
    })

    fetch(`${url}/auth/v1/health`, {
      headers: { apikey: key, 'Content-Type': 'application/json' },
      mode: 'cors',
    })
      .then(async r => {
        const text = await r.text()
        setInfo(p => ({ ...p, health_check: `HTTP ${r.status}: ${text.slice(0, 200)}` }))
      })
      .catch(err => {
        setInfo(p => ({ ...p, health_check: `FETCH ERROR: ${err.message}` }))
      })

    // Test signup endpoint (will fail but shows us the real error)
    fetch(`${url}/auth/v1/signup`, {
      method: 'POST',
      headers: { apikey: key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'diagtest@test.com', password: 'test1234' }),
      mode: 'cors',
    })
      .then(async r => {
        const text = await r.text()
        setInfo(p => ({ ...p, signup_test: `HTTP ${r.status}: ${text.slice(0, 300)}` }))
      })
      .catch(err => {
        setInfo(p => ({ ...p, signup_test: `FETCH ERROR: ${err.message}` }))
      })
  }, [])

  return (
    <div style={{ padding: 24, fontFamily: 'monospace', fontSize: 13, background: '#0f172a', color: '#94a3b8', minHeight: '100vh' }}>
      <h2 style={{ color: '#38bdf8', marginBottom: 16 }}>🔍 Supabase Connection Diagnostic</h2>
      {Object.entries(info).map(([k, v]) => (
        <div key={k} style={{ marginBottom: 12, borderBottom: '1px solid #1e293b', paddingBottom: 10 }}>
          <div style={{ color: '#f8fafc', fontWeight: 'bold' }}>{k}:</div>
          <div style={{ color: v.includes('ERROR') || v.includes('NOT SET') ? '#f87171' : v.includes('YES') || v.includes('HTTP 2') ? '#4ade80' : '#fbbf24', marginTop: 4, wordBreak: 'break-all' }}>
            {v}
          </div>
        </div>
      ))}
    </div>
  )
}
