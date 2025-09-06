import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth/server'

export async function GET(request: NextRequest) {
  try {
    console.log('Test API called')
    
    // Verificar autenticação
    const auth = await verifyAuth(request)
    if (!auth) {
      console.log('No auth')
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }
    
    console.log('Auth successful, user:', auth.user.role)
    
    return NextResponse.json({
      success: true,
      message: 'API funcionando',
      user: auth.user.role
    })
    
  } catch (error) {
    console.error('Test API Error:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}