import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth/password'
import { randomBytes } from 'crypto'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'caleidoscopio-sso-secret-key-2024'

// Gera uma senha temporária legível (ex: "Kx7mPq93Rt")
function gerarSenhaTemporaria(): string {
  return randomBytes(8).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10)
}

// POST - Resetar senha de um usuário usando autenticação SSO (para chamadas do Sistema 2)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    if (!['ADMIN', 'SUPER_ADMIN'].includes(authenticatedUser.role)) {
      return NextResponse.json({ error: 'Apenas administradores podem resetar senhas' }, { status: 403 })
    }

    const { id } = await params
    const targetUser = await prisma.user.findUnique({ where: { id } })

    if (!targetUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Mesma regra de permissão do PUT /api/users/[id]: SUPER_ADMIN edita qualquer um;
    // ADMIN só do próprio tenant.
    const canEdit =
      authenticatedUser.role === 'SUPER_ADMIN' ||
      (authenticatedUser.role === 'ADMIN' && authenticatedUser.tenantId === targetUser.tenantId)

    if (!canEdit) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const temporaryPassword = gerarSenhaTemporaria()
    const hashedPassword = await hashPassword(temporaryPassword)

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    })

    console.log(`✅ Senha resetada via SSO para usuário: ${targetUser.email} (por ${authenticatedUser.email})`)

    return NextResponse.json({ success: true, temporaryPassword })
  } catch (error) {
    console.error('❌ Erro ao resetar senha via SSO:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
