import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()

    // Verify caller is manager or admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: prof } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!prof || !['manager', 'admin'].includes(prof.role)) {
      return NextResponse.json({ error: 'Forbidden — manager/admin only' }, { status: 403 })
    }

    const { email, password, full_name, phone, license_number, license_class, license_expiry } = await req.json()
    if (!email || !password || !full_name) {
      return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 })
    }

    // Create auth user
    const { data: newUser, error: signupError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role: 'driver' },
    })
    if (signupError) return NextResponse.json({ error: signupError.message }, { status: 400 })

    const userId = newUser?.user?.id
    if (!userId) return NextResponse.json({ error: 'User creation failed' }, { status: 500 })

    // Update profile to driver role
    await supabase.from('profiles').update({ role: 'driver', phone: phone ?? null, full_name }).eq('id', userId)

    // Create driver record
    const { data: driver, error: driverErr } = await supabase.from('drivers').insert({
      profile_id: userId,
      license_number: license_number ?? `DRV-${Date.now()}`,
      license_class: license_class ?? 'code_8',
      license_expiry: license_expiry ?? null,
      status: 'off_duty',
    }).select('id').single()

    if (driverErr) return NextResponse.json({ error: driverErr.message }, { status: 400 })

    // Auto-assign driver to this manager's team
    if (prof.role === 'manager' && driver?.id) {
      await supabase.from('manager_drivers').insert({
        manager_id: user.id,
        driver_id: driver.id,
        assigned_by: user.id,
      })
    }

    return NextResponse.json({ success: true, driverId: driver?.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 })
  }
}
