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
const CREATE_GLOBAL_CONFIG_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS "ReservationGlobalConfig" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "reservableItems" JSONB,
  "priceOverrides" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReservationGlobalConfig_pkey" PRIMARY KEY ("id")
)
`
const INSERT_DEFAULT_GLOBAL_CONFIG_SQL = `
INSERT INTO "ReservationGlobalConfig" ("id", "reservableItems", "priceOverrides")
VALUES ('default', '{"bangalos": true, "sunbeds": true, "restaurantTables": false, "beachTables": false, "dayUse": true}'::jsonb, '{}'::jsonb)
ON CONFLICT ("id") DO NOTHING
`

function toJsonValueOrNull(value: unknown): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
    if (!value || typeof value !== 'object') return Prisma.JsonNull
    if (Array.isArray(value)) return value.length > 0 ? (value as Prisma.InputJsonValue) : Prisma.JsonNull
    return Object.keys(value).length > 0 ? (value as Prisma.InputJsonValue) : Prisma.JsonNull
}

function isMissingGlobalConfigTableError(error: unknown): boolean {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code !== 'P2021') return false
        const cause = typeof error.meta?.cause === 'string' ? error.meta.cause.toLowerCase() : ''
        const table = typeof error.meta?.table === 'string' ? error.meta.table.toLowerCase() : ''
        return cause.includes('reservationglobalconfig') || table.includes('reservationglobalconfig') || true
    }

    const message = error instanceof Error ? error.message.toLowerCase() : ''
    return message.includes('reservationglobalconfig')
}

async function bootstrapGlobalConfigTableIfNeeded() {
    await prisma.$executeRawUnsafe(CREATE_GLOBAL_CONFIG_TABLE_SQL)
    await prisma.$executeRawUnsafe(INSERT_DEFAULT_GLOBAL_CONFIG_SQL)
}

async function ensureGlobalConfig() {
    try {
        return await prisma.reservationGlobalConfig.upsert({
            where: { id: GLOBAL_CONFIG_ID },
            update: {},
            create: {
                id: GLOBAL_CONFIG_ID,
                reservableItems: toJsonValueOrNull(DEFAULT_RESERVABLE_ITEMS),
                priceOverrides: toJsonValueOrNull(DEFAULT_GLOBAL_PRICE_OVERRIDES),
            },
        })
    } catch (error) {
        if (!isMissingGlobalConfigTableError(error)) {
            throw error
        }

        await bootstrapGlobalConfigTableIfNeeded()

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
}

export async function GET() {
    try {
        const config = await ensureGlobalConfig()

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
