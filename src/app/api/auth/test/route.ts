import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'NOT SET'
  const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'NOT SET'

  const result: Record<string, string> = {
    supabase_url: SUPABASE_URL,
    anon_key_preview: ANON_KEY.slice(0, 40) + '...',
    server_time: new Date().toISOString(),
  }

  // Test connection from server
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 6000)
    const res = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
      headers: { apikey: ANON_KEY },
      signal: controller.signal,
    })
    clearTimeout(timer)
    const text = await res.text()
    result.server_to_supabase = `HTTP ${res.status}: ${text.slice(0, 200)}`
  } catch (e: any) {
    result.server_to_supabase = `FAILED: ${e.message}`
  }

  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
