import { NextRequest, NextResponse } from 'next/server'
import { canManageReservations, getAuthUser } from '@/lib/auth'
import { updateReservationSchema } from '@/lib/validations'
import { BookingError, updateBooking } from '@/lib/reservation-booking'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    if (!canManageReservations(getAuthUser(request))) return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 })
    try {
        const validation = updateReservationSchema.pick({ status: true }).safeParse(await request.json())
        if (!validation.success || !validation.data.status) return NextResponse.json({ success: false, error: 'Status inválido' }, { status: 400 })
        const { id } = await params
        const reservation = await updateBooking(id, validation.data)
        return NextResponse.json({ success: true, data: reservation, message: 'Status atualizado com sucesso' })
    } catch (error) {
        return NextResponse.json({ success: false, error: error instanceof BookingError ? error.message : 'Erro ao atualizar status' }, { status: error instanceof BookingError ? error.status : 500 })
    }
}
