// AISSU Beach Lounge - Public Gallery API (for homepage feed)
import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

// GET - Lista imagens ativas para o feed público
export async function GET() {
    try {
        const images = await prisma.galleryImage.findMany({
            where: { isActive: true },
            orderBy: { displayOrder: 'asc' },
            select: {
                id: true,
                imageUrl: true,
                caption: true,
                permalink: true,
                createdAt: true,
            },
        })

        return NextResponse.json({
            success: true,
            data: images,
        })
    } catch (error) {
        console.error('[Gallery Public GET Error]', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao buscar galeria' },
            { status: 500 }
        )
    }
}
