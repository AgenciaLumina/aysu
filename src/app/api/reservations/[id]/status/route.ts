// AISSU Beach Lounge - Atualizar Status da Reserva
// PATCH /api/reservations/[id]/status

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { canManageReservations, getAuthUser } from '@/lib/auth'
import { updateReservationSchema } from '@/lib/validations'
import type { ApiResponse } from '@/lib/types'

export async function PATCH(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params
    try {
        const authUser = getAuthUser(request)

        if (!canManageReservations(authUser)) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Não autorizado' },
                { status: 403 }
            )
        }

        const id = params.id
        const body = await request.json()

        // Validação básica do status
        const validation = updateReservationSchema.pick({ status: true }).safeParse(body)

        if (!validation.success) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Status inválido' },
                { status: 400 }
            )
        }

        const { status } = validation.data

        if (!status) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Status é obrigatório' },
                { status: 400 }
            )
        }

        // Verifica se a reserva existe
        const existingReservation = await prisma.reservation.findUnique({
            where: { id },
        })

        if (!existingReservation) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Reserva não encontrada' },
                { status: 404 }
            )
        }

        // Atualiza o status
        const updatedReservation = await prisma.reservation.update({
            where: { id },
            data: { status },
        })

        console.log({
            action: 'RESERVATION_STATUS_UPDATE',
            reservationId: id,
            oldStatus: existingReservation.status,
            newStatus: status,
            userId: authUser?.userId,
        })

        return NextResponse.json<ApiResponse>(
            {
                success: true,
                message: 'Status atualizado com sucesso',
                data: updatedReservation,
            }
        )

    } catch (error) {
        console.error('[Reservation Status Update Error]', error)
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Erro ao atualizar status' },
            { status: 500 }
        )
    }
}
