import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from './lib/auth/session'

// Rotas que não precisam de autenticação
const publicRoutes = [
  '/',
  '/login',
  '/signup',
  '/api/auth/login',
  '/api/auth/signup',
]

// Rotas específicas para super admin
const superAdminRoutes = [
  '/admin',
  '/api/admin',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('session')?.value

  // Permitir rotas públicas
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`))) {
    return NextResponse.next()
  }

  // Verificar se usuário está autenticado
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Validar sessão
  const sessionData = await validateSession(token)
  
  if (!sessionData) {
    // Sessão inválida, redirecionar para login
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('session')
    return response
  }

  // Verificar acesso a rotas de super admin
  if (superAdminRoutes.some(route => pathname.startsWith(route))) {
    if (sessionData.user.role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }

  // Verificar se tenant está ativo (exceto para super admins)
  if (sessionData.user.role !== 'SUPER_ADMIN' && sessionData.user.tenant) {
    if (sessionData.user.tenant.status !== 'ACTIVE') {
      return NextResponse.redirect(new URL('/tenant-suspended', request.url))
    }
  }

  // Adicionar informações do usuário nos headers para uso nas páginas
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-id', sessionData.user.id)
  requestHeaders.set('x-user-role', sessionData.user.role)
  requestHeaders.set('x-tenant-id', sessionData.user.tenantId || '')
  requestHeaders.set('x-tenant-slug', sessionData.user.tenant?.slug || '')

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}