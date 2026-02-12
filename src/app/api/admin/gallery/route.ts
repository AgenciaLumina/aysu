// AISSU Beach Lounge - Gallery API Routes
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { canAccessAdminPanel, getAuthUser } from '@/lib/auth'

// GET - Lista todas as imagens da galeria
export async function GET(request: NextRequest) {
    try {
        const authUser = getAuthUser(request)
        if (!canAccessAdminPanel(authUser)) {
            return NextResponse.json(
                { success: false, error: 'Acesso negado' },
                { status: 403 }
            )
        }

        const images = await prisma.galleryImage.findMany({
            where: { isActive: true },
            orderBy: { displayOrder: 'asc' },
        })

        return NextResponse.json({
            success: true,
            data: images,
        })
    } catch (error) {
        console.error('[Gallery GET Error]', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao buscar imagens' },
            { status: 500 }
        )
    }
}

// POST - Adiciona nova imagem
export async function POST(request: NextRequest) {
    try {
        const authUser = getAuthUser(request)
        if (!canAccessAdminPanel(authUser)) {
            return NextResponse.json(
                { success: false, error: 'Acesso negado' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const { imageUrl, caption, permalink } = body

        if (!imageUrl) {
            return NextResponse.json(
                { success: false, error: 'URL da imagem é obrigatória' },
                { status: 400 }
            )
        }

        // Pega a maior ordem atual
        const maxOrder = await prisma.galleryImage.findFirst({
            orderBy: { displayOrder: 'desc' },
            select: { displayOrder: true },
        })

        const image = await prisma.galleryImage.create({
            data: {
                imageUrl,
                caption: caption || null,
                permalink: permalink || null,
                displayOrder: (maxOrder?.displayOrder || 0) + 1,
            },
        })

        return NextResponse.json({
            success: true,
            data: image,
            message: 'Imagem adicionada com sucesso',
        })
    } catch (error) {
        console.error('[Gallery POST Error]', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao adicionar imagem' },
            { status: 500 }
        )
    }
}
