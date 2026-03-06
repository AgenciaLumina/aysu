// AISSU Beach Lounge - Cabin Detail API
// GET/PATCH /api/cabins/[id]

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { updateCabinSchema } from '@/lib/validations'
import type { ApiResponse } from '@/lib/types'
import { CabinVisibilityStatus, Prisma, type Cabin } from '@prisma/client'
import { resolveCabinSlugFromName } from '@/lib/space-slugs'
import { getCabinGroupKey, getNormalizedCabinUnits, listCabinGroupMembers, sumCabinUnits } from '@/lib/cabin-groups'

interface RouteParams {
    params: Promise<{ id: string }>
}

const ENSURE_CABIN_COLUMNS_SQL = `
ALTER TABLE "Cabin"
  ADD COLUMN IF NOT EXISTS "slug" TEXT,
  ADD COLUMN IF NOT EXISTS "units" INTEGER NOT NULL DEFAULT 1;
`

const ENSURE_CABIN_VISIBILITY_ENUM_SQL = `
DO $$ BEGIN
  CREATE TYPE "CabinVisibilityStatus" AS ENUM ('AVAILABLE', 'UNAVAILABLE', 'HIDDEN');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
`

const ENSURE_CABIN_VISIBILITY_COLUMN_SQL = `
ALTER TABLE "Cabin"
  ADD COLUMN IF NOT EXISTS "visibilityStatus" "CabinVisibilityStatus" NOT NULL DEFAULT 'AVAILABLE';
`

const ENSURE_CABIN_SLUG_INDEX_SQL = `CREATE INDEX IF NOT EXISTS "Cabin_slug_idx" ON "Cabin"("slug");`
const ENSURE_CABIN_VISIBILITY_INDEX_SQL = `CREATE INDEX IF NOT EXISTS "Cabin_visibilityStatus_idx" ON "Cabin"("visibilityStatus");`

function isMissingCabinColumnError(error: unknown): boolean {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code !== 'P2022') return false
        const column = typeof error.meta?.column === 'string' ? error.meta.column.toLowerCase() : ''
        return column.includes('slug') || column.includes('units') || column.includes('visibilitystatus') || column.includes('cabin')
    }

    const message = error instanceof Error ? error.message.toLowerCase() : ''
    return message.includes('column') && (message.includes('slug') || message.includes('units') || message.includes('visibilitystatus'))
}

async function ensureCabinColumns() {
    await prisma.$executeRawUnsafe(ENSURE_CABIN_COLUMNS_SQL)
    await prisma.$executeRawUnsafe(ENSURE_CABIN_VISIBILITY_ENUM_SQL)
    await prisma.$executeRawUnsafe(ENSURE_CABIN_VISIBILITY_COLUMN_SQL)
    await prisma.$executeRawUnsafe(ENSURE_CABIN_SLUG_INDEX_SQL)
    await prisma.$executeRawUnsafe(ENSURE_CABIN_VISIBILITY_INDEX_SQL)
}

async function findCabinGroupMembers(cabin: Pick<Cabin, 'id' | 'name' | 'slug'>): Promise<Cabin[]> {
    const cabins = await prisma.cabin.findMany({
        orderBy: [
            { updatedAt: 'desc' },
            { createdAt: 'desc' },
        ],
    })

    return listCabinGroupMembers(cabins, cabin)
}

// GET - Detalhes do cabin
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params

        let cabin: Cabin | null
        try {
            cabin = await prisma.cabin.findUnique({
                where: { id },
            })
        } catch (error) {
            if (!isMissingCabinColumnError(error)) throw error
            await ensureCabinColumns()
            cabin = await prisma.cabin.findUnique({
                where: { id },
            })
        }

        if (!cabin) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Bangalô não encontrado' },
                { status: 404 }
            )
        }

        return NextResponse.json<ApiResponse<Cabin>>({
            success: true,
            data: cabin,
        })
    } catch (error) {
        console.error('[Cabin GET Error]', error)
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Erro ao buscar bangalô' },
            { status: 500 }
        )
    }
}

// PATCH - Atualiza cabin
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        // TODO: Reativar auth em produção
        // const authUser = getAuthUser(request)
        // if (!authUser || !isAdmin(authUser)) {
        //     return NextResponse.json<ApiResponse>({ success: false, error: 'Acesso negado' }, { status: 403 })
        // }

        const body = await request.json()
        const validation = updateCabinSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: validation.error.issues[0].message },
                { status: 400 }
            )
        }

        // Verifica se existe
        let existing: Cabin | null
        try {
            existing = await prisma.cabin.findUnique({
                where: { id },
            })
        } catch (error) {
            if (!isMissingCabinColumnError(error)) throw error
            await ensureCabinColumns()
            existing = await prisma.cabin.findUnique({
                where: { id },
            })
        }

        if (!existing) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Bangalô não encontrado' },
                { status: 404 }
            )
        }

        // Se mudou o nome, verifica duplicidade
        if (validation.data.name && validation.data.name !== existing.name) {
            const nameConflict = await prisma.cabin.findUnique({
                where: { name: validation.data.name },
            })

            if (nameConflict) {
                return NextResponse.json<ApiResponse>(
                    { success: false, error: 'Já existe um bangalô com este nome' },
                    { status: 409 }
                )
            }
        }

        const nextName = validation.data.name ?? existing.name
        const inferredSlug = validation.data.slug?.trim() || resolveCabinSlugFromName(nextName) || existing.slug || null
        const currentGroupMembers = await findCabinGroupMembers(existing)
        const currentGroupIds = new Set(currentGroupMembers.map((cabin) => cabin.id))
        const currentActiveGroupMembers = currentGroupMembers.filter((cabin) => cabin.isActive)
        const currentGroupUnits = currentActiveGroupMembers.length > 0
            ? sumCabinUnits(currentActiveGroupMembers)
            : getNormalizedCabinUnits(existing.units)
        const desiredUnits = validation.data.units ?? currentGroupUnits
        const nextGroupKey = getCabinGroupKey({
            id,
            name: nextName,
            slug: inferredSlug,
        })

        if (nextGroupKey !== getCabinGroupKey(existing)) {
            const allCabins = await prisma.cabin.findMany({
                where: { isActive: true },
                select: { id: true, name: true, slug: true },
            })

            const conflict = allCabins.find((cabin) => {
                if (currentGroupIds.has(cabin.id)) return false
                return getCabinGroupKey(cabin) === nextGroupKey
            })

            if (conflict) {
                return NextResponse.json<ApiResponse>(
                    { success: false, error: 'Já existe outro espaço ativo para este tipo. Edite o cadastro existente.' },
                    { status: 409 }
                )
            }
        }

        let cabin: Cabin
        try {
            cabin = await prisma.$transaction(async (tx) => {
                const updatedCabin = await tx.cabin.update({
                    where: { id },
                    data: {
                        ...validation.data,
                        name: nextName,
                        slug: inferredSlug,
                        units: desiredUnits,
                    },
                })

                const siblingIds = currentGroupMembers
                    .filter((groupCabin) => groupCabin.id !== id)
                    .map((groupCabin) => groupCabin.id)

                if (siblingIds.length > 0) {
                    await tx.cabin.updateMany({
                        where: { id: { in: siblingIds } },
                        data: {
                            isActive: false,
                            visibilityStatus: CabinVisibilityStatus.HIDDEN,
                        },
                    })
                }

                return updatedCabin
            })
        } catch (error) {
            if (!isMissingCabinColumnError(error)) throw error
            await ensureCabinColumns()
            cabin = await prisma.$transaction(async (tx) => {
                const updatedCabin = await tx.cabin.update({
                    where: { id },
                    data: {
                        ...validation.data,
                        name: nextName,
                        slug: inferredSlug,
                        units: desiredUnits,
                    },
                })

                const siblingIds = currentGroupMembers
                    .filter((groupCabin) => groupCabin.id !== id)
                    .map((groupCabin) => groupCabin.id)

                if (siblingIds.length > 0) {
                    await tx.cabin.updateMany({
                        where: { id: { in: siblingIds } },
                        data: {
                            isActive: false,
                            visibilityStatus: CabinVisibilityStatus.HIDDEN,
                        },
                    })
                }

                return updatedCabin
            })
        }

        console.log({
            action: 'CABIN_UPDATED',
            timestamp: new Date().toISOString(),
            cabinId: id,
            // userId: authUser.userId,
        })

        return NextResponse.json<ApiResponse<Cabin>>({
            success: true,
            data: cabin,
            message: 'Bangalô atualizado com sucesso',
        })
    } catch (error) {
        console.error('[Cabin PATCH Error]', error)
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Erro ao atualizar bangalô' },
            { status: 500 }
        )
    }
}

// DELETE - Remove cabin logicamente (grupo inteiro)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params

        let existing: Cabin | null
        try {
            existing = await prisma.cabin.findUnique({
                where: { id },
            })
        } catch (error) {
            if (!isMissingCabinColumnError(error)) throw error
            await ensureCabinColumns()
            existing = await prisma.cabin.findUnique({
                where: { id },
            })
        }

        if (!existing) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Espaço não encontrado' },
                { status: 404 }
            )
        }

        const groupMembers = await findCabinGroupMembers(existing)
        const groupIds = groupMembers.map((cabin) => cabin.id)

        await prisma.cabin.updateMany({
            where: { id: { in: groupIds } },
            data: {
                isActive: false,
                visibilityStatus: CabinVisibilityStatus.HIDDEN,
            },
        })

        return NextResponse.json<ApiResponse>({
            success: true,
            message: 'Espaço excluído com sucesso',
        })
    } catch (error) {
        console.error('[Cabin DELETE Error]', error)
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Erro ao excluir espaço' },
            { status: 500 }
        )
    }
}
