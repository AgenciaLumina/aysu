// AISSU Beach Lounge - Reservations API
// GET/POST /api/reservations

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
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

        // Lógica de Atribuição Inteligente de Bangalô
        let cabinId = data.cabinId
        let cabin

        // Se for UUID, busca direto
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cabinId)

        if (isUuid) {
            cabin = await prisma.cabin.findUnique({ where: { id: cabinId } })
        } else {
            // Se for Slug, busca uma unidade disponível do tipo
            // Mapeamento Slug -> Prefixo do Nome no Banco (ver seed.ts)
            const slugMap: Record<string, string> = {
                'bangalo-lateral': 'Bangalô Lateral',
                'bangalo-piscina': 'Bangalô Piscina',
                'bangalo-frente-mar': 'Bangalô Frente Mar',
                'bangalo-central': 'Bangalô Central',
                'sunbed-casal': 'Sunbed Casal',
            }

            const namePrefix = slugMap[cabinId]

            if (!namePrefix) {
                return NextResponse.json<ApiResponse>(
                    { success: false, error: 'Tipo de acomodação inválido' },
                    { status: 400 }
                )
            }

            // 1. Busca todas as unidades desse tipo
            const candidates = await prisma.cabin.findMany({
                where: {
                    name: { startsWith: namePrefix },
                    isActive: true
                }
            })

            if (candidates.length === 0) {
                return NextResponse.json<ApiResponse>(
                    { success: false, error: 'Nenhuma unidade encontrada para este tipo' },
                    { status: 404 }
                )
            }

            // 2. Para cada candidato, verifica se está livre
            for (const candidate of candidates) {
                const conflicts = await prisma.reservation.count({
                    where: {
                        cabinId: candidate.id,
                        status: {
                            in: ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS']
                        },
                        OR: [
                            { AND: [{ checkIn: { lte: checkIn } }, { checkOut: { gt: checkIn } }] },
                            { AND: [{ checkIn: { lt: checkOut } }, { checkOut: { gte: checkOut } }] },
                            { AND: [{ checkIn: { gte: checkIn } }, { checkOut: { lte: checkOut } }] },
                        ]
                    }
                })

                if (conflicts === 0) {
                    cabin = candidate
                    cabinId = candidate.id
                    break // Encontrou um livre!
                }
            }

            // Se cabin ainda é null, significa que todos estão ocupados
            if (!cabin) {
                return NextResponse.json<ApiResponse>(
                    { success: false, error: 'Não há disponibilidade para este tipo de acomodação na data selecionada.' },
                    { status: 409 }
                )
            }
        }

        if (!cabin || !cabin.isActive) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Bangalô não encontrado ou indisponível' },
                { status: 404 }
            )
        }

        // Verifica conflito de horário (double-booking)
        const conflictingReservation = await prisma.reservation.findFirst({
            where: {
                cabinId: cabinId, // Agora usa o ID resolvido (UUID)
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

        // Calcula horas
        const hoursBooked = getHoursDifference(checkIn, checkOut)

        // Se o frontend enviou totalPrice, usa ele (day use com preço fixo)
        // Senão, calcula por hora (fallback para casos especiais)
        const totalPrice = data.totalPrice ?? (Number(cabin.pricePerHour) * hoursBooked)

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
