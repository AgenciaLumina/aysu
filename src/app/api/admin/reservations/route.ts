// API: Get Reservations by Date
import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { canManageReservations, getAuthUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
    try {
        const authUser = getAuthUser(request)
        if (!canManageReservations(authUser)) {
            return NextResponse.json(
                { success: false, error: 'Acesso negado' },
                { status: 403 }
            )
        }

        const { searchParams } = new URL(request.url)
        const dateParam = searchParams.get('date') // YYYY-MM-DD
        const limitParam = searchParams.get('limit')

        const where: Prisma.ReservationWhereInput = {}

        // Se tiver data, filtra. Se não, traz tudo.
        if (dateParam) {
            // Ajuste manual de timezone: em UTC, nossas reservas (feitas como T10:00 local) 
            // podem cair no dia anterior/posterior dependendo de como foram salvas.
            // O mais seguro é buscar um range ampliado e filtrar no código ou garantir que o create salve UTC.

            // Mas, dado que estamos corrigindo o CREATE para salvar com Timezone correto, 
            // aqui podemos confiar no range extendido -3h / +3h se necessário.
            // Para simplificar: buscamos pelo checkIn string que DEVE bater com o dia.

            where.checkIn = {
                gte: new Date(new Date(dateParam).setUTCHours(0, 0, 0, 0)),
                lte: new Date(new Date(dateParam).setUTCHours(23, 59, 59, 999))
            }
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
                spaceName: r.cabin.name,
                cabin: { name: r.cabin.name }, // Adicionado para compatibilidade com Dashboard/Reservas
                spaceType: r.cabin.category.toLowerCase(),
                date: r.checkIn.toISOString().split('T')[0],
                time: checkInTime,
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
        })
    } catch (error) {
        console.error('Error fetching reservations:', error)
        return NextResponse.json(
            { error: 'Failed to fetch reservations' },
            { status: 500 }
        )
    }
}
