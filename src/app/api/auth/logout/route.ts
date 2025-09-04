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
    const response = NextResponse.json({ message: 'Logout realizado com sucesso' })
    
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