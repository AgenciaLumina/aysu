// API para deletar imagem da galeria de menu
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// DELETE - Remover imagem
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        await prisma.menuGalleryImage.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('[MenuGallery DELETE]', error?.message || error)
        return NextResponse.json(
            { success: false, error: 'Erro ao deletar' },
            { status: 500 }
        )
    }
}
