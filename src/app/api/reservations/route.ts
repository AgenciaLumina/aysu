// AISSU Beach Lounge - Reservations API
// GET/POST /api/reservations

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { createReservationSchema, paginationSchema, reservationFiltersSchema } from '@/lib/validations'
import { getHoursDifference } from '@/lib/utils'
import type { ApiResponse, PaginatedResponse, ReservationWithDetails } from '@/lib/types'
import { Prisma, ReservationStatus } from '@prisma/client'
import { getPriceOverrideForSpace, parseDayConfig, parseReservationGlobalConfig, type ReservableItems } from '@/lib/day-config'
import { getActiveReservationFilter } from '@/lib/reservation-hold'
import { getCabinSpaceKey, getSpacePrefix, isSpaceSlug } from '@/lib/space-slugs'

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

function buildSpaceKeyCabinWhere(spaceKey: string): Prisma.CabinWhereInput {
    if (isSpaceSlug(spaceKey)) {
        const prefix = getSpacePrefix(spaceKey)
        return {
            OR: [
                { slug: spaceKey },
                { slug: null, name: { startsWith: prefix } },
            ],
        }
    }

    return { slug: spaceKey }
}

async function getActiveUnitsForSpaceKey(spaceKey: string): Promise<number> {
    const cabins = await prisma.cabin.findMany({
        where: {
            isActive: true,
            visibilityStatus: 'AVAILABLE',
            ...buildSpaceKeyCabinWhere(spaceKey),
        },
        select: { units: true },
    })

    return cabins.reduce((sum, cabin) => sum + Math.max(1, cabin.units || 1), 0)
}

async function countConflictsForSpaceKey(
    spaceKey: string,
    checkIn: Date,
    checkOut: Date,
    excludeReservationId?: string,
): Promise<number> {
    const activeReservationFilter = getActiveReservationFilter()

    const reservations = await prisma.reservation.findMany({
        where: {
            ...(excludeReservationId ? { id: { not: excludeReservationId } } : {}),
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

    return reservations.filter((reservation) => {
        const reservationSpaceKey = getCabinSpaceKey({
            id: reservation.cabinId,
            name: reservation.cabin.name,
            slug: reservation.cabin.slug,
        })
        return reservationSpaceKey === spaceKey
    }).length
}

async function countConflictsForCabinId(
    cabinId: string,
    checkIn: Date,
    checkOut: Date,
    excludeReservationId?: string,
): Promise<number> {
    const activeReservationFilter = getActiveReservationFilter()

    return prisma.reservation.count({
        where: {
            ...(excludeReservationId ? { id: { not: excludeReservationId } } : {}),
            cabinId,
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
    })
}

function isSpaceReservableForDate(
    spaceKey: string | null,
    reservableItems: ReservableItems,
): boolean {
    if (!spaceKey) return true

    if (spaceKey.startsWith('bangalo-')) return reservableItems.bangalos
    if (spaceKey === 'sunbed-casal') return reservableItems.sunbeds
    if (spaceKey === 'mesa-restaurante') return reservableItems.restaurantTables
    if (spaceKey === 'mesa-praia') return reservableItems.beachTables
    if (spaceKey === 'day-use-praia') return reservableItems.dayUse

    return true
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

// POST - Cria nova reserva
export async function POST(request: NextRequest) {
    try {
        await ensureCabinVisibilityStatusColumn()
        // Parse e valida body
        const body = await request.json()
        const validation = createReservationSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: validation.error.issues[0].message },
                { status: 400 }
            )
        }

        const data = validation.data

        // CORREÇÃO CRÍTICA DE TIMEZONE
        // Recebemos strings ISO completas (ex: 2026-02-06T10:00:00.000Z) do frontend
        // Mas para garantir, reconstruímos com base apenas no dia se necessário,
        // ou confiamos na string se ela já vier correta do frontend (que agora envia T10:00:00 local)
        const checkIn = new Date(data.checkIn)
        const checkOut = new Date(data.checkOut)

        // Validações de data
        if (checkIn >= checkOut) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Check-out deve ser após check-in' },
                { status: 400 }
            )
        }

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const checkInDateOnly = new Date(checkIn)
        checkInDateOnly.setHours(0, 0, 0, 0)

        if (checkInDateOnly < today) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Não é possível reservar datas passadas' },
                { status: 400 }
            )
        }

        // Lógica de atribuição com suporte a quantidade por tipo
        let cabinId = data.cabinId
        let cabin: Awaited<ReturnType<typeof prisma.cabin.findUnique>> | null = null
        let resolvedSpaceKey: string | null = null
        let availableUnitsForType = 1

        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cabinId)

        if (isUuid) {
            cabin = await prisma.cabin.findUnique({ where: { id: cabinId } })
            if (cabin) {
                resolvedSpaceKey = getCabinSpaceKey(cabin)
                availableUnitsForType = Math.max(1, cabin.units || 1)
            }
        } else {
            const normalizedSpaceKey = cabinId.trim()
            if (!normalizedSpaceKey) {
                return NextResponse.json<ApiResponse>(
                    { success: false, error: 'Tipo de acomodação inválido' },
                    { status: 400 }
                )
            }

            resolvedSpaceKey = normalizedSpaceKey
            availableUnitsForType = await getActiveUnitsForSpaceKey(resolvedSpaceKey)

            if (availableUnitsForType <= 0) {
                return NextResponse.json<ApiResponse>(
                    { success: false, error: 'Nenhuma unidade encontrada para este tipo' },
                    { status: 404 }
                )
            }

            cabin = await prisma.cabin.findFirst({
                where: {
                    isActive: true,
                    visibilityStatus: 'AVAILABLE',
                    ...buildSpaceKeyCabinWhere(resolvedSpaceKey),
                },
                orderBy: [
                    { updatedAt: 'desc' },
                    { createdAt: 'desc' },
                ],
            })

            if (cabin) {
                cabinId = cabin.id
            }
        }

        if (!cabin || !cabin.isActive) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Bangalô não encontrado ou indisponível' },
                { status: 404 }
            )
        }

        if (cabin.visibilityStatus !== 'AVAILABLE') {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Este espaço está indisponível para reserva no momento.' },
                { status: 409 }
            )
        }

        if (!resolvedSpaceKey) {
            resolvedSpaceKey = getCabinSpaceKey(cabin)
        }

        // Conflito considerando estoque agregado por tipo
        let maxAllowedUnits = availableUnitsForType
        let conflictCount = 0

        if (resolvedSpaceKey) {
            maxAllowedUnits = await getActiveUnitsForSpaceKey(resolvedSpaceKey)
            if (maxAllowedUnits <= 0) {
                maxAllowedUnits = Math.max(1, cabin.units || 1)
            }
            conflictCount = await countConflictsForSpaceKey(resolvedSpaceKey, checkIn, checkOut)
        } else {
            maxAllowedUnits = Math.max(1, cabin.units || 1)
            conflictCount = await countConflictsForCabinId(cabinId, checkIn, checkOut)
        }

        if (conflictCount >= maxAllowedUnits) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Horário indisponível. Já existe uma reserva neste período.' },
                { status: 409 }
            )
        }

        // Calcula horas
        const hoursBooked = getHoursDifference(checkIn, checkOut)

        // Verifica regras/configuração avançada por data
        const [dayConfig, globalConfigRaw] = await Promise.all([
            prisma.reservationDayConfig.findUnique({
                where: {
                    date: new Date(`${checkIn.toISOString().split('T')[0]}T12:00:00Z`),
                },
            }),
            prisma.reservationGlobalConfig.findUnique({
                where: { id: 'default' },
            }),
        ])

        if (dayConfig && (!dayConfig.reservationsEnabled || dayConfig.status === 'BLOCKED')) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Esta data está temporariamente indisponível para reservas online.' },
                { status: 409 }
            )
        }

        const parsedDayConfig = dayConfig ? parseDayConfig(dayConfig) : null
        const parsedGlobalConfig = parseReservationGlobalConfig(globalConfigRaw)
        const effectiveReservableItems = parsedDayConfig?.reservableItems ?? parsedGlobalConfig.reservableItems

        if (!isSpaceReservableForDate(resolvedSpaceKey, effectiveReservableItems)) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Este espaço não está disponível para reserva nesta data.' },
                { status: 409 }
            )
        }

        const overrideKey = resolvedSpaceKey || cabin.slug || cabin.id
        const dayPriceOverride = getPriceOverrideForSpace(parsedDayConfig, overrideKey)
        const globalPriceOverride = parsedGlobalConfig.priceOverrides[overrideKey] ?? null

        // Se o frontend enviou totalPrice, usa ele (day use com preço fixo)
        // Senão, calcula por hora (fallback para casos especiais)
        const totalPrice = dayPriceOverride?.price
            ?? globalPriceOverride?.price
            ?? data.totalPrice
            ?? (Number(cabin.pricePerHour) * hoursBooked)

        // Verifica se veio de usuário autenticado (OFFLINE) ou público (ONLINE)
        const authUser = getAuthUser(request)
        const userId = authUser?.userId || null

        // Cria reserva
        const reservation = await prisma.reservation.create({
            data: {
                cabinId: cabinId, // Usa o ID resolvido (UUID)
                userId,
                customerName: data.customerName,
                customerEmail: data.customerEmail.toLowerCase(),
                customerPhone: data.customerPhone ?? '',
                customerDocument: data.customerDocument,
                checkIn,
                checkOut,
                hoursBooked,
                totalPrice,
                source: data.source,
                notes: data.notes,
                status: ReservationStatus.PENDING,
            },
            include: {
                cabin: true,
            },
        })

        console.log({
            action: 'RESERVATION_CREATED',
            timestamp: new Date().toISOString(),
            reservationId: reservation.id,
            cabinId: data.cabinId,
            source: data.source,
        })

        return NextResponse.json<ApiResponse<ReservationWithDetails>>(
            {
                success: true,
                data: reservation as ReservationWithDetails,
                message: 'Reserva criada com sucesso',
            },
            { status: 201 }
        )
    } catch (error) {
        console.error('[Reservations POST Error]', error)
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Erro ao criar reserva' },
            { status: 500 }
        )
    }
}
