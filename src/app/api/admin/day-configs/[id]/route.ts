import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import prisma from '@/lib/db'
import { canManageReservations, getAuthUser } from '@/lib/auth'
import { DEFAULT_RESERVABLE_ITEMS, parseDayConfig, parseTicketLots, toDbDate } from '@/lib/day-config'
import { updateDayConfigSchema } from '@/lib/validations'
import type { ApiResponse } from '@/lib/types'

interface RouteParams {
    params: Promise<{ id: string }>
}

function toJsonValueOrNull(value: unknown): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
    if (!value || typeof value !== 'object') return Prisma.JsonNull
    if (Array.isArray(value)) return value.length > 0 ? (value as Prisma.InputJsonValue) : Prisma.JsonNull
    return Object.keys(value).length > 0 ? (value as Prisma.InputJsonValue) : Prisma.JsonNull
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const authUser = getAuthUser(request)
        if (!canManageReservations(authUser)) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Acesso negado' },
                { status: 403 }
            )
        }

        const { id } = await params
        const body = await request.json()
        const validation = updateDayConfigSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: validation.error.issues[0].message },
                { status: 400 }
            )
        }

        const payload = validation.data

        const existing = await prisma.reservationDayConfig.findUnique({
            where: { id },
        })

        if (!existing) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Configuração não encontrada' },
                { status: 404 }
            )
        }

        const ticketLots = payload.ticketLots ? parseTicketLots(payload.ticketLots) : undefined

        const updated = await prisma.reservationDayConfig.update({
            where: { id },
            data: {
                ...(payload.date ? { date: toDbDate(payload.date) } : {}),
                ...(payload.status ? { status: payload.status } : {}),
                ...(payload.reservationsEnabled !== undefined ? { reservationsEnabled: payload.reservationsEnabled } : {}),
                ...(payload.title !== undefined ? { title: payload.title?.trim() || null } : {}),
                ...(payload.release !== undefined ? { release: payload.release?.trim() || null } : {}),
                ...(payload.flyerImageUrl !== undefined ? { flyerImageUrl: payload.flyerImageUrl?.trim() || null } : {}),
                ...(payload.highlightOnHome !== undefined ? { highlightOnHome: payload.highlightOnHome } : {}),
                ...(payload.priceOverrides !== undefined
                    ? { priceOverrides: toJsonValueOrNull(payload.priceOverrides) }
                    : {}),
                ...(ticketLots !== undefined
                    ? { ticketLots: toJsonValueOrNull(ticketLots) }
                    : {}),
                ...(payload.reservableItems !== undefined
                    ? {
                        reservableItems: toJsonValueOrNull(payload.reservableItems)
                    }
                    : {}),
            },
        })

        return NextResponse.json<ApiResponse>({
            success: true,
            data: parseDayConfig(updated),
            message: 'Configuração atualizada com sucesso',
        })
    } catch (error: unknown) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Já existe configuração para esta data' },
                { status: 409 }
            )
        }

        console.error('[Admin Day Config PATCH Error]', error)
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Erro ao atualizar configuração de calendário' },
            { status: 500 }
        )
    }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const authUser = getAuthUser(request)
        if (!canManageReservations(authUser)) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Acesso negado' },
                { status: 403 }
            )
        }

        const { id } = await params

        const existing = await prisma.reservationDayConfig.findUnique({
            where: { id },
        })

        if (!existing) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Configuração não encontrada' },
                { status: 404 }
            )
        }

        await prisma.reservationDayConfig.delete({
            where: { id },
        })

        return NextResponse.json<ApiResponse>({
            success: true,
            message: 'Configuração removida com sucesso',
        })
    } catch (error) {
        console.error('[Admin Day Config DELETE Error]', error)
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Erro ao remover configuração de calendário' },
            { status: 500 }
        )
    }
}
