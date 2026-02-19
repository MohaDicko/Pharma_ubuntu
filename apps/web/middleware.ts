import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes publiques (accessibles sans login)
const publicRoutes = ['/login', '/terms', '/privacy']

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Vérifier si la route est publique
    if (publicRoutes.some(route => pathname.startsWith(route))) {
        return NextResponse.next()
    }

    // Vérifier le token d'authentification (cookie sécurisé)
    const token = request.cookies.get('auth-token')?.value

    // Si pas de token et route protégée -> Redirection vers Login
    if (!token) {
        const loginUrl = new URL('/login', request.url)
        // On garde l'URL d'origine pour rediriger après login
        loginUrl.searchParams.set('callbackUrl', pathname)
        return NextResponse.redirect(loginUrl)
    }

    // Si token présent, on laisse passer
    return NextResponse.next()
}

// Configurer sur quelles routes le middleware s'active
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes) -> On pourrait vouloir les protéger aussi différemment
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}
