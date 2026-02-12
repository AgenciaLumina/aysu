// API para deletar imagem da galeria de menu
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { canAccessAdminPanel, getAuthUser } from '@/lib/auth'

// DELETE - Remover imagem
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authUser = getAuthUser(request)
        if (!canAccessAdminPanel(authUser)) {
            return NextResponse.json(
                { success: false, error: 'Acesso negado' },
                { status: 403 }
            )
        }

        const { id } = await params

        await prisma.menuGalleryImage.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'desconhecido'
        console.error('[MenuGallery DELETE]', message)
        return NextResponse.json(
            { success: false, error: 'Erro ao deletar' },
            { status: 500 }
        )
    }
}
