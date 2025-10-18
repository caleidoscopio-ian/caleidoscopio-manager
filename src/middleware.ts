import { NextRequest, NextResponse } from 'next/server'

// Rotas que não precisam de autenticação
const publicRoutes = [
  '/',
  '/login',
  '/signup',
  '/api/auth/login',
  '/api/auth/signup',
  '/api/auth/validate-access',
  '/api/products/sso',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('session')?.value

  // Configurar CORS para sistemas externos
  const response = NextResponse.next()

  // Permitir requests do sistema educacional e outros produtos
  const allowedOrigins = [
    'http://localhost:3001', // Sistema Educacional
    'http://localhost:3002', // Sistema E-commerce (futuro)
    'http://localhost:3003', // Sistema Telemedicina (futuro)
  ]

  const origin = request.headers.get('origin')
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie, X-User-ID, X-Tenant-ID')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: response.headers })
  }

  // Permitir rotas públicas
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`))) {
    return response
  }

  // Verificar se usuário está autenticado (apenas cookie)
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes - exceto as específicas abaixo)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
    // APIs específicas que precisam de CORS para sistemas externos
    '/api/auth/login',
    '/api/auth/validate-access',
    '/api/products/sso/:path*',
  ],
}