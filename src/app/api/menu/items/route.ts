// AISSU Beach Lounge - Menu Items API
// GET/POST /api/menu/items

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser, canManageMenu } from '@/lib/auth'
import { createMenuItemSchema, paginationSchema, menuFiltersSchema } from '@/lib/validations'
import type { ApiResponse, PaginatedResponse } from '@/lib/types'
import type { MenuItem } from '@prisma/client'
import { Prisma } from '@prisma/client'

// GET - Lista itens do cardápio
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const params = Object.fromEntries(searchParams.entries())

        const pagination = paginationSchema.safeParse(params)
        const filters = menuFiltersSchema.safeParse(params)

        const page = pagination.success ? pagination.data.page : 1
        const limit = pagination.success ? pagination.data.limit : 50
        const skip = (page - 1) * limit

        // Constrói where
        const where: Prisma.MenuItemWhereInput = {}

        if (filters.success) {
            const { categoryId, isAvailable, search, tags } = filters.data

            if (categoryId) where.categoryId = categoryId
            if (isAvailable !== undefined) where.isAvailable = isAvailable

            if (search) {
                where.OR = [
                    { name: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                ]
            }

            // Filtro por tags (JSON array)
            if (tags && tags.length > 0) {
                where.tags = {
                    array_contains: tags,
                }
            }
        }

        const [items, total] = await Promise.all([
            prisma.menuItem.findMany({
                where,
                include: {
                    category: true,
                },
                orderBy: [
                    { displayOrder: 'asc' },
                    { name: 'asc' },
                ],
                skip,
                take: limit,
            }),
            prisma.menuItem.count({ where }),
        ])

        const response: PaginatedResponse<MenuItem> = {
            success: true,
            data: items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        }

        return NextResponse.json(response)
    } catch (error) {
        console.error('[Menu Items GET Error]', error)
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Erro ao buscar itens do cardápio' },
            { status: 500 }
        )
    }
}

// POST - Cria item do cardápio (admin)
export async function POST(request: NextRequest) {
    try {
        // TODO: Reativar auth em produção
        // const authUser = getAuthUser(request)
        // if (!authUser || !canManageMenu(authUser)) {
        //     return NextResponse.json<ApiResponse>({ success: false, error: 'Acesso negado' }, { status: 403 })
        // }

        const body = await request.json()
        const validation = createMenuItemSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: validation.error.issues[0].message },
                { status: 400 }
            )
        }

        // Verifica se categoria existe
        const category = await prisma.menuCategory.findUnique({
            where: { id: validation.data.categoryId },
        })

        if (!category) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Categoria não encontrada' },
                { status: 404 }
            )
        }

        const item = await prisma.menuItem.create({
            data: validation.data,
            include: {
                category: true,
            },
        })

        console.log({
            action: 'MENU_ITEM_CREATED',
            timestamp: new Date().toISOString(),
            itemId: item.id,
            // userId: authUser.userId,
        })

        return NextResponse.json<ApiResponse<MenuItem>>(
            {
                success: true,
                data: item,
                message: 'Item criado com sucesso',
            },
            { status: 201 }
        )
    } catch (error) {
        console.error('[Menu Items POST Error]', error)
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Erro ao criar item' },
            { status: 500 }
        )
    }
}
