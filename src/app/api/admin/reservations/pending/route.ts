import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { canManageReservations, getAuthUser } from '@/lib/auth'
import { dateKeyInSaoPaulo } from '@/lib/reservation-booking'

export const dynamic = 'force-dynamic'

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' }

export async function GET(request: NextRequest) {
    try {
        const authUser = getAuthUser(request)
        if (!canManageReservations(authUser)) {
            return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403, headers: NO_STORE_HEADERS })
        }

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
            date: dateKeyInSaoPaulo(r.checkIn),
            totalPrice: Number(r.totalPrice),
            createdAt: r.createdAt.toISOString(),
            notes: r.notes,
        }))

        return NextResponse.json({ success: true, data: formatted, count: formatted.length }, { headers: NO_STORE_HEADERS })
    } catch (error) {
        console.error('[Pending Reservations Error]', error)
        return NextResponse.json({ success: false, error: 'Erro' }, { status: 500, headers: NO_STORE_HEADERS })
    }
}
