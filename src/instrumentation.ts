/**
 * Next.js instrumentation hook — loads the correct Sentry config per runtime.
 * Only active once a DSN is configured (see sentry.*.config.ts).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}
