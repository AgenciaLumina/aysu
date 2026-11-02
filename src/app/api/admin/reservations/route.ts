// API: Get Reservations by Date
import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@/lib/db'
import { prisma } from '@/lib/db'
import { canManageReservations, getAuthUser } from '@/lib/auth'
import { dateKeyInSaoPaulo } from '@/lib/reservation-booking'

export const dynamic = 'force-dynamic'
const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' }

export async function GET(request: NextRequest) {
    try {
        const authUser = getAuthUser(request)
        if (!canManageReservations(authUser)) {
            return NextResponse.json(
                { success: false, error: 'Acesso negado' },
                { status: 403, headers: NO_STORE_HEADERS }
            )
        }

        const { searchParams } = new URL(request.url)
        const dateParam = searchParams.get('date') // YYYY-MM-DD
        const limitParam = searchParams.get('limit')

        const where: Prisma.ReservationWhereInput = {}

        // A data escolhida representa um dia civil de Brasília, não um dia UTC.
        if (dateParam) {
            const start = new Date(`${dateParam}T00:00:00-03:00`)
            if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam) || Number.isNaN(start.getTime()) || dateKeyInSaoPaulo(start) !== dateParam) {
                return NextResponse.json({ success: false, error: 'Selecione uma data válida.' }, { status: 400, headers: NO_STORE_HEADERS })
            }
            where.checkIn = {
                gte: start,
                lt: new Date(start.getTime() + 24 * 60 * 60 * 1000),
            }
        }
        if (limitParam !== null && (!/^\d+$/.test(limitParam) || !Number.isSafeInteger(Number(limitParam)) || Number(limitParam) < 1)) {
            return NextResponse.json({ success: false, error: 'Limite inválido.' }, { status: 400, headers: NO_STORE_HEADERS })
        }

        const reservations = await prisma.reservation.findMany({
            where,
            include: {
                cabin: {
                    select: {
                        id: true,
                        name: true,
                        category: true,
                    },
                },
                payment: {
                    select: {
                        id: true,
                        status: true,
                        amount: true,
                        cardBrand: true,
                        cardLastFour: true,
                    },
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: {
                checkIn: 'asc', // Próximas reservas primeiro
            },
            take: limitParam ? Number(limitParam) : undefined,
        })

        // Transform to match frontend interface
        const formatted = reservations.map((r) => {
            const checkInTime = new Date(r.checkIn).toLocaleTimeString('pt-BR', {
                timeZone: 'America/Sao_Paulo',
                hour: '2-digit',
                minute: '2-digit',
            })

            // Map Prisma enum to frontend enum
            let status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show'
            switch (r.status) {
                case 'PENDING':
                    status = 'pending'
                    break
                case 'CHECKED_IN':
                case 'IN_PROGRESS':
                    status = 'checked_in'
                    break
                case 'COMPLETED':
                    status = 'checked_out'
                    break
                case 'CANCELLED':
                    status = 'cancelled'
                    break
                case 'NO_SHOW':
                    status = 'no_show'
                    break
                default:
                    status = 'confirmed'
            }

            return {
                id: r.id,
                customerName: r.customerName,
                customerPhone: r.customerPhone,
                customerEmail: r.customerEmail,
                customerDocument: r.customerDocument,
                spaceName: r.cabin.name,
                cabin: { name: r.cabin.name }, // Adicionado para compatibilidade com Dashboard/Reservas
                spaceType: r.cabin.category.toLowerCase(),
                date: dateKeyInSaoPaulo(r.checkIn),
                time: checkInTime,
                participantCount: r.participantCount,
                unitNumber: r.unitNumber,
                consumptionCredit: r.consumptionCredit === null ? null : Number(r.consumptionCredit),
                bookingConditions: r.bookingConditions,
                totalPrice: Number(r.totalPrice),
                status,
                source: r.source === 'ONLINE' ? 'online' : 'manual',
                paymentStatus: r.payment?.status || null,
                checkIn: r.checkIn.toISOString(), // Adicionado formato ISO completo
                notes: r.notes,
            }
        })

        return NextResponse.json({
            success: true,
            data: formatted,
            count: formatted.length,
        }, { headers: NO_STORE_HEADERS })
    } catch (error) {
        console.error('Error fetching reservations:', error)
        return NextResponse.json(
            { success: false, error: 'Não foi possível carregar as reservas. Tente novamente.' },
            { status: 500, headers: NO_STORE_HEADERS }
        )
    }
}
