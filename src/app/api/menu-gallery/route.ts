// API para listar imagens da galeria do menu (público - sem autenticação)
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

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
        console.error('[Menu Gallery Public GET]', error?.message || error)
        return NextResponse.json(
            { success: false, error: 'Erro ao carregar galeria', data: [] },
            { status: 500 }
        )
    }
}
