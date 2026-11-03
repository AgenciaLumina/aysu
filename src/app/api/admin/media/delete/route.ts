// AISSU Beach Lounge - API para Deletar Arquivo do R2
import { NextRequest, NextResponse } from 'next/server'
import { canAccessAdminPanel, getAuthUser } from '@/lib/auth'
import { deleteFromR2 } from '@/lib/r2'

export async function DELETE(request: NextRequest) {
    try {
        const authUser = getAuthUser(request)
        if (!canAccessAdminPanel(authUser)) {
            return NextResponse.json(
                { success: false, error: 'Acesso negado' },
                { status: 403 }
            )
        }

        const { key } = await request.json()

        if (typeof key !== 'string' || !key || key.includes('..') || key.startsWith('/') || key.includes('://')) {
            return NextResponse.json(
                { success: false, error: 'Key do arquivo não fornecida' },
                { status: 400 }
            )
        }

        await deleteFromR2(key)

        return NextResponse.json({
            success: true,
            message: 'Arquivo deletado com sucesso',
        })
    } catch (error) {
        console.error('[R2 Delete Error]', error instanceof Error ? error.name : 'UnknownError')
        return NextResponse.json(
            { success: false, error: 'Erro ao deletar arquivo' },
            { status: 500 }
        )
    }
}
