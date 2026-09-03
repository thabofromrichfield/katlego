import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, full_name, role, phone } = body

    if (!email || !password || !full_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    // Sign up via Supabase Auth API
    const signupRes = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
      },
      body: JSON.stringify({
        email,
        password,
        data: { full_name, role: role ?? 'user' },
      }),
    })

    const signupData = await signupRes.json()

    if (!signupRes.ok) {
      return NextResponse.json({ error: signupData.error_description || signupData.msg || 'Signup failed' }, { status: signupRes.status })
    }

    // If user was created and we have a session, also upsert the profile
    if (signupData.user?.id) {
      const token = signupData.access_token ?? ANON_KEY
      await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${token}`,
          'Prefer': 'resolution=merge-duplicates',
        },
        body: JSON.stringify({
          id: signupData.user.id,
          full_name,
          phone: phone || null,
          role: role ?? 'user',
        }),
      })
    }

    return NextResponse.json(signupData)
  } catch (err: any) {
    console.error('Signup proxy error:', err)
    return NextResponse.json(
      { error: `Server could not reach Supabase: ${err.message}. Make sure the app is running on the same network as your Supabase instance.` },
      { status: 502 }
    )
  }
}
