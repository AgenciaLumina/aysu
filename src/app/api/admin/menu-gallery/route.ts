// API para listar e criar imagens da galeria de menu
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

// Criar nova instância para garantir o novo modelo
const prisma = new PrismaClient()

// GET - Listar imagens
export async function GET() {
    try {
        const images = await prisma.menuGalleryImage.findMany({
            where: { isActive: true },
            orderBy: { displayOrder: 'asc' }
        })

        return NextResponse.json({
            success: true,
            data: images
        })
    } catch (error: any) {
        console.error('[MenuGallery GET]', error?.message || error)
        return NextResponse.json(
            { success: false, error: 'Erro ao listar', data: [] },
            { status: 500 }
        )
    }
}

// POST - Adicionar imagem(s)
export async function POST(request: NextRequest) {
    try {
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
    } catch (error: any) {
        console.error('[MenuGallery POST] Full error:', error)
        return NextResponse.json(
            { success: false, error: `Erro ao criar: ${error?.message || 'desconhecido'}` },
            { status: 500 }
        )
    }
}
