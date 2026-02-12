// API: Cancel Reservation
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { canManageReservations, getAuthUser } from '@/lib/auth'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authUser = getAuthUser(request)
        if (!canManageReservations(authUser)) {
            return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 })
        }

        const { id: reservationId } = await params
        const body = await request.json()
        const { reason } = body

        // Check if reservation exists
        const reservation = await prisma.reservation.findUnique({
            where: { id: reservationId },
            include: {
                payment: true,
            },
        })

        if (!reservation) {
            return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
        }

        // Check if already cancelled or completed
        if (reservation.status === 'CANCELLED') {
            return NextResponse.json(
                { error: 'Reservation already cancelled' },
                { status: 400 }
            )
        }

        if (reservation.status === 'COMPLETED') {
            return NextResponse.json(
                { error: 'Cannot cancel completed reservation' },
                { status: 400 }
            )
        }

        // Update to CANCELLED
        const updated = await prisma.reservation.update({
            where: { id: reservationId },
            data: {
                status: 'CANCELLED',
                notes: reason ? `Cancelado: ${reason}` : reservation.notes,
                updatedAt: new Date(),
            },
        })

        // TODO: Handle payment refund if needed
        // This would integrate with payment gateway

        return NextResponse.json({
            success: true,
            message: 'Reserva cancelada com sucesso',
            data: {
                id: updated.id,
                status: updated.status,
            },
        })
    } catch (error) {
        console.error('Error cancelling reservation:', error)
        return NextResponse.json(
            { error: 'Failed to cancel reservation' },
            { status: 500 }
        )
    }
}
