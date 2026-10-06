import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export const dynamic = 'force-dynamic'

// Coolify probes this route before sending traffic to the application.
export async function GET() {
    try {
        await prisma.$queryRaw`SELECT 1`
        return NextResponse.json({ status: 'ok', database: 'ok' }, { headers: { 'Cache-Control': 'no-store' } })
    } catch {
        return NextResponse.json({ status: 'error', database: 'unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
    }
}
