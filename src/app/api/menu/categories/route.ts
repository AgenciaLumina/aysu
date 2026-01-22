// AISSU Beach Lounge - Menu Categories API
// GET /api/menu/categories

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import type { ApiResponse, MenuCategoryWithItems } from '@/lib/types'

// GET - Lista categorias do cardápio com itens
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const includeItems = searchParams.get('includeItems') === 'true'
        const onlyAvailable = searchParams.get('onlyAvailable') === 'true'

        // Busca condicional baseada em includeItems
        if (includeItems) {
            const categories = await prisma.menuCategory.findMany({
                where: { isActive: true },
                include: {
                    items: {
                        where: onlyAvailable ? { isAvailable: true } : {},
                        orderBy: { displayOrder: 'asc' },
                    },
                },
                orderBy: { displayOrder: 'asc' },
            })

            return NextResponse.json<ApiResponse<MenuCategoryWithItems[]>>({
                success: true,
                data: categories,
            })
        } else {
            const categories = await prisma.menuCategory.findMany({
                where: { isActive: true },
                orderBy: { displayOrder: 'asc' },
            })

            return NextResponse.json<ApiResponse<MenuCategoryWithItems[]>>({
                success: true,
                data: categories as MenuCategoryWithItems[],
            })
        }
    } catch (error) {
        console.error('[Menu Categories Error]', error)
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Erro ao buscar categorias' },
            { status: 500 }
        )
    }
}
