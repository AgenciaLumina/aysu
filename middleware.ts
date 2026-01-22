import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rotas públicas dentro do admin (apenas login)
const PUBLIC_ADMIN_ROUTES = ['/admin/login', '/admin/recuperar-senha']

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

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
            const loginUrl = new URL('/admin/login', request.url)
            loginUrl.searchParams.set('callbackUrl', pathname)
            return NextResponse.redirect(loginUrl)
        }

        // TODO: Em uma implementação mais robusta, validaríamos o JWT aqui tb (jose library)
        // Por enquanto, a presença do cookie é o primeiro gate check.
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
