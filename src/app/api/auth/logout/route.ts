import { NextRequest, NextResponse } from 'next/server'
import { revokeSession } from '@/lib/auth/session'

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('session')?.value

    if (token) {
      // Revogar sessão no banco
      await revokeSession(token)
    }

    // Remover cookie de sessão
    const response = NextResponse.json({ success: true, message: 'Logout realizado com sucesso' })

    response.cookies.set({
      name: 'session',
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Erro no logout:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// GET para logout via URL (quando sistemas externos redirecionam)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const redirect = searchParams.get('redirect') // ex: 'educational'
    const returnUrl = searchParams.get('returnUrl') // URL de retorno

    const token = request.cookies.get('session')?.value

    if (token) {
      await revokeSession(token)
    }

    // Determinar URL de redirecionamento
    let redirectUrl = '/'

    if (returnUrl) {
      redirectUrl = returnUrl
    } else if (redirect) {
      // URLs dos sistemas baseado no produto
      const systemUrls: Record<string, string> = {
        'educational': 'http://localhost:3001/login',
        'ecommerce': 'http://localhost:3002/login',
        'telemedicine': 'http://localhost:3003/login'
      }
      redirectUrl = systemUrls[redirect] || '/'
    }

    // Limpar cookie e redirecionar
    const response = NextResponse.redirect(redirectUrl)

    response.cookies.set({
      name: 'session',
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })

    return response

  } catch (error) {
    console.error('Erro no logout:', error)
    return NextResponse.redirect('/')
  }
}