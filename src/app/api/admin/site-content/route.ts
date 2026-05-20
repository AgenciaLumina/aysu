import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, isAdmin } from '@/lib/auth'
import { DEFAULT_SITE_CONTENT } from '@/lib/site-content'
import { getSiteContentConfig, updateSiteContentConfig } from '@/lib/site-content-store'
import type { ApiResponse } from '@/lib/types'

export async function GET(request: NextRequest) {
    try {
        const authUser = getAuthUser(request)
        if (!isAdmin(authUser)) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Acesso negado' },
                { status: 403 }
            )
        }

        if (!process.env.DATABASE_URL) {
            return NextResponse.json<ApiResponse>({
                success: true,
                data: {
                    content: DEFAULT_SITE_CONTENT,
                    updatedAt: null,
                },
                message: 'Conteúdo padrão carregado',
            })
        }

        const config = await getSiteContentConfig()

        return NextResponse.json<ApiResponse>({
            success: true,
            data: config,
        })
    } catch (error) {
        console.error('[Admin Site Content GET Error]', error)
        return NextResponse.json<ApiResponse>({
            success: true,
            data: {
                content: DEFAULT_SITE_CONTENT,
                updatedAt: null,
            },
            message: 'Conteúdo padrão carregado',
        })
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const authUser = getAuthUser(request)
        if (!isAdmin(authUser)) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Acesso negado' },
                { status: 403 }
            )
        }

        const body = await request.json()
        if (!process.env.DATABASE_URL) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Banco de dados não configurado para salvar conteúdo' },
                { status: 503 }
            )
        }

        const updated = await updateSiteContentConfig(body?.content ?? body)

        return NextResponse.json<ApiResponse>({
            success: true,
            data: updated,
            message: 'Conteúdo do site atualizado com sucesso',
        })
    } catch (error) {
        console.error('[Admin Site Content PATCH Error]', error)
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Erro ao atualizar conteúdo do site' },
            { status: 500 }
        )
    }
}
