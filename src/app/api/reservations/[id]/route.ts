// AISSU Beach Lounge - Reservation Detail API
// GET/PATCH/DELETE /api/reservations/[id]

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { canManageReservations, getAuthUser } from '@/lib/auth'
import { updateReservationSchema } from '@/lib/validations'
import type { ApiResponse, ReservationWithDetails } from '@/lib/types'
import { Prisma, ReservationStatus } from '@prisma/client'
import { getActiveReservationFilter } from '@/lib/reservation-hold'
import { getSpacePrefix, resolveCabinSlug, type SpaceSlug } from '@/lib/space-slugs'

interface RouteParams {
    params: Promise<{ id: string }>
}

function buildSlugCabinWhere(slug: SpaceSlug): Prisma.CabinWhereInput {
    const prefix = getSpacePrefix(slug)
    return {
        OR: [
            { slug },
            { slug: null, name: { startsWith: prefix } },
        ],
    }
}

async function getActiveUnitsForSlug(slug: SpaceSlug): Promise<number> {
    const cabins = await prisma.cabin.findMany({
        where: {
            isActive: true,
            ...buildSlugCabinWhere(slug),
        },
        select: { units: true },
    })

    return cabins.reduce((sum, cabin) => sum + Math.max(1, cabin.units || 1), 0)
}

async function countConflictsForSlug(
    slug: SpaceSlug,
    checkIn: Date,
    checkOut: Date,
    excludeReservationId: string,
): Promise<number> {
    const activeReservationFilter = getActiveReservationFilter()

    const reservations = await prisma.reservation.findMany({
        where: {
            id: { not: excludeReservationId },
            AND: [
                activeReservationFilter,
                {
                    OR: [
                        { AND: [{ checkIn: { lte: checkIn } }, { checkOut: { gt: checkIn } }] },
                        { AND: [{ checkIn: { lt: checkOut } }, { checkOut: { gte: checkOut } }] },
                        { AND: [{ checkIn: { gte: checkIn } }, { checkOut: { lte: checkOut } }] },
                    ],
                },
            ],
        },
        include: {
            cabin: {
                select: {
                    name: true,
                    slug: true,
                },
            },
        },
    })

    return reservations.filter((reservation) => resolveCabinSlug(reservation.cabin) === slug).length
}

// GET - Detalhes da reserva
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
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

// PATCH - Atualiza reserva
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const authUser = getAuthUser(request)

        if (!authUser || !canManageReservations(authUser)) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Acesso negado' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const validation = updateReservationSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: validation.error.issues[0].message },
                { status: 400 }
            )
        }

        // Verifica se reserva existe
        const existingReservation = await prisma.reservation.findUnique({
            where: { id },
            include: {
                cabin: {
                    select: {
                        name: true,
                        slug: true,
                        units: true,
                    },
                },
            },
        })

        if (!existingReservation) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Reserva não encontrada' },
                { status: 404 }
            )
        }

        // Se houver alteração de datas, verificar disponibilidade
        if (validation.data.checkIn || validation.data.checkOut) {
            const newCheckIn = validation.data.checkIn ? new Date(validation.data.checkIn) : existingReservation.checkIn
            const newCheckOut = validation.data.checkOut ? new Date(validation.data.checkOut) : existingReservation.checkOut

            // Validate invalid dates
            if (newCheckIn >= newCheckOut) {
                return NextResponse.json<ApiResponse>(
                    { success: false, error: 'Check-in deve ser anterior ao check-out' },
                    { status: 400 }
                )
            }

            const slug = resolveCabinSlug(existingReservation.cabin)
            let conflictCount = 0
            let maxAllowedUnits = Math.max(1, existingReservation.cabin.units || 1)

            if (slug) {
                maxAllowedUnits = await getActiveUnitsForSlug(slug)
                if (maxAllowedUnits <= 0) {
                    maxAllowedUnits = Math.max(1, existingReservation.cabin.units || 1)
                }
                conflictCount = await countConflictsForSlug(slug, newCheckIn, newCheckOut, id)
            } else {
                const activeReservationFilter = getActiveReservationFilter()
                conflictCount = await prisma.reservation.count({
                    where: {
                        id: { not: id },
                        cabinId: existingReservation.cabinId,
                        AND: [
                            activeReservationFilter,
                            {
                                OR: [
                                    { AND: [{ checkIn: { lte: newCheckIn } }, { checkOut: { gt: newCheckIn } }] },
                                    { AND: [{ checkIn: { lt: newCheckOut } }, { checkOut: { gte: newCheckOut } }] },
                                    { AND: [{ checkIn: { gte: newCheckIn } }, { checkOut: { lte: newCheckOut } }] },
                                ],
                            },
                        ],
                    },
                })
            }

            if (conflictCount >= maxAllowedUnits) {
                return NextResponse.json<ApiResponse>(
                    { success: false, error: 'Data indisponível (conflito de agenda)' },
                    { status: 409 }
                )
            }
        }

        // Atualiza reserva
        const reservation = await prisma.reservation.update({
            where: { id },
            data: validation.data,
            include: {
                cabin: true,
                payment: true,
            },
        })

        console.log({
            action: 'RESERVATION_UPDATED',
            timestamp: new Date().toISOString(),
            reservationId: id,
            userId: authUser.userId,
            changes: Object.keys(validation.data),
        })

        return NextResponse.json<ApiResponse<ReservationWithDetails>>({
            success: true,
            data: reservation as ReservationWithDetails,
            message: 'Reserva atualizada com sucesso',
        })
    } catch (error) {
        console.error('[Reservation PATCH Error]', error)
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Erro ao atualizar reserva' },
            { status: 500 }
        )
    }
}

// DELETE - Cancela reserva (soft delete)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
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
        await prisma.reservation.update({
            where: { id },
            data: { status: ReservationStatus.CANCELLED },
        })

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
