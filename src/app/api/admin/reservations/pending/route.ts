import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

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
            date: (() => {
                const d = new Date(r.checkIn)
                const year = d.getFullYear()
                const month = String(d.getMonth() + 1).padStart(2, '0')
                const day = String(d.getDate()).padStart(2, '0')
                return `${year}-${month}-${day}`
            })(),
            totalPrice: Number(r.totalPrice),
            createdAt: r.createdAt.toISOString(),
        }))

        return NextResponse.json({ success: true, data: formatted, count: formatted.length })
    } catch (error) {
        console.error('[Pending Reservations Error]', error)
        return NextResponse.json({ success: false, error: 'Erro' }, { status: 500 })
    }
}
