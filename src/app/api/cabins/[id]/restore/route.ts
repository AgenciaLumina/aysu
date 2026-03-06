import { NextRequest, NextResponse } from 'next/server'
import { CabinVisibilityStatus, Prisma, type Cabin } from '@prisma/client'
import { prisma } from '@/lib/db'
import type { ApiResponse } from '@/lib/types'
import { getCabinGroupKey, listCabinGroupMembers } from '@/lib/cabin-groups'
import { buildDeletedCabinName } from '@/lib/cabin-trash'

interface RouteParams {
    params: Promise<{ id: string }>
}

const ENSURE_CABIN_COLUMNS_SQL = `
ALTER TABLE "Cabin"
  ADD COLUMN IF NOT EXISTS "slug" TEXT,
  ADD COLUMN IF NOT EXISTS "units" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deletedOriginalName" TEXT;
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

const ENSURE_CABIN_DELETED_VISIBILITY_COLUMN_SQL = `
ALTER TABLE "Cabin"
  ADD COLUMN IF NOT EXISTS "deletedVisibilityStatus" "CabinVisibilityStatus";
`

const ENSURE_CABIN_SLUG_INDEX_SQL = `CREATE INDEX IF NOT EXISTS "Cabin_slug_idx" ON "Cabin"("slug");`
const ENSURE_CABIN_VISIBILITY_INDEX_SQL = `CREATE INDEX IF NOT EXISTS "Cabin_visibilityStatus_idx" ON "Cabin"("visibilityStatus");`
const ENSURE_CABIN_DELETED_ORIGINAL_NAME_INDEX_SQL = `CREATE INDEX IF NOT EXISTS "Cabin_deletedOriginalName_idx" ON "Cabin"("deletedOriginalName");`
const ENSURE_CABIN_DELETED_VISIBILITY_INDEX_SQL = `CREATE INDEX IF NOT EXISTS "Cabin_deletedVisibilityStatus_idx" ON "Cabin"("deletedVisibilityStatus");`
const ENSURE_CABIN_DELETED_AT_INDEX_SQL = `CREATE INDEX IF NOT EXISTS "Cabin_deletedAt_idx" ON "Cabin"("deletedAt");`

function isMissingCabinColumnError(error: unknown): boolean {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code !== 'P2022') return false
        const column = typeof error.meta?.column === 'string' ? error.meta.column.toLowerCase() : ''
        return column.includes('slug') || column.includes('units') || column.includes('visibilitystatus') || column.includes('deletedoriginalname') || column.includes('deletedvisibilitystatus') || column.includes('deletedat') || column.includes('cabin')
    }

    const message = error instanceof Error ? error.message.toLowerCase() : ''
    return message.includes('column') && (message.includes('slug') || message.includes('units') || message.includes('visibilitystatus') || message.includes('deletedoriginalname') || message.includes('deletedvisibilitystatus') || message.includes('deletedat'))
}

async function ensureCabinColumns() {
    await prisma.$executeRawUnsafe(ENSURE_CABIN_COLUMNS_SQL)
    await prisma.$executeRawUnsafe(ENSURE_CABIN_VISIBILITY_ENUM_SQL)
    await prisma.$executeRawUnsafe(ENSURE_CABIN_VISIBILITY_COLUMN_SQL)
    await prisma.$executeRawUnsafe(ENSURE_CABIN_DELETED_VISIBILITY_COLUMN_SQL)
    await prisma.$executeRawUnsafe(ENSURE_CABIN_SLUG_INDEX_SQL)
    await prisma.$executeRawUnsafe(ENSURE_CABIN_VISIBILITY_INDEX_SQL)
    await prisma.$executeRawUnsafe(ENSURE_CABIN_DELETED_ORIGINAL_NAME_INDEX_SQL)
    await prisma.$executeRawUnsafe(ENSURE_CABIN_DELETED_VISIBILITY_INDEX_SQL)
    await prisma.$executeRawUnsafe(ENSURE_CABIN_DELETED_AT_INDEX_SQL)
}

async function findDeletedGroupMembers(cabin: Pick<Cabin, 'id' | 'name' | 'slug' | 'deletedAt'>): Promise<Cabin[]> {
    if (!cabin.deletedAt) return []

    const cabins = await prisma.cabin.findMany({
        where: { deletedAt: cabin.deletedAt },
        orderBy: [
            { updatedAt: 'desc' },
            { createdAt: 'desc' },
        ],
    })

    return listCabinGroupMembers(cabins, cabin)
}

export async function POST(_request: NextRequest, { params }: RouteParams) {
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

        if (!existing.deletedAt) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Este espaço não está na lixeira' },
                { status: 409 }
            )
        }

        const groupMembers = await findDeletedGroupMembers(existing)
        const groupIds = new Set(groupMembers.map((cabin) => cabin.id))
        const groupKey = getCabinGroupKey(existing)

        const activeCabins = await prisma.cabin.findMany({
            where: {
                isActive: true,
                deletedAt: null,
            },
            select: {
                id: true,
                name: true,
                slug: true,
            },
        })

        const conflict = activeCabins.find((cabin) => {
            if (groupIds.has(cabin.id)) return false
            return getCabinGroupKey(cabin) === groupKey
        })

        if (conflict) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Já existe um espaço ativo deste tipo. Exclua ou ajuste o cadastro atual antes de restaurar.' },
                { status: 409 }
            )
        }

        const primaryCabinId = groupIds.has(existing.id) ? existing.id : groupMembers[0]?.id
        if (!primaryCabinId) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Nenhum item encontrado para restaurar' },
                { status: 404 }
            )
        }

        const primaryCabin = groupMembers.find((cabin) => cabin.id === primaryCabinId) ?? existing
        const restoredName = primaryCabin.deletedOriginalName || primaryCabin.name

        const siblingIds = groupMembers
            .filter((cabin) => cabin.id !== primaryCabinId)
            .map((cabin) => cabin.id)

        const sameNameConflict = await prisma.cabin.findFirst({
            where: {
                name: restoredName,
                deletedAt: null,
                NOT: { id: primaryCabinId },
            },
            select: { id: true },
        })

        if (sameNameConflict) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Já existe outro espaço com este mesmo nome fora da lixeira.' },
                { status: 409 }
            )
        }

        const restoredCabin = await prisma.$transaction(async (tx) => {
            const restored = await tx.cabin.update({
                where: { id: primaryCabinId },
                data: {
                    name: restoredName,
                    deletedAt: null,
                    isActive: true,
                    deletedOriginalName: null,
                    deletedVisibilityStatus: null,
                    visibilityStatus: primaryCabin.deletedVisibilityStatus || CabinVisibilityStatus.AVAILABLE,
                },
            })

            if (siblingIds.length > 0) {
                for (const cabin of groupMembers.filter((item) => siblingIds.includes(item.id))) {
                    await tx.cabin.update({
                        where: { id: cabin.id },
                        data: {
                            name: buildDeletedCabinName(cabin.deletedOriginalName || cabin.name, cabin.id),
                            deletedAt: null,
                            isActive: false,
                            deletedVisibilityStatus: null,
                            visibilityStatus: CabinVisibilityStatus.HIDDEN,
                        },
                    })
                }
            }

            return restored
        })

        return NextResponse.json<ApiResponse<Cabin>>({
            success: true,
            data: restoredCabin,
            message: 'Espaço restaurado com sucesso',
        })
    } catch (error) {
        console.error('[Cabin Restore Error]', error)
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Erro ao restaurar espaço' },
            { status: 500 }
        )
    }
}
