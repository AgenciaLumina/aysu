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
