// AISSU Beach Lounge - Autenticação
// JWT + bcryptjs para autenticação segura

import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { NextRequest } from 'next/server'
import type { JWTPayload, AuthUser } from './types'
import { UserRole } from '@prisma/client'

// ============================================================
// CONSTANTES
// ============================================================

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production'
const JWT_EXPIRATION = '24h'
const SALT_ROUNDS = 10

// ============================================================
// FUNÇÕES DE SENHA
// ============================================================

/**
 * Cria hash seguro da senha usando bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * Compara senha com hash armazenado
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
}

// ============================================================
// FUNÇÕES JWT
// ============================================================

/**
 * Gera token JWT para o usuário
 */
export function generateToken(user: AuthUser): string {
    const payload: JWTPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
    }

    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION })
}

/**
 * Verifica e decodifica token JWT
 */
export function verifyToken(token: string): JWTPayload | null {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
        return decoded
    } catch {
        return null
    }
}

/**
 * Extrai token do header Authorization
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null
    }
    return authHeader.substring(7)
}

// ============================================================
// MIDDLEWARE DE AUTENTICAÇÃO
// ============================================================

/**
 * Extrai usuário autenticado do request
 * Retorna null se não autenticado
 */
export function getAuthUser(request: NextRequest): JWTPayload | null {
    const authHeader = request.headers.get('Authorization')
    const token = extractTokenFromHeader(authHeader)

    if (!token) {
        return null
    }

    return verifyToken(token)
}

/**
 * Verifica se usuário tem uma das roles permitidas
 */
export function hasRole(user: JWTPayload | null, allowedRoles: UserRole[]): boolean {
    if (!user) return false
    return allowedRoles.includes(user.role)
}

/**
 * Verifica se é admin (ADMIN ou MANAGER)
 */
export function isAdmin(user: JWTPayload | null): boolean {
    return hasRole(user, [UserRole.ADMIN, UserRole.MANAGER])
}

/**
 * Verifica se pode gerenciar cardápio (ADMIN, MANAGER, CHEF)
 */
export function canManageMenu(user: JWTPayload | null): boolean {
    return hasRole(user, [UserRole.ADMIN, UserRole.MANAGER, UserRole.CHEF])
}

/**
 * Verifica se pode usar PDV (ADMIN, MANAGER, CASHIER, BARISTA)
 */
export function canUsePDV(user: JWTPayload | null): boolean {
    return hasRole(user, [UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER, UserRole.BARISTA])
}

// ============================================================
// RESPONSES DE ERRO
// ============================================================

export const AUTH_ERRORS = {
    UNAUTHORIZED: { success: false, error: 'Não autorizado. Token inválido ou ausente.' },
    FORBIDDEN: { success: false, error: 'Acesso negado. Permissão insuficiente.' },
    INVALID_CREDENTIALS: { success: false, error: 'Email ou senha inválidos.' },
    USER_NOT_FOUND: { success: false, error: 'Usuário não encontrado.' },
    USER_INACTIVE: { success: false, error: 'Usuário inativo. Contate o administrador.' },
} as const
