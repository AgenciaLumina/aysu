// AISSU Beach Lounge - Reservation Detail API
// GET/PATCH/DELETE /api/reservations/[id]

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { canManageReservations, getAuthUser } from '@/lib/auth'
import { updateReservationSchema } from '@/lib/validations'
import type { ApiResponse, ReservationWithDetails } from '@/lib/types'
import { ReservationStatus } from '@prisma/client'
import { BookingError, updateBooking } from '@/lib/reservation-booking'

interface RouteParams {
    params: Promise<{ id: string }>
}

const ENSURE_CABIN_VISIBILITY_ENUM_SQL = `
DO $$ BEGIN
  CREATE TYPE "CabinVisibilityStatus" AS ENUM ('AVAILABLE', 'UNAVAILABLE', 'HIDDEN');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
`

const ENSURE_CABIN_VISIBILITY_COLUMN_SQL = `
ALTER TABLE "Cabin"
  ADD COLUMN IF NOT EXISTS "visibilityStatus" "CabinVisibilityStatus" NOT NULL DEFAULT 'AVAILABLE';
`

const ENSURE_CABIN_VISIBILITY_INDEX_SQL = `CREATE INDEX IF NOT EXISTS "Cabin_visibilityStatus_idx" ON "Cabin"("visibilityStatus");`

async function ensureCabinVisibilityStatusColumn() {
    await prisma.$executeRawUnsafe(ENSURE_CABIN_VISIBILITY_ENUM_SQL)
    await prisma.$executeRawUnsafe(ENSURE_CABIN_VISIBILITY_COLUMN_SQL)
    await prisma.$executeRawUnsafe(ENSURE_CABIN_VISIBILITY_INDEX_SQL)
}

// GET - Detalhes da reserva
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        await ensureCabinVisibilityStatusColumn()
        const { id } = await params
        const authUser = getAuthUser(request)

        if (!authUser) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Não autorizado' },
                { status: 401 }
            )
        }

        const reservation = await prisma.reservation.findUnique({
            where: { id },
            include: {
                cabin: true,
                payment: true,
                pdvOrders: {
                    include: {
                        items: {
                            include: {
                                menuItem: true,
                            },
                        },
                    },
                },
            },
        })

        if (!reservation) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Reserva não encontrada' },
                { status: 404 }
            )
        }

        return NextResponse.json<ApiResponse<ReservationWithDetails>>({
            success: true,
            data: reservation as ReservationWithDetails,
        })
    } catch (error) {
        console.error('[Reservation GET Error]', error)
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Erro ao buscar reserva' },
            { status: 500 }
        )
    }
}

// PATCH - Dates, status and inventory share the same transactional category lock.
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    if (!canManageReservations(getAuthUser(request))) return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 })
    try {
        const validation = updateReservationSchema.safeParse(await request.json())
        if (!validation.success) return NextResponse.json({ success: false, error: validation.error.issues[0].message }, { status: 400 })
        const { id } = await params
        const reservation = await updateBooking(id, validation.data)
        return NextResponse.json({ success: true, data: reservation, message: 'Reserva atualizada com sucesso' })
    } catch (error) {
        return NextResponse.json({ success: false, error: error instanceof BookingError ? error.message : 'Erro ao atualizar reserva' }, { status: error instanceof BookingError ? error.status : 500 })
    }
}

// DELETE - Cancela reserva (soft delete)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        await ensureCabinVisibilityStatusColumn()
        const { id } = await params
        const authUser = getAuthUser(request)

        if (!authUser || !canManageReservations(authUser)) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Acesso negado' },
                { status: 403 }
            )
        }

        // Verifica se reserva existe
        const existingReservation = await prisma.reservation.findUnique({
            where: { id },
        })

        if (!existingReservation) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Reserva não encontrada' },
                { status: 404 }
            )
        }

        // Soft delete: muda status para CANCELLED
        await updateBooking(id, { status: ReservationStatus.CANCELLED })

        console.log({
            action: 'RESERVATION_CANCELLED',
            timestamp: new Date().toISOString(),
            reservationId: id,
            userId: authUser.userId,
        })

        return NextResponse.json<ApiResponse>({
            success: true,
            message: 'Reserva cancelada com sucesso',
        })
    } catch (error) {
        console.error('[Reservation DELETE Error]', error)
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Erro ao cancelar reserva' },
            { status: 500 }
        )
    }
}
