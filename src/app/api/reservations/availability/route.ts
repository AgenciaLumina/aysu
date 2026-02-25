// AISSU Beach Lounge - Reservation Availability API
// GET /api/reservations/availability

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import type { ApiResponse } from '@/lib/types'
import { getActiveReservationFilter } from '@/lib/reservation-hold'

const CABIN_PREFIX_BY_SLUG: Record<string, string> = {
    'bangalo-lateral': 'Bangalô Lateral',
    'bangalo-piscina': 'Bangalô Piscina',
    'bangalo-frente-mar': 'Bangalô Frente Mar',
    'bangalo-central': 'Bangalô Central',
    'sunbed-casal': 'Sunbed Casal',
    'mesa-restaurante': 'Mesa Restaurante',
    'mesa-praia': 'Mesa Praia',
    'day-use-praia': 'Day Use Praia',
}

const CABIN_SLUGS = Object.keys(CABIN_PREFIX_BY_SLUG)

function resolveCabinSlug(cabinName: string): string | null {
    const normalized = cabinName.toLowerCase().trim()
    if (normalized.includes('lateral')) return 'bangalo-lateral'
    if (normalized.includes('piscina')) return 'bangalo-piscina'
    if (normalized.includes('frente') && normalized.includes('mar')) return 'bangalo-frente-mar'
    if (normalized.includes('central')) return 'bangalo-central'
    if (normalized.includes('sunbed') || normalized.includes('sun bed')) return 'sunbed-casal'
    if (normalized.includes('mesa') && normalized.includes('restaurante')) return 'mesa-restaurante'
    if (normalized.includes('mesa') && normalized.includes('praia')) return 'mesa-praia'
    if (normalized.includes('day use') && normalized.includes('praia')) return 'day-use-praia'
    return null
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const cabinId = searchParams.get('cabinId')

        // Suporte para data única ou mês completo
        const dateParam = searchParams.get('date')
        const yearParam = searchParams.get('year')
        const monthParam = searchParams.get('month')

        if (!cabinId && !dateParam) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'cabinId ou date é obrigatório' },
                { status: 400 }
            )
        }

        const activeReservationFilter = getActiveReservationFilter()

        // Resolvendo o(s) Bangalô(s) - UUID ou Slug
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cabinId || '')
        let cabinPoolIds: string[] = []
        let nameToReturn = ''

        if (cabinId) {
            if (isUuid) {
                const cabin = await prisma.cabin.findUnique({ where: { id: cabinId } })
                if (!cabin) return NextResponse.json({ success: false, error: 'Bangalô não encontrado' }, { status: 404 })
                cabinPoolIds = [cabin.id]
                nameToReturn = cabin.name
            } else {
                const namePrefix = CABIN_PREFIX_BY_SLUG[cabinId] // cabinId is confirmed string
                if (!namePrefix) return NextResponse.json({ success: false, error: 'Tipo inválido' }, { status: 400 })

                const cabins = await prisma.cabin.findMany({
                    where: { name: { startsWith: namePrefix }, isActive: true },
                    select: { id: true }
                })
                cabinPoolIds = cabins.map(c => c.id)
                nameToReturn = namePrefix
            }
        }

        const totalUnits = cabinPoolIds.length

        // LÓGICA MENSAL
        if (yearParam && monthParam) {
            const year = parseInt(yearParam)
            const month = parseInt(monthParam) - 1
            const lastDay = new Date(year, month + 1, 0)

            const dayResults = []
            for (let d = 1; d <= lastDay.getDate(); d++) {
                const currentDay = new Date(year, month, d)
                const startOfDay = new Date(currentDay)
                startOfDay.setHours(10, 0, 0, 0)
                const endOfDay = new Date(currentDay)
                endOfDay.setHours(18, 0, 0, 0)

                // Conta quantas reservas existem para este tipo no dia
                const reservedCount = await prisma.reservation.count({
                    where: {
                        cabinId: { in: cabinPoolIds },
                        AND: [
                            activeReservationFilter,
                            {
                                OR: [
                                    { AND: [{ checkIn: { lte: startOfDay } }, { checkOut: { gt: startOfDay } }] },
                                    { AND: [{ checkIn: { lt: endOfDay } }, { checkOut: { gte: endOfDay } }] },
                                    { AND: [{ checkIn: { gte: startOfDay } }, { checkOut: { lte: endOfDay } }] },
                                ],
                            },
                        ]
                    }
                })

                // Formata YYYY-MM-DD usando data local (seguro contra fuso horário do servidor)
                const yearStr = currentDay.getFullYear()
                const monthStr = String(currentDay.getMonth() + 1).padStart(2, '0')
                const dayStr = String(currentDay.getDate()).padStart(2, '0')
                const dateStr = `${yearStr}-${monthStr}-${dayStr}`

                dayResults.push({
                    date: dateStr,
                    available: reservedCount < totalUnits
                })
            }

            return NextResponse.json({ success: true, data: dayResults })
        }

        // LÓGICA DE CONTAGEM DIÁRIA (Todos os bangalôs)
        if (!cabinId && dateParam) {
            const date = new Date(dateParam)
            const startOfDay = new Date(date); startOfDay.setHours(10, 0, 0, 0)
            const endOfDay = new Date(date); endOfDay.setHours(18, 0, 0, 0)

            // Buscar todos os espaços ativos e mapear estoques por tipo
            const allCabins = await prisma.cabin.findMany({
                where: { isActive: true },
                select: { name: true }
            })

            const totalUnitsByType = CABIN_SLUGS.reduce<Record<string, number>>((acc, slug) => {
                acc[slug] = 0
                return acc
            }, {})

            for (const cabin of allCabins) {
                const slug = resolveCabinSlug(cabin.name)
                if (!slug) continue
                totalUnitsByType[slug] = (totalUnitsByType[slug] || 0) + 1
            }

            // Buscar reservas do dia para TODOS os espaços
            const reservations = await prisma.reservation.findMany({
                where: {
                    AND: [
                        activeReservationFilter,
                        {
                            OR: [
                                { AND: [{ checkIn: { lte: startOfDay } }, { checkOut: { gt: startOfDay } }] },
                                { AND: [{ checkIn: { lt: endOfDay } }, { checkOut: { gte: endOfDay } }] },
                                { AND: [{ checkIn: { gte: startOfDay } }, { checkOut: { lte: endOfDay } }] },
                            ],
                        },
                    ]
                },
                include: { cabin: true }
            })

            // Calcular disponibilidade
            const availability: Record<string, number> = { ...totalUnitsByType }

            reservations.forEach(res => {
                const slug = resolveCabinSlug(res.cabin.name)
                if (slug && availability[slug] > 0) {
                    availability[slug]--
                }
            })

            return NextResponse.json({ success: true, data: availability })
        }

        // LÓGICA DE DATA ÚNICA (Slots)
        if (dateParam) {
            const date = new Date(dateParam)
            const startOfDay = new Date(date); startOfDay.setHours(0, 0, 0, 0)
            const endOfDay = new Date(date); endOfDay.setHours(23, 59, 59, 999)

            const reservations = await prisma.reservation.findMany({
                where: {
                    cabinId: { in: cabinPoolIds },
                    AND: [
                        activeReservationFilter,
                        {
                            OR: [
                                { checkIn: { gte: startOfDay, lte: endOfDay } },
                                { checkOut: { gte: startOfDay, lte: endOfDay } },
                                { AND: [{ checkIn: { lte: startOfDay } }, { checkOut: { gte: endOfDay } }] },
                            ],
                        },
                    ]
                }
            })

            const slots = []
            for (let hour = 10; hour < 18; hour++) {
                const slotStart = new Date(date); slotStart.setHours(hour, 0, 0, 0)
                const slotEnd = new Date(date); slotEnd.setHours(hour + 1, 0, 0, 0)

                // Ocupado se o número de reservas no slot for >= número de unidades
                const countAtSlot = reservations.filter(r => slotStart < r.checkOut && slotEnd > r.checkIn).length
                const isOccupied = countAtSlot >= totalUnits || slotStart < new Date()

                slots.push({
                    start: slotStart.toISOString(),
                    end: slotEnd.toISOString(),
                    isOccupied
                })
            }

            return NextResponse.json({
                success: true,
                data: { cabinId, cabinName: nameToReturn, date: dateParam, slots }
            })
        }

        return NextResponse.json({ success: false, error: 'Parâmetros insuficientes (date ou year/month)' }, { status: 400 })

    } catch (error) {
        console.error('[Availability Error]', error)
        return NextResponse.json({ success: false, error: 'Erro ao verificar disponibilidade' }, { status: 500 })
    }
}
