// API: Check-in Reservation
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

        // Check if reservation exists
        const reservation = await prisma.reservation.findUnique({
            where: { id: reservationId },
        })

        if (!reservation) {
            return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
        }

        // Check if already checked in
        if (reservation.status === 'CHECKED_IN' || reservation.status === 'IN_PROGRESS') {
            return NextResponse.json(
                { error: 'Reservation already checked in' },
                { status: 400 }
            )
        }

        // Update to CHECKED_IN
        const updated = await prisma.reservation.update({
            where: { id: reservationId },
            data: {
                status: 'CHECKED_IN',
                updatedAt: new Date(),
            },
        })

        return NextResponse.json({
            success: true,
            message: 'Check-in realizado com sucesso',
            data: {
                id: updated.id,
                status: updated.status,
            },
        })
    } catch (error) {
        console.error('Error during check-in:', error)
        return NextResponse.json(
            { error: 'Failed to check-in reservation' },
            { status: 500 }
        )
    }
}
