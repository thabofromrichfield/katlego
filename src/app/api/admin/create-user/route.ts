import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()

    // Verify caller is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: prof } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (prof?.role !== 'admin') return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 })

    const { email, password, full_name, role, phone } = await req.json()
    if (!email || !password || !full_name || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Use signUp with auto-confirm (email confirmation disabled in Supabase settings)
    // The handle_new_user trigger creates the profile automatically
    const { data: newUser, error: signupError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role },
    })

    if (signupError) {
      return NextResponse.json({ error: signupError.message }, { status: 400 })
    }

    // Update profile with correct role and phone (trigger may default to 'user')
    if (newUser?.user) {
      await supabase.from('profiles').update({ role, phone: phone ?? null, full_name }).eq('id', newUser.user.id)
    }

    return NextResponse.json({ success: true, userId: newUser?.user?.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 })
  }
}
