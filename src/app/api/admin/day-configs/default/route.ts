import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import prisma from '@/lib/db'
import { canManageReservations, getAuthUser } from '@/lib/auth'
import {
    DEFAULT_GLOBAL_PRICE_OVERRIDES,
    DEFAULT_RESERVABLE_ITEMS,
    parseReservationGlobalConfig,
} from '@/lib/day-config'
import { updateReservationGlobalConfigSchema } from '@/lib/validations'
import type { ApiResponse } from '@/lib/types'

const GLOBAL_CONFIG_ID = 'default'

function toJsonValueOrNull(value: unknown): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
    if (!value || typeof value !== 'object') return Prisma.JsonNull
    if (Array.isArray(value)) return value.length > 0 ? (value as Prisma.InputJsonValue) : Prisma.JsonNull
    return Object.keys(value).length > 0 ? (value as Prisma.InputJsonValue) : Prisma.JsonNull
}

async function ensureGlobalConfig() {
    return prisma.reservationGlobalConfig.upsert({
        where: { id: GLOBAL_CONFIG_ID },
        update: {},
        create: {
            id: GLOBAL_CONFIG_ID,
            reservableItems: toJsonValueOrNull(DEFAULT_RESERVABLE_ITEMS),
            priceOverrides: toJsonValueOrNull(DEFAULT_GLOBAL_PRICE_OVERRIDES),
        },
    })
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

        const config = await ensureGlobalConfig()

        return NextResponse.json<ApiResponse>({
            success: true,
            data: parseReservationGlobalConfig(config),
        })
    } catch (error) {
        console.error('[Admin Default Day Config GET Error]', error)
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Erro ao buscar configuração padrão' },
            { status: 500 }
        )
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const authUser = getAuthUser(request)
        if (!canManageReservations(authUser)) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Acesso negado' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const validation = updateReservationGlobalConfigSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: validation.error.issues[0].message },
                { status: 400 }
            )
        }

        await ensureGlobalConfig()

        const payload = validation.data
        const updated = await prisma.reservationGlobalConfig.update({
            where: { id: GLOBAL_CONFIG_ID },
            data: {
                ...(payload.reservableItems !== undefined
                    ? { reservableItems: toJsonValueOrNull(payload.reservableItems) }
                    : {}),
                ...(payload.priceOverrides !== undefined
                    ? { priceOverrides: toJsonValueOrNull(payload.priceOverrides) }
                    : {}),
            },
        })

        return NextResponse.json<ApiResponse>({
            success: true,
            data: parseReservationGlobalConfig(updated),
            message: 'Configuração padrão atualizada com sucesso',
        })
    } catch (error) {
        console.error('[Admin Default Day Config PATCH Error]', error)
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Erro ao atualizar configuração padrão' },
            { status: 500 }
        )
    }
}
