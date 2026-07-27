import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'caleidoscopio-sso-secret-key-2024'

// POST - Excluir um usuário usando autenticação SSO (para chamadas do Sistema 2)
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
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { id } = await params
    const targetUser = await prisma.user.findUnique({ where: { id } })

    if (!targetUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Mesmas regras do DELETE /api/users/[id] já existente
    const canDelete =
      authenticatedUser.role === 'SUPER_ADMIN' ||
      (authenticatedUser.role === 'ADMIN' && authenticatedUser.tenantId === targetUser.tenantId)

    if (!canDelete) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    if (authenticatedUser.id === targetUser.id) {
      return NextResponse.json({ error: 'Você não pode excluir sua própria conta' }, { status: 400 })
    }

    if (targetUser.role === 'SUPER_ADMIN' && authenticatedUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Apenas Super Admins podem excluir outros Super Admins' },
        { status: 403 }
      )
    }

    await prisma.user.delete({ where: { id } })

    console.log(`✅ Usuário excluído via SSO: ${targetUser.email} (por ${authenticatedUser.email})`)

    return NextResponse.json({ success: true, message: 'Usuário excluído com sucesso' })
  } catch (error) {
    console.error('❌ Erro ao excluir usuário via SSO:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
