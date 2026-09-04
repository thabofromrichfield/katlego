import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/reports/trip-history?days=14
 * Returns trips grouped by day (UTC) over the last N days, plus the previous
 * N-day window for week-over-week trend comparison.
 *
 * Output:
 * {
 *   series: [{ date: 'YYYY-MM-DD', count: number, completed: number }],
 *   prevWindow: number,   // total trips in previous N days
 *   currWindow: number,   // total trips in last N days
 * }
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const days = Math.min(90, Math.max(2, Number(searchParams.get('days') ?? 14)))

  try {
    const supabase = await createClient()

    // Resolve the caller's role via RPC so RLS lets admins see all trips
    const { data: role } = await supabase.rpc('get_my_role')
    if (!['admin', 'manager'].includes(role ?? '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const today = new Date()
    const start = new Date(today)
    start.setUTCHours(0, 0, 0, 0)
    start.setUTCDate(start.getUTCDate() - (days - 1)) // inclusive last N days

    const prevStart = new Date(start)
    prevStart.setUTCDate(prevStart.getUTCDate() - days)

    const { data: trips, error } = await supabase
      .from('trips')
      .select('created_at, status')
      .gte('created_at', prevStart.toISOString())
      .lt('created_at', today.toISOString())
      .order('created_at', { ascending: true })
    // .from/.select are typed against the stale hand-written Database types;
    // cast rows so this route type-checks until supabase gen types is run.
    const rows = (trips ?? []) as unknown as { created_at: string; status: string }[]

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const dayKey = (d: Date) => d.toISOString().slice(0, 10)
    const map = new Map<string, { date: string; count: number; completed: number }>()
    // seed the full current window so empty days render as 0
    for (let i = 0; i < days; i++) {
      const d = new Date(start)
      d.setUTCDate(start.getUTCDate() + i)
      map.set(dayKey(d), { date: dayKey(d), count: 0, completed: 0 })
    }

    let prevWindow = 0
    let currWindow = 0
    for (const t of rows) {
      const ts = new Date(t.created_at)
      const key = dayKey(ts)
      if (key < dayKey(start)) { prevWindow++; continue }
      const rec = map.get(key)
      if (rec) {
        rec.count++
        if (t.status === 'completed') rec.completed++
        currWindow++
      }
    }

    return NextResponse.json({
      series: [...map.values()],
      prevWindow,
      currWindow,
      generatedAt: today.toISOString(),
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error'
    console.error('trip-history error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
