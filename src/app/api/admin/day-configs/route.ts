import { randomUUID } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import prisma from '@/lib/db'
import { lockCommercialSettings } from '@/lib/reservation-locks'
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
            select: { id: true, commercialPeriodId: true },
        })

        const baseData = {
            status: payload.status,
            reservationsEnabled: payload.status === 'WAITING_RELEASE' ? false : payload.reservationsEnabled,
            title: payload.title?.trim() || null,
            release: payload.release?.trim() || null,
            flyerImageUrl: payload.flyerImageUrl?.trim() || null,
            highlightOnHome: payload.highlightOnHome,
            priceOverrides: toJsonValueOrNull(payload.priceOverrides),
            ...(payload.commercialConditions !== undefined ? { commercialConditions: toJsonValueOrNull(payload.commercialConditions) } : {}),
            ticketLots: toJsonValueOrNull(ticketLots),
            reservableItems: toJsonValueOrNull(payload.reservableItems ?? DEFAULT_RESERVABLE_ITEMS),
        }

        const endDate = payload.endDate || payload.date
        if (dbDate.toISOString().slice(0, 10) !== payload.date || toDbDate(endDate).toISOString().slice(0, 10) !== endDate) return NextResponse.json({ success: false, error: 'Data inválida.' }, { status: 400 })
        const days = Math.round((toDbDate(endDate).getTime() - dbDate.getTime()) / 86400000)
        if (days < 0 || days > 366 || Number.isNaN(days)) {
            return NextResponse.json({ success: false, error: 'Selecione um período válido de até um ano.' }, { status: 400 })
        }
        const periodId = days > 0 ? existingConfig?.commercialPeriodId || randomUUID() : null
        const dates = Array.from({ length: days + 1 }, (_, index) => new Date(dbDate.getTime() + index * 86400000))
        const savedDates = await prisma.$transaction(async tx => {
            await lockCommercialSettings(tx)
            const saved = []
            for (const date of dates) {
                const current = await tx.reservationDayConfig.findUnique({ where: { date } })
                if (days > 0 && current && current.commercialPeriodId !== periodId && (current.status !== 'NORMAL' || existingConfig?.commercialPeriodId)) continue
                saved.push(await tx.reservationDayConfig.upsert({ where: { date }, update: { ...baseData, commercialPeriodId: periodId }, create: { date, ...baseData, commercialPeriodId: periodId } }))
            }
            return saved
        }, { timeout: 15000 })
        const saved = savedDates[0]
        if (!saved) return NextResponse.json({ success: false, error: 'O período contém somente eventos ou bloqueios. Edite essas datas individualmente.' }, { status: 409 })

        return NextResponse.json<ApiResponse>({
            success: true,
            data: parseDayConfig(saved),
            message: days > 0 ? `Condições salvas para ${savedDates.length} datas. Eventos e bloqueios existentes foram preservados.` : existingConfig
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
