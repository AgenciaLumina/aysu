import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
    let dbStatus = 'ok'
    try {
        await prisma.$queryRaw`SELECT 1`
    } catch (e: any) {
        dbStatus = `error: ${e?.message || 'unknown'}`
    }
    return NextResponse.json(
        { status: 'ok', service: 'aysu-web', database: dbStatus, timestamp: new Date().toISOString() },
        { headers: { 'Cache-Control': 'no-store' } }
    )
}
