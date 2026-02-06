import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const closedDates = await prisma.closedDate.findMany({
            where: {
                date: { gte: new Date() },
            },
            orderBy: { date: 'asc' },
            select: { date: true, reason: true },
        })

        const dates = closedDates.map(cd => ({
            date: cd.date.toISOString().split('T')[0],
            reason: cd.reason,
        }))

        return NextResponse.json({ success: true, data: dates })
    } catch (error) {
        console.error('[Public ClosedDates Error]', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao buscar datas' },
            { status: 500 }
        )
    }
}
