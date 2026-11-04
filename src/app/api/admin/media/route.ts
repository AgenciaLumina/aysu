// AISSU Beach Lounge - API para Listar Arquivos do R2
import { NextRequest, NextResponse } from 'next/server'
import { canAccessAdminPanel, getAuthUser } from '@/lib/auth'
import { listR2Files } from '@/lib/r2'

export async function GET(request: NextRequest) {
    try {
        const authUser = getAuthUser(request)
        if (!canAccessAdminPanel(authUser)) {
            return NextResponse.json(
                { success: false, error: 'Acesso negado' },
                { status: 403 }
            )
        }

        const { searchParams } = new URL(request.url)
        const folder = searchParams.get('folder') || ''
        const requestedLimit = Number(searchParams.get('limit') || 200)
        const limit = Number.isFinite(requestedLimit) ? Math.min(1000, Math.max(1, Math.floor(requestedLimit))) : 200
        const cursor = searchParams.get('cursor') || undefined
        if (cursor && cursor.length > 4096) {
            return NextResponse.json({ success: false, error: 'Página inválida' }, { status: 400 })
        }
        const result = await listR2Files(folder, limit, cursor)
        return NextResponse.json({ success: true, data: { ...result, count: result.files.length } }, {
            headers: { 'Cache-Control': 'private, no-store' },
        })
    } catch (error: unknown) {
        console.error('[R2 List Error]', error instanceof Error ? error.name : 'UnknownError')
        return NextResponse.json({ success: false, error: 'Erro ao listar arquivos' }, { status: 500 })
    }
}
