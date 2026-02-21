import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rotas públicas dentro do admin (apenas login)
const PUBLIC_ADMIN_ROUTES = ['/admin/login', '/admin/recuperar-senha']

function decodeJwtPayload(token: string): { exp?: number } | null {
    try {
        const parts = token.split('.')
        if (parts.length !== 3) return null

        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
        const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
        return JSON.parse(atob(padded))
    } catch {
        return null
    }
}

function redirectToLoginAndClearToken(request: NextRequest) {
    const loginUrl = new URL('/admin/login', request.url)
    loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname)

    const response = NextResponse.redirect(loginUrl)
    response.cookies.set('admin_token', '', { path: '/', maxAge: 0 })
    return response
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // 0. Modo Manutenção
    // Define como ativo por padrão, a menos que a env MAINTENANCE_MODE seja explicitamente 'false'
    const MAINTENANCE_MODE = process.env.MAINTENANCE_MODE === 'false' ? false : true;

    if (MAINTENANCE_MODE) {
        // Ignora rotas /admin, rotas /api e arquivos da página de manutenção
        if (!pathname.startsWith('/admin') && !pathname.startsWith('/api') && pathname !== '/manutencao') {
            return NextResponse.redirect(new URL('/manutencao', request.url))
        }
    }

    // 1. Proteção de Rotas Admin
    if (pathname.startsWith('/admin')) {
        // Se for rota pública, permite
        if (PUBLIC_ADMIN_ROUTES.some(route => pathname.startsWith(route))) {
            return NextResponse.next()
        }

        // Verifica cookie de autenticação
        const token = request.cookies.get('admin_token')?.value

        if (!token) {
            // Redireciona para login se não houver token
            return redirectToLoginAndClearToken(request)
        }

        // Evita "Acesso negado" tardio em APIs quando o token já expirou
        const payload = decodeJwtPayload(token)
        const nowInSeconds = Math.floor(Date.now() / 1000)
        const tokenExpired = payload?.exp ? payload.exp <= nowInSeconds : false

        if (!payload || tokenExpired) {
            return redirectToLoginAndClearToken(request)
        }

        // Observação: a assinatura JWT continua sendo validada nas APIs via getAuthUser/verifyToken.
    }

    // 2. Proteção de API (opcional, pode ser feito per-route ou aqui)
    // Se quiser bloquear /api/admin/*, pode adicionar aqui.

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes) -> We handle them separately or let them pass for now
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}
