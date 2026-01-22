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
        const dateParam = searchParams.get('date')

        if (!cabinId || !dateParam) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'cabinId e date são obrigatórios' },
                { status: 400 }
            )
        }

        // Verifica se cabin existe
        const cabin = await prisma.cabin.findUnique({
            where: { id: cabinId },
        })

        if (!cabin) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Bangalô não encontrado' },
                { status: 404 }
            )
        }

        // Define início e fim do dia
        const date = new Date(dateParam)
        const startOfDay = new Date(date)
        startOfDay.setHours(0, 0, 0, 0)

        const endOfDay = new Date(date)
        endOfDay.setHours(23, 59, 59, 999)

        // Busca reservas do dia
        const reservations = await prisma.reservation.findMany({
            where: {
                cabinId,
                status: {
                    in: [
                        ReservationStatus.PENDING,
                        ReservationStatus.CONFIRMED,
                        ReservationStatus.CHECKED_IN,
                        ReservationStatus.IN_PROGRESS,
                    ],
                },
                OR: [
                    // Reservas que começam no dia
                    { checkIn: { gte: startOfDay, lte: endOfDay } },
                    // Reservas que terminam no dia
                    { checkOut: { gte: startOfDay, lte: endOfDay } },
                    // Reservas que englobam o dia todo
                    { AND: [{ checkIn: { lte: startOfDay } }, { checkOut: { gte: endOfDay } }] },
                ],
            },
            orderBy: { checkIn: 'asc' },
            select: {
                id: true,
                checkIn: true,
                checkOut: true,
                status: true,
            },
        })

        // Gera slots de hora em hora (8h às 22h)
        const slots: AvailabilitySlot[] = []
        const operatingStart = 8 // 8h
        const operatingEnd = 22 // 22h

        for (let hour = operatingStart; hour < operatingEnd; hour++) {
            const slotStart = new Date(date)
            slotStart.setHours(hour, 0, 0, 0)

            const slotEnd = new Date(date)
            slotEnd.setHours(hour + 1, 0, 0, 0)

            // Verifica se há reserva neste slot
            const isOccupied = reservations.some(r => {
                const rCheckIn = new Date(r.checkIn)
                const rCheckOut = new Date(r.checkOut)
                // Slot está ocupado se começa antes do fim da reserva E termina depois do início
                return slotStart < rCheckOut && slotEnd > rCheckIn
            })

            // Não mostra slots no passado
            const now = new Date()
            const isPast = slotStart < now

            slots.push({
                start: slotStart.toISOString(),
                end: slotEnd.toISOString(),
                isOccupied: isOccupied || isPast,
            })
        }

        const availability: CabinAvailability = {
            cabinId,
            cabinName: cabin.name,
            date: dateParam,
            slots,
        }

        return NextResponse.json<ApiResponse<CabinAvailability>>({
            success: true,
            data: availability,
        })
    } catch (error) {
        console.error('[Availability Error]', error)
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Erro ao verificar disponibilidade' },
            { status: 500 }
        )
    }
}
