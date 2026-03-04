// AISSU Beach Lounge - Cabin Detail API
// GET/PATCH /api/cabins/[id]

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { updateCabinSchema } from '@/lib/validations'
import type { ApiResponse } from '@/lib/types'
import type { Cabin } from '@prisma/client'
import { getSpacePrefix, isSpaceSlug, resolveCabinSlugFromName } from '@/lib/space-slugs'

interface RouteParams {
    params: Promise<{ id: string }>
}

// GET - Detalhes do cabin
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params

        const cabin = await prisma.cabin.findUnique({
            where: { id },
        })

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
        const existing = await prisma.cabin.findUnique({
            where: { id },
        })

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

        let mergedUnits = validation.data.units ?? existing.units

        if (inferredSlug) {
            const siblingWhere = isSpaceSlug(inferredSlug)
                ? {
                    OR: [
                        { slug: inferredSlug },
                        { slug: null, name: { startsWith: getSpacePrefix(inferredSlug) } },
                    ],
                }
                : { slug: inferredSlug }

            const siblings = await prisma.cabin.findMany({
                where: {
                    id: { not: id },
                    isActive: true,
                    ...siblingWhere,
                },
                select: {
                    id: true,
                    units: true,
                },
            })

            if (siblings.length > 0) {
                const siblingUnits = siblings.reduce((sum, sibling) => sum + Math.max(1, sibling.units || 1), 0)

                // Se o admin não definiu explicitamente a quantidade, preserva o estoque total ao consolidar.
                if (validation.data.units === undefined) {
                    mergedUnits = Math.max(1, mergedUnits) + siblingUnits
                }

                await prisma.cabin.updateMany({
                    where: { id: { in: siblings.map(sibling => sibling.id) } },
                    data: { isActive: false },
                })
            }
        }

        const cabin = await prisma.cabin.update({
            where: { id },
            data: {
                ...validation.data,
                slug: inferredSlug,
                units: mergedUnits,
            },
        })

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
