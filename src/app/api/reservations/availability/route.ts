import { getCommercialCondition, inventoryConsumption, parseCommercialConditions } from '@/lib/reservation-commercial'
// AISSU Beach Lounge - Reservation Availability API
// GET /api/reservations/availability

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import type { ApiResponse } from '@/lib/types'
import { getActiveReservationFilter } from '@/lib/reservation-hold'
import { getCabinSpaceKey, getCabinSpaceLabel, getSpacePrefix, isSpaceSlug, getSpaceCategoryKey, getInventoryMembers } from '@/lib/space-slugs'
import { isReservationDateBlocked, isSpaceEnabled, parseReservableItems } from '@/lib/day-config'

interface ReservationLite {
    participantCount: number
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
    const key = formatLocalDate(date)
    return { start: new Date(`${key}T10:00:00-03:00`), end: new Date(`${key}T18:00:00-03:00`) }
}

function getCalendarDayRange(date: Date): { start: Date; end: Date } {
    const key = formatLocalDate(date)
    return { start: new Date(`${key}T00:00:00-03:00`), end: new Date(`${key}T23:59:59.999-03:00`) }
}

function buildSpaceKeyFilter(spaceKey: string) {
    if (isSpaceSlug(spaceKey)) {
        const prefix = getSpacePrefix(spaceKey)
        return {
            OR: [
                { slug: spaceKey },
                { slug: { startsWith: `${spaceKey}-` } },
                { slug: null, name: { startsWith: prefix } },
            ],
        }
    }

    return { slug: spaceKey }
}

async function getInventoryBySpaceKey(spaceKey: string) {
    const cabins = await prisma.cabin.findMany({
        where: { OR: [{ id: spaceKey }, buildSpaceKeyFilter(spaceKey)] },
        select: { id: true, name: true, slug: true, units: true, isActive: true, visibilityStatus: true, deletedAt: true },
    })
    return getInventoryMembers(cabins, spaceKey)
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
        const [globalRules, dateRules, closedDates] = await Promise.all([
            prisma.reservationGlobalConfig.findUnique({ where: { id: 'default' }, select: { commercialConditions: true, reservableItems: true } }),
            prisma.reservationDayConfig.findMany({ select: { date: true, commercialConditions: true, reservableItems: true, status: true, reservationsEnabled: true } }),
            prisma.closedDate.findMany({ select: { date: true } }),
        ])
        const rulesByDate = new Map(dateRules.map(rule => [rule.date.toISOString().slice(0, 10), rule]))
        const closedDateKeys = new Set(closedDates.map(item => item.date.toISOString().slice(0, 10)))
        const isEnabled = (date: Date, spaceKey: string) => {
            const dateKey = formatLocalDate(date)
            const rule = rulesByDate.get(dateKey)
            if (isReservationDateBlocked(rule)) return false
            if (closedDateKeys.has(dateKey) && !(rule?.status === 'EVENT' && rule.reservationsEnabled)) return false
            return isSpaceEnabled(spaceKey, parseReservableItems(rule ? rule.reservableItems : globalRules?.reservableItems), parseCommercialConditions(globalRules?.commercialConditions), parseCommercialConditions(rule?.commercialConditions))
        }
        const dayUseCapacity = (date: Date, fallback: number) => getCommercialCondition('day-use-praia', parseCommercialConditions(globalRules?.commercialConditions), parseCommercialConditions(dateRules.find(item => item.date.toISOString().slice(0, 10) === formatLocalDate(date))?.commercialConditions)).dayUseCapacity ?? fallback
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
        let targetMembers: Awaited<ReturnType<typeof getInventoryBySpaceKey>> = []
        let nameToReturn = ''

        if (cabinId) {
            if (isUuid) {
                const cabin = await prisma.cabin.findUnique({
                    where: { id: cabinId },
                    select: { id: true, name: true, slug: true, units: true, visibilityStatus: true, isActive: true },
                })

                if (!cabin) {
                    return NextResponse.json({ success: false, error: 'Espaço não encontrado' }, { status: 404 })
                }

                targetSpaceKey = getCabinSpaceKey(cabin)
                targetMembers = await getInventoryBySpaceKey(targetSpaceKey)
                nameToReturn = getCabinSpaceLabel(cabin)
            } else {
                targetSpaceKey = cabinId.trim()
                if (!targetSpaceKey) {
                    return NextResponse.json({ success: false, error: 'Tipo inválido' }, { status: 400 })
                }

                targetMembers = await getInventoryBySpaceKey(targetSpaceKey)
                nameToReturn = isSpaceSlug(targetSpaceKey) ? getSpacePrefix(targetSpaceKey) : targetSpaceKey
            }
        }

        const memberIds = new Set(targetMembers.map(cabin => cabin.id))
        const countedKeys = (date: Date) => new Set(targetMembers.filter(cabin => cabin.isActive && cabin.visibilityStatus === 'AVAILABLE' && isEnabled(date, getCabinSpaceKey(cabin))).map(getCabinSpaceKey))
        const totalForDate = (date: Date) => {
            const units = targetMembers.filter(cabin => cabin.isActive && cabin.visibilityStatus === 'AVAILABLE' && isEnabled(date, getCabinSpaceKey(cabin))).reduce((sum, cabin) => sum + Math.max(1, cabin.units || 1), 0)
            return targetSpaceKey === 'day-use-praia' && units > 0 ? dayUseCapacity(date, units) : units
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
                return memberIds.has(reservation.cabinId)
            })

            const dayResults = []
            for (let day = 1; day <= lastDay.getDate(); day++) {
                const currentDay = new Date(year, month, day)
                const { start, end } = getDayRange(currentDay)

                const reservedCount = relevantReservations.filter((reservation) =>
                    overlaps(start, end, reservation.checkIn, reservation.checkOut) && countedKeys(currentDay).has(getCabinSpaceKey({ id: reservation.cabinId, ...reservation.cabin }))
                ).reduce((sum, reservation) => sum + inventoryConsumption(targetSpaceKey || '', reservation), 0)
                const dayTotalUnits = totalForDate(currentDay)

                dayResults.push({
                    date: formatLocalDate(currentDay),
                    available: isEnabled(currentDay, targetSpaceKey || '') && reservedCount < dayTotalUnits,
                })
            }

            return NextResponse.json({ success: true, data: dayResults })
        }

        // Disponibilidade por tipo para uma data (home/reservas)
        if (!cabinId && dateParam) {
            const date = new Date(`${dateParam}T12:00:00`)
            const { start, end } = getDayRange(date)

            const activeCabins = await prisma.cabin.findMany({
                where: { deletedAt: null },
                select: { id: true, name: true, slug: true, units: true, visibilityStatus: true, isActive: true },
            })

            const totalUnitsByType: Record<string, number> = {}

            const ownKeys = new Set(activeCabins.map(getCabinSpaceKey))
            const availabilityKeys = (key: string) => {
                const category = getSpaceCategoryKey(key)
                return category !== key && !ownKeys.has(category) ? [key, category] : [key]
            }
            activeCabins.forEach((cabin) => {
                const spaceKey = getCabinSpaceKey(cabin)
                const units = cabin.isActive && cabin.visibilityStatus === 'AVAILABLE' && isEnabled(date, spaceKey) ? Math.max(1, cabin.units || 1) : 0
                for (const key of availabilityKeys(spaceKey)) totalUnitsByType[key] = (totalUnitsByType[key] || 0) + units
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

                if (!totalUnitsByType[spaceKey]) return
                for (const key of availabilityKeys(spaceKey)) {
                    if (key in totalUnitsByType) reservedByType[key] = (reservedByType[key] || 0) + inventoryConsumption(key, reservation)
                }
            })

            const availability: Record<string, number> = {}
            Object.entries(totalUnitsByType).forEach(([spaceKey, totalUnitsForType]) => {
                const available = (spaceKey === 'day-use-praia' && totalUnitsForType > 0 ? dayUseCapacity(date, totalUnitsForType) : totalUnitsForType) - (reservedByType[spaceKey] || 0)
                availability[spaceKey] = isEnabled(date, spaceKey) && available > 0 ? available : 0
            })

            return NextResponse.json({ success: true, data: availability })
        }

        // Slots horários de um tipo específico em uma data
        if (cabinId && dateParam) {
            const date = new Date(`${dateParam}T12:00:00`)
            const { start, end } = getCalendarDayRange(date)

            const reservations = await getRelevantReservations(start, end)
            const relevantReservations = reservations.filter((reservation) => {
                if (!targetSpaceKey) return false
                return memberIds.has(reservation.cabinId)
            })

            const slots = []
            for (let hour = 10; hour < 18; hour++) {
                const key = formatLocalDate(date)
                const slotStart = new Date(`${key}T${hour}:00:00-03:00`)
                const slotEnd = new Date(`${key}T${hour + 1}:00:00-03:00`)

                const countAtSlot = relevantReservations.filter((reservation) =>
                    overlaps(slotStart, slotEnd, reservation.checkIn, reservation.checkOut) && countedKeys(date).has(getCabinSpaceKey({ id: reservation.cabinId, ...reservation.cabin }))
                ).reduce((sum, reservation) => sum + inventoryConsumption(targetSpaceKey || '', reservation), 0)

                const isOccupied = !isEnabled(date, targetSpaceKey || '') || countAtSlot >= totalForDate(date) || slotStart < new Date()

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
