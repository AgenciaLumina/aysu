// AISSU Beach Lounge - Login API
// POST /api/auth/login

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { comparePassword, generateToken, AUTH_ERRORS } from '@/lib/auth'
import { loginSchema } from '@/lib/validations'
import type { ApiResponse, AuthToken } from '@/lib/types'

export async function POST(request: NextRequest) {
    try {
        // Parse e valida body
        const body = await request.json()
        const validation = loginSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: validation.error.issues[0].message },
                { status: 400 }
            )
        }

        const { email, password } = validation.data

        // Busca usuário por email
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        })

        if (!user) {
            return NextResponse.json<ApiResponse>(
                AUTH_ERRORS.INVALID_CREDENTIALS,
                { status: 401 }
            )
        }

        // Verifica se usuário está ativo
        if (!user.isActive) {
            return NextResponse.json<ApiResponse>(
                AUTH_ERRORS.USER_INACTIVE,
                { status: 403 }
            )
        }

        // Verifica senha
        const isPasswordValid = await comparePassword(password, user.passwordHash)

        if (!isPasswordValid) {
            return NextResponse.json<ApiResponse>(
                AUTH_ERRORS.INVALID_CREDENTIALS,
                { status: 401 }
            )
        }

        // Gera token JWT
        const token = generateToken({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        })

        // Resposta de sucesso
        const response: ApiResponse<AuthToken> = {
            success: true,
            data: {
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                },
            },
            message: 'Login realizado com sucesso',
        }

        // Log de auditoria (sem dados sensíveis)
        console.log({
            action: 'LOGIN_SUCCESS',
            timestamp: new Date().toISOString(),
            userId: user.id,
            ip: request.headers.get('x-forwarded-for') || 'unknown',
        })

        return NextResponse.json<ApiResponse<AuthToken>>(response)
    } catch (error) {
        console.error('[Login Error]', error)
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}
