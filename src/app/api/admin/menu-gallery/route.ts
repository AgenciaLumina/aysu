// API para listar e criar imagens da galeria de menu
import { NextRequest, NextResponse } from 'next/server'
import { canAccessAdminPanel, getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - Listar imagens
export async function GET(request: NextRequest) {
    try {
        const authUser = getAuthUser(request)
        if (!canAccessAdminPanel(authUser)) {
            return NextResponse.json(
                { success: false, error: 'Acesso negado' },
                { status: 403 }
            )
        }

        const images = await prisma.menuGalleryImage.findMany({
            where: { isActive: true },
            orderBy: { displayOrder: 'asc' }
        })

        return NextResponse.json({
            success: true,
            data: images
        })
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'desconhecido'
        console.error('[MenuGallery GET]', message)
        return NextResponse.json(
            { success: false, error: 'Erro ao listar', data: [] },
            { status: 500 }
        )
    }
}

// POST - Adicionar imagem(s)
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

        // Suporte a múltiplas imagens
        const imagesList = body.images || [{ imageUrl: body.imageUrl, caption: body.caption }]

        if (!imagesList.length || !imagesList[0].imageUrl) {
            return NextResponse.json(
                { success: false, error: 'URL da imagem é obrigatória' },
                { status: 400 }
            )
        }

        // Get current max order
        const result = await prisma.menuGalleryImage.findFirst({
            orderBy: { displayOrder: 'desc' }
        })
        let nextOrder = (result?.displayOrder || 0) + 1

        const createdImages = []
        for (const img of imagesList) {
            if (!img.imageUrl) continue

            const image = await prisma.menuGalleryImage.create({
                data: {
                    imageUrl: img.imageUrl,
                    caption: img.caption || null,
                    displayOrder: nextOrder++,
                    isActive: true,
                }
            })
            createdImages.push(image)
        }

        return NextResponse.json({
            success: true,
            data: createdImages,
            count: createdImages.length
        })
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'desconhecido'
        console.error('[MenuGallery POST] Full error:', error)
        return NextResponse.json(
            { success: false, error: `Erro ao criar: ${message}` },
            { status: 500 }
        )
    }
}
