import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth/service'
import { LoginCredentials } from '@/lib/auth/types'

export async function POST(request: NextRequest) {
  try {
    const body: LoginCredentials = await request.json()
    const { email, password, tenantSlug } = body

    // Validar dados de entrada
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Autenticar usuário
    const result = await authenticateUser({ email, password, tenantSlug })

    if (!result) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      )
    }

    const { user, token } = result

    // Criar resposta com cookie de sessão
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenant: user.tenant,
      },
      token // Retornar token também para sistemas externos
    })

    // Definir cookie de sessão
    response.cookies.set({
      name: 'session',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 dias
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Erro no login:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}