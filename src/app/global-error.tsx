'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

/* Top-level error boundary (App Router) — reports to Sentry when a DSN is
   configured, then shows a minimal recovery screen. */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', background: '#f8fafc', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', maxWidth: 420, padding: 24 }}>
          <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#f07000', marginBottom: 8 }}>
            Katlego Logistics
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>Something went wrong</h1>
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.55 }}>
            An unexpected error occurred. The team has been notified — try reloading the page.
          </p>
          {error.digest && (
            <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 10, fontFamily: 'monospace' }}>
              digest: {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{ marginTop: 18, padding: '10px 20px', border: 'none', borderRadius: 10, background: '#203040', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
          >
            Reload page
          </button>
        </div>
      </body>
    </html>
  )
}
