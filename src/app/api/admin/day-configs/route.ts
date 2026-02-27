import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import prisma from '@/lib/db'
import { canManageReservations, getAuthUser } from '@/lib/auth'
import { DEFAULT_RESERVABLE_ITEMS, parseDayConfig, parseTicketLots, toDbDate } from '@/lib/day-config'
import { createDayConfigSchema } from '@/lib/validations'
import type { ApiResponse } from '@/lib/types'

function toJsonValueOrNull(value: unknown): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
    if (!value || typeof value !== 'object') return Prisma.JsonNull
    if (Array.isArray(value)) return value.length > 0 ? (value as Prisma.InputJsonValue) : Prisma.JsonNull
    return Object.keys(value).length > 0 ? (value as Prisma.InputJsonValue) : Prisma.JsonNull
}

export async function GET(request: NextRequest) {
    try {
        const authUser = getAuthUser(request)
        if (!canManageReservations(authUser)) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Acesso negado' },
                { status: 403 }
            )
        }

        const dayConfigs = await prisma.reservationDayConfig.findMany({
            orderBy: { date: 'asc' },
        })

        return NextResponse.json<ApiResponse>({
            success: true,
            data: dayConfigs.map(parseDayConfig),
        })
    } catch (error) {
        console.error('[Admin Day Configs GET Error]', error)
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Erro ao buscar configurações do calendário' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const authUser = getAuthUser(request)
        if (!canManageReservations(authUser)) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Acesso negado' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const validation = createDayConfigSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: validation.error.issues[0].message },
                { status: 400 }
            )
        }

        const payload = validation.data
        const dbDate = toDbDate(payload.date)
        const ticketLots = parseTicketLots(payload.ticketLots)

        const existingConfig = await prisma.reservationDayConfig.findUnique({
            where: { date: dbDate },
            select: { id: true },
        })

        const baseData = {
            status: payload.status,
            reservationsEnabled: payload.reservationsEnabled,
            title: payload.title?.trim() || null,
            release: payload.release?.trim() || null,
            flyerImageUrl: payload.flyerImageUrl?.trim() || null,
            highlightOnHome: payload.highlightOnHome,
            priceOverrides: toJsonValueOrNull(payload.priceOverrides),
            ticketLots: toJsonValueOrNull(ticketLots),
            reservableItems: toJsonValueOrNull(payload.reservableItems ?? DEFAULT_RESERVABLE_ITEMS),
        }

        const saved = existingConfig
            ? await prisma.reservationDayConfig.update({
                where: { id: existingConfig.id },
                data: baseData,
            })
            : await prisma.reservationDayConfig.create({
                data: {
                    date: dbDate,
                    ...baseData,
                },
            })

        return NextResponse.json<ApiResponse>({
            success: true,
            data: parseDayConfig(saved),
            message: existingConfig
                ? 'Configuração desta data atualizada com sucesso'
                : 'Configuração de data criada com sucesso',
        }, { status: existingConfig ? 200 : 201 })
    } catch (error: unknown) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Já existe configuração para esta data' },
                { status: 409 }
            )
        }

        console.error('[Admin Day Configs POST Error]', error)
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Erro ao criar configuração de calendário' },
            { status: 500 }
        )
    }
}
