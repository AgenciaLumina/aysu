import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import prisma from '@/lib/db'
import {
    DEFAULT_GLOBAL_PRICE_OVERRIDES,
    DEFAULT_RESERVABLE_ITEMS,
    parseReservationGlobalConfig,
} from '@/lib/day-config'
import type { ApiResponse } from '@/lib/types'

const GLOBAL_CONFIG_ID = 'default'

function toJsonValueOrNull(value: unknown): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
    if (!value || typeof value !== 'object') return Prisma.JsonNull
    if (Array.isArray(value)) return value.length > 0 ? (value as Prisma.InputJsonValue) : Prisma.JsonNull
    return Object.keys(value).length > 0 ? (value as Prisma.InputJsonValue) : Prisma.JsonNull
}

export async function GET() {
    try {
        const config = await prisma.reservationGlobalConfig.findUnique({
            where: { id: GLOBAL_CONFIG_ID },
        })

        if (!config) {
            const created = await prisma.reservationGlobalConfig.create({
                data: {
                    id: GLOBAL_CONFIG_ID,
                    reservableItems: toJsonValueOrNull(DEFAULT_RESERVABLE_ITEMS),
                    priceOverrides: toJsonValueOrNull(DEFAULT_GLOBAL_PRICE_OVERRIDES),
                },
            })

            return NextResponse.json<ApiResponse>({
                success: true,
                data: parseReservationGlobalConfig(created),
            })
        }

        return NextResponse.json<ApiResponse>({
            success: true,
            data: parseReservationGlobalConfig(config),
        })
    } catch (error) {
        console.error('[Public Default Day Config GET Error]', error)
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Erro ao buscar configuração padrão' },
            { status: 500 }
        )
    }
}
