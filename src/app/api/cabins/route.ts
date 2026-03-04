// AISSU Beach Lounge - Cabins API
// GET/POST /api/cabins

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createCabinSchema } from '@/lib/validations'
import type { ApiResponse } from '@/lib/types'
import type { Cabin } from '@prisma/client'
import { CabinCategory, CabinVisibilityStatus, Prisma } from '@prisma/client'
import { getSpacePrefix, isSpaceSlug, resolveCabinSlugFromName } from '@/lib/space-slugs'

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

const DEFAULT_CABINS: Array<{
    name: string
    slug: string
    units: number
    capacity: number
    pricePerHour: number
    description: string
    imageUrl: string
    category: CabinCategory
    visibilityStatus: CabinVisibilityStatus
}> = [
    {
        name: 'Bangalô Lateral',
        slug: 'bangalo-lateral',
        units: 6,
        capacity: 5,
        pricePerHour: 166.67,
        category: CabinCategory.CABANA,
        description: 'Ideal para casais + amigos. 4-5 pessoas.',
        imageUrl: '/espacos/bangalo-lateral.jpg',
        visibilityStatus: CabinVisibilityStatus.AVAILABLE,
    },
    {
        name: 'Bangalô Piscina',
        slug: 'bangalo-piscina',
        units: 2,
        capacity: 6,
        pricePerHour: 300,
        category: CabinCategory.LOUNGE,
        description: 'Piscina privativa. 6 pessoas.',
        imageUrl: '/espacos/bangalo-piscina.jpg',
        visibilityStatus: CabinVisibilityStatus.AVAILABLE,
    },
    {
        name: 'Bangalô Frente Mar',
        slug: 'bangalo-frente-mar',
        units: 4,
        capacity: 8,
        pricePerHour: 300,
        category: CabinCategory.LOUNGE,
        description: 'Vista privilegiada. 6-8 pessoas.',
        imageUrl: '/espacos/bangalo-frente-mar.jpg',
        visibilityStatus: CabinVisibilityStatus.AVAILABLE,
    },
    {
        name: 'Bangalô Central',
        slug: 'bangalo-central',
        units: 1,
        capacity: 10,
        pricePerHour: 416.67,
        category: CabinCategory.VIP,
        description: 'Espaço icônico. Até 10 pessoas.',
        imageUrl: '/espacos/bangalo10.jpeg',
        visibilityStatus: CabinVisibilityStatus.AVAILABLE,
    },
    {
        name: 'Sunbed Casal',
        slug: 'sunbed-casal',
        units: 4,
        capacity: 2,
        pricePerHour: 83.33,
        category: CabinCategory.MESA,
        description: 'Cama de praia exclusiva para casais.',
        imageUrl: '/espacos/Sunbeds.jpeg',
        visibilityStatus: CabinVisibilityStatus.AVAILABLE,
    },
    {
        name: 'Mesa Restaurante',
        slug: 'mesa-restaurante',
        units: 4,
        capacity: 6,
        pricePerHour: 160,
        category: CabinCategory.MESA,
        description: 'Mesa interna para 4-6 pessoas.',
        imageUrl: '/espacos/bangalo-lateral.jpg',
        visibilityStatus: CabinVisibilityStatus.AVAILABLE,
    },
    {
        name: 'Mesa Praia',
        slug: 'mesa-praia',
        units: 4,
        capacity: 4,
        pricePerHour: 160,
        category: CabinCategory.MESA,
        description: 'Mesa pé na areia para 2-4 pessoas.',
        imageUrl: '/espacos/Sunbeds.jpeg',
        visibilityStatus: CabinVisibilityStatus.AVAILABLE,
    },
    {
        name: 'Day Use Praia com Espreguiçadeira',
        slug: 'day-use-praia',
        units: 20,
        capacity: 1,
        pricePerHour: 160,
        category: CabinCategory.MESA,
        description: 'Day Use com espreguiçadeira.',
        imageUrl: '/espacos/Sunbeds.jpeg',
        visibilityStatus: CabinVisibilityStatus.AVAILABLE,
    },
]

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

async function bootstrapDefaultCabinsIfEmpty() {
    const totalCabins = await prisma.cabin.count()
    if (totalCabins > 0) return

    await prisma.cabin.createMany({
        data: DEFAULT_CABINS,
        skipDuplicates: true,
    })
}

// GET - Lista cabins (público)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const isActive = searchParams.get('isActive')
        const category = searchParams.get('category')
        const visibilityStatus = searchParams.get('visibilityStatus')

        // Filtros
        const where: Prisma.CabinWhereInput = {}

        if (isActive !== null) {
            where.isActive = isActive === 'true'
        }

        if (category && Object.values(CabinCategory).includes(category as CabinCategory)) {
            where.category = category as CabinCategory
        }

        if (visibilityStatus && Object.values(CabinVisibilityStatus).includes(visibilityStatus as CabinVisibilityStatus)) {
            where.visibilityStatus = visibilityStatus as CabinVisibilityStatus
        }

        const fetchCabins = () => prisma.cabin.findMany({
            where,
            orderBy: [
                { category: 'asc' },
                { name: 'asc' },
            ],
        })

        let cabins: Cabin[]
        try {
            await bootstrapDefaultCabinsIfEmpty()
            cabins = await fetchCabins()
        } catch (error) {
            if (!isMissingCabinColumnError(error)) throw error
            await ensureCabinColumns()
            await bootstrapDefaultCabinsIfEmpty()
            cabins = await fetchCabins()
        }

        // Recuperação automática: se todos os espaços ficaram inativos por engano,
        // reativa e devolve a listagem normalmente.
        if (isActive === 'true' && cabins.length === 0) {
            const totalCabins = await prisma.cabin.count()
            if (totalCabins > 0) {
                await prisma.cabin.updateMany({
                    where: { isActive: false },
                    data: { isActive: true },
                })

                cabins = await prisma.cabin.findMany({
                    where,
                    orderBy: [
                        { category: 'asc' },
                        { name: 'asc' },
                    ],
                })
            }
        }

        return NextResponse.json<ApiResponse<Cabin[]>>({
            success: true,
            data: cabins,
        })
    } catch (error) {
        console.error('[Cabins GET Error]', error)
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Erro ao buscar bangalôs' },
            { status: 500 }
        )
    }
}

// POST - Cria novo cabin (admin)
export async function POST(request: NextRequest) {
    try {
        // TODO: Reativar auth em produção
        // const authUser = getAuthUser(request)
        // if (!authUser || !isAdmin(authUser)) {
        //     return NextResponse.json<ApiResponse>(
        //         { success: false, error: 'Acesso negado' },
        //         { status: 403 }
        //     )
        // }


        const body = await request.json()
        const validation = createCabinSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: validation.error.issues[0].message },
                { status: 400 }
            )
        }

        // Verifica se nome já existe
        const existing = await prisma.cabin.findUnique({
            where: { name: validation.data.name },
        })

        if (existing) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Já existe um bangalô com este nome' },
                { status: 409 }
            )
        }

        const inferredSlug = validation.data.slug?.trim() || resolveCabinSlugFromName(validation.data.name) || null

        if (inferredSlug && isSpaceSlug(inferredSlug)) {
            const existingSameType = await prisma.cabin.findFirst({
                where: {
                    isActive: true,
                    OR: [
                        { slug: inferredSlug },
                        { slug: null, name: { startsWith: getSpacePrefix(inferredSlug) } },
                    ],
                },
                select: { id: true },
            })

            if (existingSameType) {
                return NextResponse.json<ApiResponse>(
                    { success: false, error: 'Este tipo de espaço já existe. Edite a quantidade no cadastro existente.' },
                    { status: 409 }
                )
            }
        }

        let cabin: Cabin
        try {
            cabin = await prisma.cabin.create({
                data: {
                    ...validation.data,
                    slug: inferredSlug,
                },
            })
        } catch (error) {
            if (!isMissingCabinColumnError(error)) throw error
            await ensureCabinColumns()
            cabin = await prisma.cabin.create({
                data: {
                    ...validation.data,
                    slug: inferredSlug,
                },
            })
        }

        console.log({
            action: 'CABIN_CREATED',
            timestamp: new Date().toISOString(),
            cabinId: cabin.id,
            // userId: authUser.userId,
        })

        return NextResponse.json<ApiResponse<Cabin>>(
            {
                success: true,
                data: cabin,
                message: 'Bangalô criado com sucesso',
            },
            { status: 201 }
        )
    } catch (error) {
        console.error('[Cabins POST Error]', error)
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Erro ao criar bangalô' },
            { status: 500 }
        )
    }
}
