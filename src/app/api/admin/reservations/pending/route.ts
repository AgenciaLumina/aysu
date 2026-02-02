import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
    try {
        const pending = await prisma.reservation.findMany({
            where: { status: 'PENDING' },
            include: {
                cabin: { select: { name: true } },
            },
            orderBy: { createdAt: 'desc' },
        })

        const formatted = pending.map(r => ({
            id: r.id,
            customerName: r.customerName,
            customerPhone: r.customerPhone,
            spaceName: r.cabin.name,
            date: r.checkIn.toISOString().split('T')[0],
            totalPrice: Number(r.totalPrice),
            createdAt: r.createdAt.toISOString(),
        }))

        return NextResponse.json({ success: true, data: formatted, count: formatted.length })
    } catch (error) {
        console.error('[Pending Reservations Error]', error)
        return NextResponse.json({ success: false, error: 'Erro' }, { status: 500 })
    }
}
