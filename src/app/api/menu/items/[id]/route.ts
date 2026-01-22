// AISSU Beach Lounge - Menu Item Detail API
// GET/PATCH/DELETE /api/menu/items/[id]

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser, canManageMenu } from '@/lib/auth'
import { updateMenuItemSchema } from '@/lib/validations'
import type { ApiResponse } from '@/lib/types'
import type { MenuItem } from '@prisma/client'

interface RouteParams {
    params: Promise<{ id: string }>
}

// GET - Detalhes do item
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params

        const item = await prisma.menuItem.findUnique({
            where: { id },
            include: {
                category: true,
            },
        })

        if (!item) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Item não encontrado' },
                { status: 404 }
            )
        }

        return NextResponse.json<ApiResponse<MenuItem>>({
            success: true,
            data: item,
        })
    } catch (error) {
        console.error('[Menu Item GET Error]', error)
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Erro ao buscar item' },
            { status: 500 }
        )
    }
}

// PATCH - Atualiza item
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        // TODO: Reativar auth em produção
        // const authUser = getAuthUser(request)

        // if (!authUser || !canManageMenu(authUser)) {
        //     return NextResponse.json<ApiResponse>(
        //         { success: false, error: 'Acesso negado' },
        //         { status: 403 }
        //     )
        // }

        const body = await request.json()
        const validation = updateMenuItemSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: validation.error.issues[0].message },
                { status: 400 }
            )
        }

        // Verifica se existe
        const existing = await prisma.menuItem.findUnique({
            where: { id },
        })

        if (!existing) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Item não encontrado' },
                { status: 404 }
            )
        }

        const item = await prisma.menuItem.update({
            where: { id },
            data: validation.data,
            include: {
                category: true,
            },
        })

        console.log({
            action: 'MENU_ITEM_UPDATED',
            timestamp: new Date().toISOString(),
            itemId: id,
            // userId: authUser.userId,
        })

        return NextResponse.json<ApiResponse<MenuItem>>({
            success: true,
            data: item,
            message: 'Item atualizado com sucesso',
        })
    } catch (error) {
        console.error('[Menu Item PATCH Error]', error)
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Erro ao atualizar item' },
            { status: 500 }
        )
    }
}

// DELETE - Remove item
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const authUser = getAuthUser(request)

        if (!authUser || !canManageMenu(authUser)) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Acesso negado' },
                { status: 403 }
            )
        }

        // Verifica se existe
        const existing = await prisma.menuItem.findUnique({
            where: { id },
        })

        if (!existing) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Item não encontrado' },
                { status: 404 }
            )
        }

        await prisma.menuItem.delete({
            where: { id },
        })

        console.log({
            action: 'MENU_ITEM_DELETED',
            timestamp: new Date().toISOString(),
            itemId: id,
            // userId: authUser.userId,
        })

        return NextResponse.json<ApiResponse>({
            success: true,
            message: 'Item removido com sucesso',
        })
    } catch (error) {
        console.error('[Menu Item DELETE Error]', error)
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Erro ao remover item' },
            { status: 500 }
        )
    }
}
