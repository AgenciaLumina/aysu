// AISSU Beach Lounge - Reservations API
// GET/POST /api/reservations

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { canManageReservations, getAuthUser } from '@/lib/auth'
import { createBooking, BookingError } from '@/lib/reservation-booking'
import { createReservationSchema, paginationSchema, reservationFiltersSchema } from '@/lib/validations'
import type { ApiResponse, PaginatedResponse, ReservationWithDetails } from '@/lib/types'
import { Prisma } from '@prisma/client'

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

// GET - Lista reservas (com filtros e paginação)
export async function GET(request: NextRequest) {
    try {
        await ensureCabinVisibilityStatusColumn()
        const authUser = getAuthUser(request)

        // Requer autenticação
        if (!authUser) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Não autorizado' },
                { status: 401 }
            )
        }

        // Parse query params
        const { searchParams } = new URL(request.url)
        const params = Object.fromEntries(searchParams.entries())

        const pagination = paginationSchema.safeParse(params)
        const filters = reservationFiltersSchema.safeParse(params)

        const page = pagination.success ? pagination.data.page : 1
        const limit = pagination.success ? pagination.data.limit : 20
        const skip = (page - 1) * limit

        // Constrói where com filtros
        const where: Prisma.ReservationWhereInput = {}

        if (filters.success) {
            const { status, source, cabinId, startDate, endDate, search } = filters.data

            if (status) where.status = status
            if (source) where.source = source
            if (cabinId) where.cabinId = cabinId

            if (startDate || endDate) {
                where.checkIn = {}
                if (startDate) where.checkIn.gte = new Date(startDate)
                if (endDate) where.checkIn.lte = new Date(endDate)
            }

            if (search) {
                where.OR = [
                    { customerName: { contains: search, mode: 'insensitive' } },
                    { customerEmail: { contains: search, mode: 'insensitive' } },
                    { customerPhone: { contains: search } },
                ]
            }
        }

        // Busca com paginação
        const [reservations, total] = await Promise.all([
            prisma.reservation.findMany({
                where,
                include: {
                    cabin: true,
                    payment: true,
                },
                orderBy: { checkIn: 'asc' },
                skip,
                take: limit,
            }),
            prisma.reservation.count({ where }),
        ])

        const response: PaginatedResponse<ReservationWithDetails> = {
            success: true,
            data: reservations as ReservationWithDetails[],
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        }

        return NextResponse.json(response)
    } catch (error) {
        console.error('[Reservations GET Error]', error)
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Erro ao buscar reservas' },
            { status: 500 }
        )
    }
}

// POST - Quote, inventory and persistence share the same transaction.
export async function POST(request: NextRequest) {
    try {
        const validation = createReservationSchema.safeParse(await request.json())
        if (!validation.success) return NextResponse.json({ success: false, error: validation.error.issues[0].message }, { status: 400 })
        const auth = getAuthUser(request)
        if (validation.data.source === 'OFFLINE' && !canManageReservations(auth)) return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 })
        const checkIn = new Date(validation.data.checkIn)
        const checkOut = new Date(validation.data.checkOut)
        if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime()) || checkIn >= checkOut) return NextResponse.json({ success: false, error: 'Selecione datas válidas para a reserva.' }, { status: 400 })
        const reservation = await createBooking(validation.data, auth?.userId ?? null)
        return NextResponse.json({ success: true, data: reservation, message: 'Reserva iniciada. A confirmação depende da aprovação do pagamento.' }, { status: 201 })
    } catch (error) {
        if (error instanceof BookingError) return NextResponse.json({ success: false, error: error.message }, { status: error.status })
        console.error('[Reservation creation]', error instanceof Error ? error.name : 'unknown')
        return NextResponse.json({ success: false, error: 'Não foi possível concluir. Tente novamente com a mesma solicitação.' }, { status: 503 })
    }
}
