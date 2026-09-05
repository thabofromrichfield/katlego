import * as Sentry from '@sentry/nextjs'

/**
 * Sentry client config (browser).
 * Initialises only when a DSN is present so `npm run dev` keeps working
 * before the Katlego Sentry project exists. Add your DSN to `.env.local`:
 *   NEXT_PUBLIC_SENTRY_DSN=https://<key>@<org>.ingest.sentry.io/<project>
 */
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_APP_ENV ?? process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
    // Profiling / replay can be enabled later via integrations.
  })
}
