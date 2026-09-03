import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing email or password' }, { status: 400 })
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
      },
      body: JSON.stringify({ email, password }),
    })

    const data = await res.json()

    if (!res.ok) {
      const msg = data.error_description || data.msg || data.error || 'Login failed'
      return NextResponse.json({ error: msg }, { status: res.status })
    }

    // Fetch profile to get role
    let role = 'user'
    if (data.user?.id) {
      const profileRes = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?id=eq.${data.user.id}&select=role&limit=1`,
        {
          headers: {
            'apikey': ANON_KEY,
            'Authorization': `Bearer ${data.access_token}`,
          },
        }
      )
      if (profileRes.ok) {
        const profiles = await profileRes.json()
        role = profiles[0]?.role ?? 'user'
      }
    }

    return NextResponse.json({ ...data, profile_role: role })
  } catch (err: any) {
    console.error('Login proxy error:', err)
    return NextResponse.json(
      { error: `Server could not reach Supabase: ${err.message}` },
      { status: 502 }
    )
  }
}
