import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { canManageReservations, getAuthUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const authUser = getAuthUser(request)
        if (!canManageReservations(authUser)) {
            return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 })
        }

        const pending = await prisma.reservation.findMany({
            where: {
                OR: [
                    { status: 'PENDING' },
                    {
                        source: 'ONLINE',
                        status: 'CONFIRMED',
                        payment: {
                            is: null,
                        },
                    },
                ],
            },
            include: {
                cabin: { select: { name: true } },
                payment: { select: { id: true, status: true } },
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
            notes: r.notes,
            status: r.status,
            source: r.source,
            reviewReason:
                r.status === 'CONFIRMED' && !r.payment
                    ? 'Reserva online confirmada sem pagamento vinculado'
                    : 'Reserva aguardando aprovacao',
        }))

        return NextResponse.json({ success: true, data: formatted, count: formatted.length })
    } catch (error) {
        console.error('[Pending Reservations Error]', error)
        return NextResponse.json({ success: false, error: 'Erro' }, { status: 500 })
    }
}
