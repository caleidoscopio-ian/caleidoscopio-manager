import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth/session'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('session')?.value

    if (!token) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Validar sessão
    const sessionData = await validateSession(token)

    if (!sessionData) {
      // Remover cookie inválido
      const response = NextResponse.json({ error: 'Sessão inválida' }, { status: 401 })
      
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
    }

    return NextResponse.json({
      user: {
        id: sessionData.user.id,
        email: sessionData.user.email,
        name: sessionData.user.name,
        role: sessionData.user.role,
        tenant: sessionData.user.tenant,
      },
    })
  } catch (error) {
    console.error('Erro ao buscar usuário:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}