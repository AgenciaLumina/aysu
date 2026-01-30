// AISSU Beach Lounge - Reservation Availability API
// GET /api/reservations/availability

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import type { ApiResponse, CabinAvailability, AvailabilitySlot } from '@/lib/types'
import { ReservationStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const cabinId = searchParams.get('cabinId')

        // Suporte para data única ou mês completo
        const dateParam = searchParams.get('date')
        const yearParam = searchParams.get('year')
        const monthParam = searchParams.get('month')

        if (!cabinId) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'cabinId é obrigatório' },
                { status: 400 }
            )
        }

        // Resolvendo o(s) Bangalô(s) - UUID ou Slug
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cabinId)
        let cabinPoolIds: string[] = []
        let nameToReturn = ''

        if (isUuid) {
            const cabin = await prisma.cabin.findUnique({ where: { id: cabinId } })
            if (!cabin) return NextResponse.json({ success: false, error: 'Bangalô não encontrado' }, { status: 404 })
            cabinPoolIds = [cabin.id]
            nameToReturn = cabin.name
        } else {
            const slugMap: Record<string, string> = {
                'bangalo-lateral': 'Bangalô Lateral',
                'bangalo-piscina': 'Bangalô Piscina',
                'bangalo-frente-mar': 'Bangalô Frente Mar',
                'bangalo-central': 'Bangalô Central',
                'sunbed-casal': 'Sunbed Casal',
            }
            const namePrefix = slugMap[cabinId]
            if (!namePrefix) return NextResponse.json({ success: false, error: 'Tipo inválido' }, { status: 400 })

            const cabins = await prisma.cabin.findMany({
                where: { name: { startsWith: namePrefix }, isActive: true },
                select: { id: true }
            })
            cabinPoolIds = cabins.map(c => c.id)
            nameToReturn = namePrefix
        }

        const totalUnits = cabinPoolIds.length

        // LÓGICA MENSAL
        if (yearParam && monthParam) {
            const year = parseInt(yearParam)
            const month = parseInt(monthParam) - 1
            const firstDay = new Date(year, month, 1)
            const lastDay = new Date(year, month + 1, 0)

            const dayResults = []
            for (let d = 1; d <= lastDay.getDate(); d++) {
                const currentDay = new Date(year, month, d)
                const startOfDay = new Date(currentDay)
                startOfDay.setHours(8, 0, 0, 0)
                const endOfDay = new Date(currentDay)
                endOfDay.setHours(18, 0, 0, 0)

                // Conta quantas reservas existem para este tipo no dia
                const reservedCount = await prisma.reservation.count({
                    where: {
                        cabinId: { in: cabinPoolIds },
                        status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS'] },
                        OR: [
                            { AND: [{ checkIn: { lte: startOfDay } }, { checkOut: { gt: startOfDay } }] },
                            { AND: [{ checkIn: { lt: endOfDay } }, { checkOut: { gte: endOfDay } }] },
                            { AND: [{ checkIn: { gte: startOfDay } }, { checkOut: { lte: endOfDay } }] },
                        ]
                    }
                })

                dayResults.push({
                    date: currentDay.toISOString().split('T')[0],
                    available: reservedCount < totalUnits
                })
            }

            return NextResponse.json({ success: true, data: dayResults })
        }

        // LÓGICA DE DATA ÚNICA (Slots)
        if (dateParam) {
            const date = new Date(dateParam)
            const startOfDay = new Date(date); startOfDay.setHours(0, 0, 0, 0)
            const endOfDay = new Date(date); endOfDay.setHours(23, 59, 59, 999)

            const reservations = await prisma.reservation.findMany({
                where: {
                    cabinId: { in: cabinPoolIds },
                    status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS'] },
                    OR: [
                        { checkIn: { gte: startOfDay, lte: endOfDay } },
                        { checkOut: { gte: startOfDay, lte: endOfDay } },
                        { AND: [{ checkIn: { lte: startOfDay } }, { checkOut: { gte: endOfDay } }] },
                    ]
                }
            })

            const slots = []
            for (let hour = 8; hour < 18; hour++) {
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
