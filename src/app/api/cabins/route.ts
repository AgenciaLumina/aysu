// AISSU Beach Lounge - Cabins API
// GET/POST /api/cabins

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createCabinSchema } from '@/lib/validations'
import type { ApiResponse } from '@/lib/types'
import type { Cabin } from '@prisma/client'
import { CabinCategory, Prisma } from '@prisma/client'
import { getSpacePrefix, isSpaceSlug, resolveCabinSlugFromName } from '@/lib/space-slugs'

// GET - Lista cabins (público)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const isActive = searchParams.get('isActive')
        const category = searchParams.get('category')

        // Filtros
        const where: Prisma.CabinWhereInput = {}

        if (isActive !== null) {
            where.isActive = isActive === 'true'
        }

        if (category && Object.values(CabinCategory).includes(category as CabinCategory)) {
            where.category = category as CabinCategory
        }

        const cabins = await prisma.cabin.findMany({
            where,
            orderBy: [
                { category: 'asc' },
                { name: 'asc' },
            ],
        })

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

        const cabin = await prisma.cabin.create({
            data: {
                ...validation.data,
                slug: inferredSlug,
            },
        })

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
