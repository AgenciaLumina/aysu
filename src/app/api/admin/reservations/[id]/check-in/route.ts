import { NextRequest, NextResponse } from 'next/server'
import { canManageReservations, getAuthUser } from '@/lib/auth'
import { BookingError, updateBooking } from '@/lib/reservation-booking'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    if (!canManageReservations(getAuthUser(request))) return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 })
    try {
        const { id } = await params
        const reservation = await updateBooking(id, { status: 'CHECKED_IN' })
        return NextResponse.json({ success: true, message: 'Check-in realizado com sucesso', data: { id: reservation.id, status: reservation.status } })
    } catch (error) {
        return NextResponse.json({ success: false, error: error instanceof BookingError ? error.message : 'Erro ao realizar check-in' }, { status: error instanceof BookingError ? error.status : 500 })
    }
}
