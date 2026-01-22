// AISSU Beach Lounge - Events API
// GET/POST /api/events

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser, isAdmin } from '@/lib/auth'
import { createEventSchema, paginationSchema, eventFiltersSchema } from '@/lib/validations'
import type { ApiResponse, PaginatedResponse } from '@/lib/types'
import type { Event } from '@prisma/client'
import { Prisma } from '@prisma/client'

// GET - Lista eventos
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const params = Object.fromEntries(searchParams.entries())

        const pagination = paginationSchema.safeParse(params)
        const filters = eventFiltersSchema.safeParse(params)

        const page = pagination.success ? pagination.data.page : 1
        const limit = pagination.success ? pagination.data.limit : 20
        const skip = (page - 1) * limit

        // Constrói where
        const where: Prisma.EventWhereInput = {}

        if (filters.success) {
            const { eventType, isActive, isFeatured, startDate, endDate } = filters.data

            if (eventType) where.eventType = eventType
            if (isActive !== undefined) where.isActive = isActive
            if (isFeatured !== undefined) where.isFeatured = isFeatured

            if (startDate || endDate) {
                where.startDate = {}
                if (startDate) where.startDate.gte = new Date(startDate)
                if (endDate) where.startDate.lte = new Date(endDate)
            }
        }

        const [events, total] = await Promise.all([
            prisma.event.findMany({
                where,
                orderBy: { startDate: 'asc' },
                skip,
                take: limit,
            }),
            prisma.event.count({ where }),
        ])

        const response: PaginatedResponse<Event> = {
            success: true,
            data: events,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        }

        return NextResponse.json(response)
    } catch (error) {
        console.error('[Events GET Error]', error)
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Erro ao buscar eventos' },
            { status: 500 }
        )
    }
}

// POST - Cria evento (admin)
export async function POST(request: NextRequest) {
    try {
        const authUser = getAuthUser(request)

        if (!authUser || !isAdmin(authUser)) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Acesso negado' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const validation = createEventSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: validation.error.issues[0].message },
                { status: 400 }
            )
        }

        // Verifica se slug já existe
        const existing = await prisma.event.findUnique({
            where: { slug: validation.data.slug },
        })

        if (existing) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Já existe um evento com este slug' },
                { status: 409 }
            )
        }

        const event = await prisma.event.create({
            data: {
                ...validation.data,
                startDate: new Date(validation.data.startDate),
                endDate: validation.data.endDate ? new Date(validation.data.endDate) : null,
            },
        })

        console.log({
            action: 'EVENT_CREATED',
            timestamp: new Date().toISOString(),
            eventId: event.id,
            userId: authUser.userId,
        })

        return NextResponse.json<ApiResponse<Event>>(
            {
                success: true,
                data: event,
                message: 'Evento criado com sucesso',
            },
            { status: 201 }
        )
    } catch (error) {
        console.error('[Events POST Error]', error)
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Erro ao criar evento' },
            { status: 500 }
        )
    }
}
