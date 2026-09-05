import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const url = request.nextUrl.clone()
  const pathname = url.pathname

  // Public paths that never need auth
  // TEMP (Sentry verification): sentry-example routes are allowlisted so the
  // wizard's test-error flow works without a session. Remove once verified.
  const publicPaths = ['/login', '/register', '/forgot-password', '/diag', '/api/auth', '/sentry-example-page', '/api/sentry-example-api']
  const isPublicPath = publicPaths.some((p) => pathname.startsWith(p))

  // Always allow public paths and static assets
  if (isPublicPath) {
    return supabaseResponse
  }

  // Try to get the user — wrap in try/catch so a network failure
  // (e.g. Supabase unreachable from server) doesn't block the browser.
  let user = null
  let role: string = 'user'
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      role = profile?.role ?? 'user'
    }
  } catch {
    // Network error reaching Supabase from server — let the browser handle it
    return supabaseResponse
  }

  // Not logged in → redirect to login
  if (!user) {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Admin/Manager guard
    if (pathname.startsWith('/admin') && !['admin', 'manager'].includes(role)) {
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

    if (pathname.startsWith('/driver') && role !== 'driver' && !['admin', 'manager'].includes(role)) {
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

  return supabaseResponse
}

export const config = {
  matcher: [
    // monitoring is excluded so Sentry's client tunnel route can forward
    // error envelopes to Sentry without auth (see withSentryConfig tunnelRoute).
    '/((?!monitoring|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
