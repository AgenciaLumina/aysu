// AISSU Beach Lounge - Reservations API
// GET/POST /api/reservations

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser, isAdmin } from '@/lib/auth'
import { createReservationSchema, paginationSchema, reservationFiltersSchema } from '@/lib/validations'
import { getHoursDifference } from '@/lib/utils'
import type { ApiResponse, PaginatedResponse, ReservationWithDetails } from '@/lib/types'
import { Prisma, ReservationStatus } from '@prisma/client'

// GET - Lista reservas (com filtros e paginação)
export async function GET(request: NextRequest) {
    try {
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
        const checkIn = new Date(data.checkIn)
        const checkOut = new Date(data.checkOut)

        // Validações de data
        if (checkIn >= checkOut) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Check-out deve ser após check-in' },
                { status: 400 }
            )
        }

        if (checkIn < new Date()) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Não é possível reservar no passado' },
                { status: 400 }
            )
        }

        // Verifica se cabin existe e está ativo
        const cabin = await prisma.cabin.findUnique({
            where: { id: data.cabinId },
        })

        if (!cabin || !cabin.isActive) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Bangalô não encontrado ou indisponível' },
                { status: 404 }
            )
        }

        // Verifica conflito de horário (double-booking)
        const conflictingReservation = await prisma.reservation.findFirst({
            where: {
                cabinId: data.cabinId,
                status: {
                    in: [
                        ReservationStatus.PENDING,
                        ReservationStatus.CONFIRMED,
                        ReservationStatus.CHECKED_IN,
                        ReservationStatus.IN_PROGRESS,
                    ],
                },
                OR: [
                    // Nova reserva começa durante outra
                    { AND: [{ checkIn: { lte: checkIn } }, { checkOut: { gt: checkIn } }] },
                    // Nova reserva termina durante outra
                    { AND: [{ checkIn: { lt: checkOut } }, { checkOut: { gte: checkOut } }] },
                    // Nova reserva engloba outra
                    { AND: [{ checkIn: { gte: checkIn } }, { checkOut: { lte: checkOut } }] },
                ],
            },
        })

        if (conflictingReservation) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Horário indisponível. Já existe uma reserva neste período.' },
                { status: 409 }
            )
        }

        // Calcula horas e preço
        const hoursBooked = getHoursDifference(checkIn, checkOut)
        const totalPrice = Number(cabin.pricePerHour) * hoursBooked

        // Verifica se veio de usuário autenticado (OFFLINE) ou público (ONLINE)
        const authUser = getAuthUser(request)
        const userId = authUser?.userId || null

        // Cria reserva
        const reservation = await prisma.reservation.create({
            data: {
                cabinId: data.cabinId,
                userId,
                customerName: data.customerName,
                customerEmail: data.customerEmail.toLowerCase(),
                customerPhone: data.customerPhone,
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
