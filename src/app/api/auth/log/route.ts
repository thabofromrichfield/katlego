import { NextRequest, NextResponse } from 'next/server'
import { appendFileSync, mkdirSync } from 'fs'
import { join } from 'path'

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json()
    const logDir = join(process.cwd(), 'logs')
    mkdirSync(logDir, { recursive: true })
    const logFile = join(logDir, 'auth.log')
    const line = `[${new Date().toISOString()}] ${message}\n`
    appendFileSync(logFile, line)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}

export async function GET() {
  try {
    const { readFileSync } = await import('fs')
    const logFile = join(process.cwd(), 'logs', 'auth.log')
    const content = readFileSync(logFile, 'utf-8')
    return new NextResponse(content, {
      headers: { 'Content-Type': 'text/plain' },
    })
  } catch {
    return new NextResponse('No logs yet.', {
      headers: { 'Content-Type': 'text/plain' },
    })
  }
}
