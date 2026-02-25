import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const today = new Date()
        today.setUTCHours(0, 0, 0, 0)

        const [closedDates, blockedConfigs] = await Promise.all([
            prisma.closedDate.findMany({
                where: {
                    date: { gte: today },
                },
                orderBy: { date: 'asc' },
                select: { date: true, reason: true },
            }),
            prisma.reservationDayConfig.findMany({
                where: {
                    date: { gte: today },
                    OR: [
                        { status: 'BLOCKED' },
                        { reservationsEnabled: false },
                    ],
                },
                orderBy: { date: 'asc' },
                select: {
                    date: true,
                    status: true,
                    title: true,
                    release: true,
                },
            }),
        ])

        const map = new Map<string, { date: string; reason: string }>()

        for (const closedDate of closedDates) {
            const date = closedDate.date.toISOString().split('T')[0]
            map.set(date, {
                date,
                reason: closedDate.reason,
            })
        }

        for (const config of blockedConfigs) {
            const date = config.date.toISOString().split('T')[0]
            const reason = config.title?.trim()
                || config.release?.trim()
                || (config.status === 'BLOCKED' ? 'Data indisponível' : 'Reservas indisponíveis')

            map.set(date, {
                date,
                reason,
            })
        }

        const dates = Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date))

        return NextResponse.json({ success: true, data: dates })
    } catch (error) {
        console.error('[Public ClosedDates Error]', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao buscar datas' },
            { status: 500 }
        )
    }
}
