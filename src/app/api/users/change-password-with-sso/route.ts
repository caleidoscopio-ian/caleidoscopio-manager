import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, verifyPassword } from '@/lib/auth/password'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'caleidoscopio-sso-secret-key-2024'

// POST - Usuário altera a própria senha usando autenticação SSO (para chamadas do Sistema 2).
// Diferente de reset-password-with-sso: aqui não há elevação de privilégio — o token só
// identifica quem está trocando a própria senha, e a senha atual precisa ser confirmada.
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ssoToken = searchParams.get('token') || request.headers.get('X-SSO-Token')

    if (!ssoToken) {
      return NextResponse.json({ error: 'Token SSO não fornecido' }, { status: 401 })
    }

    let decodedToken: any
    try {
      decodedToken = jwt.verify(ssoToken, JWT_SECRET)
    } catch (error) {
      console.error('❌ Token SSO inválido:', error)
      return NextResponse.json({ error: 'Token SSO inválido ou expirado' }, { status: 401 })
    }

    const authenticatedUser = await prisma.user.findUnique({
      where: { id: decodedToken.userId },
    })

    if (!authenticatedUser || !authenticatedUser.isActive) {
      return NextResponse.json({ error: 'Usuário não encontrado ou inativo' }, { status: 403 })
    }

    const body = await request.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Senha atual e nova senha são obrigatórias' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'A nova senha deve ter no mínimo 6 caracteres' },
        { status: 400 }
      )
    }

    const senhaCorreta = await verifyPassword(currentPassword, authenticatedUser.password)
    if (!senhaCorreta) {
      return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 400 })
    }

    const hashedPassword = await hashPassword(newPassword)

    await prisma.user.update({
      where: { id: authenticatedUser.id },
      data: { password: hashedPassword },
    })

    console.log(`✅ Senha alterada pelo próprio usuário via SSO: ${authenticatedUser.email}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Erro ao alterar senha via SSO:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
