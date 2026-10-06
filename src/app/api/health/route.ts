import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Preserve the existing liveness response used by Coolify and monitoring.
export async function GET() {
    return NextResponse.json({ status: 'ok', service: 'aysu-web', timestamp: new Date().toISOString() }, { headers: { 'Cache-Control': 'no-store' } })
}
