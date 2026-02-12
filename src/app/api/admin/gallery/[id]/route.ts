// AISSU Beach Lounge - Gallery Item API Routes
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { canAccessAdminPanel, getAuthUser } from '@/lib/auth'

interface RouteParams {
    params: Promise<{ id: string }>
}

// GET - Busca uma imagem específica
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const authUser = getAuthUser(request)
        if (!canAccessAdminPanel(authUser)) {
            return NextResponse.json(
                { success: false, error: 'Acesso negado' },
                { status: 403 }
            )
        }

        const { id } = await params

        const image = await prisma.galleryImage.findUnique({
            where: { id },
        })

        if (!image) {
            return NextResponse.json(
                { success: false, error: 'Imagem não encontrada' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            data: image,
        })
    } catch (error) {
        console.error('[Gallery GET Error]', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao buscar imagem' },
            { status: 500 }
        )
    }
}

// PATCH - Atualiza uma imagem
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const authUser = getAuthUser(request)
        if (!canAccessAdminPanel(authUser)) {
            return NextResponse.json(
                { success: false, error: 'Acesso negado' },
                { status: 403 }
            )
        }

        const { id } = await params
        const body = await request.json()
        const { caption, permalink, displayOrder, isActive } = body

        const image = await prisma.galleryImage.update({
            where: { id },
            data: {
                ...(caption !== undefined && { caption }),
                ...(permalink !== undefined && { permalink }),
                ...(displayOrder !== undefined && { displayOrder }),
                ...(isActive !== undefined && { isActive }),
            },
        })

        return NextResponse.json({
            success: true,
            data: image,
            message: 'Imagem atualizada com sucesso',
        })
    } catch (error) {
        console.error('[Gallery PATCH Error]', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao atualizar imagem' },
            { status: 500 }
        )
    }
}

// DELETE - Remove uma imagem
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const authUser = getAuthUser(request)
        if (!canAccessAdminPanel(authUser)) {
            return NextResponse.json(
                { success: false, error: 'Acesso negado' },
                { status: 403 }
            )
        }

        const { id } = await params

        await prisma.galleryImage.delete({
            where: { id },
        })

        return NextResponse.json({
            success: true,
            message: 'Imagem removida com sucesso',
        })
    } catch (error) {
        console.error('[Gallery DELETE Error]', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao remover imagem' },
            { status: 500 }
        )
    }
}
