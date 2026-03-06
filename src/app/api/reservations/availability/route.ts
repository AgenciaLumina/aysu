// AISSU Beach Lounge - Reservation Availability API
// GET /api/reservations/availability

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import type { ApiResponse } from '@/lib/types'
import { getActiveReservationFilter } from '@/lib/reservation-hold'
import { getCabinSpaceKey, getCabinSpaceLabel, getSpacePrefix, isSpaceSlug } from '@/lib/space-slugs'

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

interface ReservationLite {
    cabinId: string
    checkIn: Date
    checkOut: Date
    cabin: {
        name: string
        slug: string | null
    }
}

function overlaps(startA: Date, endA: Date, startB: Date, endB: Date): boolean {
    return startA < endB && endA > startB
}

function formatLocalDate(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

function getDayRange(date: Date): { start: Date; end: Date } {
    const start = new Date(date)
    start.setHours(10, 0, 0, 0)
    const end = new Date(date)
    end.setHours(18, 0, 0, 0)
    return { start, end }
}

function getCalendarDayRange(date: Date): { start: Date; end: Date } {
    const start = new Date(date)
    start.setHours(0, 0, 0, 0)
    const end = new Date(date)
    end.setHours(23, 59, 59, 999)
    return { start, end }
}

function buildSpaceKeyFilter(spaceKey: string) {
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

async function getActiveUnitsBySpaceKey(spaceKey: string): Promise<number> {
    const cabins = await prisma.cabin.findMany({
        where: {
            isActive: true,
            visibilityStatus: 'AVAILABLE',
            ...buildSpaceKeyFilter(spaceKey),
        },
        select: { units: true },
    })

    return cabins.reduce((sum, cabin) => sum + Math.max(1, cabin.units || 1), 0)
}

async function getRelevantReservations(
    rangeStart: Date,
    rangeEnd: Date,
): Promise<ReservationLite[]> {
    return prisma.reservation.findMany({
        where: {
            AND: [
                getActiveReservationFilter(),
                {
                    OR: [
                        { checkIn: { gte: rangeStart, lte: rangeEnd } },
                        { checkOut: { gte: rangeStart, lte: rangeEnd } },
                        { AND: [{ checkIn: { lte: rangeStart } }, { checkOut: { gte: rangeEnd } }] },
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
}

export async function GET(request: NextRequest) {
    try {
        await ensureCabinVisibilityStatusColumn()
        const { searchParams } = new URL(request.url)
        const cabinId = searchParams.get('cabinId')
        const dateParam = searchParams.get('date')
        const yearParam = searchParams.get('year')
        const monthParam = searchParams.get('month')

        if (!cabinId && !dateParam) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'cabinId ou date é obrigatório' },
                { status: 400 }
            )
        }

        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cabinId || '')

        let targetSpaceKey: string | null = null
        let totalUnits = 0
        let nameToReturn = ''

        if (cabinId) {
            if (isUuid) {
                const cabin = await prisma.cabin.findUnique({
                    where: { id: cabinId },
                    select: { id: true, name: true, slug: true, units: true, visibilityStatus: true },
                })

                if (!cabin) {
                    return NextResponse.json({ success: false, error: 'Espaço não encontrado' }, { status: 404 })
                }

                targetSpaceKey = getCabinSpaceKey(cabin)
                totalUnits = await getActiveUnitsBySpaceKey(targetSpaceKey)
                if (totalUnits <= 0) {
                    totalUnits = cabin.visibilityStatus === 'AVAILABLE' ? Math.max(1, cabin.units || 1) : 0
                }
                nameToReturn = getCabinSpaceLabel(cabin)
            } else {
                targetSpaceKey = cabinId.trim()
                if (!targetSpaceKey) {
                    return NextResponse.json({ success: false, error: 'Tipo inválido' }, { status: 400 })
                }

                totalUnits = await getActiveUnitsBySpaceKey(targetSpaceKey)
                nameToReturn = isSpaceSlug(targetSpaceKey) ? getSpacePrefix(targetSpaceKey) : targetSpaceKey
            }
        }

        // Disponibilidade mensal de um tipo específico (para calendário no admin)
        if (cabinId && yearParam && monthParam) {
            const year = Number(yearParam)
            const month = Number(monthParam) - 1

            if (!Number.isInteger(year) || !Number.isInteger(month + 1) || month < 0 || month > 11) {
                return NextResponse.json({ success: false, error: 'Parâmetros year/month inválidos' }, { status: 400 })
            }

            const lastDay = new Date(year, month + 1, 0)
            const monthStart = new Date(year, month, 1, 0, 0, 0, 0)
            const monthEnd = new Date(year, month, lastDay.getDate(), 23, 59, 59, 999)

            const reservations = await getRelevantReservations(monthStart, monthEnd)

            const relevantReservations = reservations.filter((reservation) => {
                if (!targetSpaceKey) return false
                const reservationSpaceKey = getCabinSpaceKey({
                    id: reservation.cabinId,
                    name: reservation.cabin.name,
                    slug: reservation.cabin.slug,
                })
                return reservationSpaceKey === targetSpaceKey
            })

            const dayResults = []
            for (let day = 1; day <= lastDay.getDate(); day++) {
                const currentDay = new Date(year, month, day)
                const { start, end } = getDayRange(currentDay)

                const reservedCount = relevantReservations.filter((reservation) =>
                    overlaps(start, end, reservation.checkIn, reservation.checkOut)
                ).length

                dayResults.push({
                    date: formatLocalDate(currentDay),
                    available: reservedCount < totalUnits,
                })
            }

            return NextResponse.json({ success: true, data: dayResults })
        }

        // Disponibilidade por tipo para uma data (home/reservas)
        if (!cabinId && dateParam) {
            const date = new Date(dateParam)
            const { start, end } = getDayRange(date)

            const activeCabins = await prisma.cabin.findMany({
                where: { isActive: true, visibilityStatus: 'AVAILABLE' },
                select: { id: true, name: true, slug: true, units: true },
            })

            const totalUnitsByType: Record<string, number> = {}

            activeCabins.forEach((cabin) => {
                const spaceKey = getCabinSpaceKey(cabin)
                totalUnitsByType[spaceKey] = (totalUnitsByType[spaceKey] || 0) + Math.max(1, cabin.units || 1)
            })

            const reservations = await getRelevantReservations(start, end)
            const reservedByType: Record<string, number> = {}

            reservations.forEach((reservation) => {
                if (!overlaps(start, end, reservation.checkIn, reservation.checkOut)) return

                const spaceKey = getCabinSpaceKey({
                    id: reservation.cabinId,
                    name: reservation.cabin.name,
                    slug: reservation.cabin.slug,
                })

                if (!(spaceKey in totalUnitsByType)) return
                reservedByType[spaceKey] = (reservedByType[spaceKey] || 0) + 1
            })

            const availability: Record<string, number> = {}
            Object.entries(totalUnitsByType).forEach(([spaceKey, totalUnitsForType]) => {
                const available = totalUnitsForType - (reservedByType[spaceKey] || 0)
                availability[spaceKey] = available > 0 ? available : 0
            })

            return NextResponse.json({ success: true, data: availability })
        }

        // Slots horários de um tipo específico em uma data
        if (cabinId && dateParam) {
            const date = new Date(dateParam)
            const { start, end } = getCalendarDayRange(date)

            const reservations = await getRelevantReservations(start, end)
            const relevantReservations = reservations.filter((reservation) => {
                if (!targetSpaceKey) return false
                const reservationSpaceKey = getCabinSpaceKey({
                    id: reservation.cabinId,
                    name: reservation.cabin.name,
                    slug: reservation.cabin.slug,
                })
                return reservationSpaceKey === targetSpaceKey
            })

            const slots = []
            for (let hour = 10; hour < 18; hour++) {
                const slotStart = new Date(date)
                slotStart.setHours(hour, 0, 0, 0)
                const slotEnd = new Date(date)
                slotEnd.setHours(hour + 1, 0, 0, 0)

                const countAtSlot = relevantReservations.filter((reservation) =>
                    overlaps(slotStart, slotEnd, reservation.checkIn, reservation.checkOut)
                ).length

                const isOccupied = countAtSlot >= totalUnits || slotStart < new Date()

                slots.push({
                    start: slotStart.toISOString(),
                    end: slotEnd.toISOString(),
                    isOccupied,
                })
            }

            return NextResponse.json({
                success: true,
                data: { cabinId, cabinName: nameToReturn, date: dateParam, slots },
            })
        }

        return NextResponse.json(
            { success: false, error: 'Parâmetros insuficientes (date ou year/month)' },
            { status: 400 }
        )
    } catch (error) {
        console.error('[Availability Error]', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao verificar disponibilidade' },
            { status: 500 }
        )
    }
}
