// AISSU Beach Lounge - Verify API
// GET /api/auth/verify

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser, AUTH_ERRORS } from '@/lib/auth'
import type { ApiResponse, AuthUser } from '@/lib/types'

export async function GET(request: NextRequest) {
    try {
        // Verifica token JWT
        const authPayload = getAuthUser(request)

        if (!authPayload) {
            return NextResponse.json<ApiResponse>(
                AUTH_ERRORS.UNAUTHORIZED,
                { status: 401 }
            )
        }

        // Busca usuário atualizado no banco
        const user = await prisma.user.findUnique({
            where: { id: authPayload.userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
                avatar: true,
            },
        })

        if (!user) {
            return NextResponse.json<ApiResponse>(
                AUTH_ERRORS.USER_NOT_FOUND,
                { status: 404 }
            )
        }

        // Verifica se usuário está ativo
        if (!user.isActive) {
            return NextResponse.json<ApiResponse>(
                AUTH_ERRORS.USER_INACTIVE,
                { status: 403 }
            )
        }

        // Resposta de sucesso
        const authUser: AuthUser = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        }

        return NextResponse.json<ApiResponse<AuthUser>>({
            success: true,
            data: authUser,
        })
    } catch (error) {
        console.error('[Verify Error]', error)
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}
