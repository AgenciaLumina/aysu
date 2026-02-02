// API: Get Reservations by Date
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
    try {

        const { searchParams } = new URL(request.url)
        const dateParam = searchParams.get('date') // YYYY-MM-DD

        if (!dateParam) {
            return NextResponse.json({ error: 'Date parameter required' }, { status: 400 })
        }

        const targetDate = new Date(dateParam)
        const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0))
        const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999))

        const reservations = await prisma.reservation.findMany({
            where: {
                checkIn: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
            },
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
                checkIn: 'asc',
            },
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
                spaceType: r.cabin.category.toLowerCase(),
                date: r.checkIn.toISOString().split('T')[0],
                time: checkInTime,
                totalPrice: Number(r.totalPrice),
                status,
                source: r.source === 'ONLINE' ? 'online' : 'manual',
                paymentStatus: r.payment?.status || null,
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
