import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth/password'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'caleidoscopio-sso-secret-key-2024'

// POST - Criar usuário usando autenticação SSO (para chamadas do Sistema 2)
export async function POST(request: NextRequest) {
  try {
    console.log('🔐 API Create User with SSO - Iniciando...')

    // Extrair token SSO da query ou header
    const { searchParams } = new URL(request.url)
    const ssoToken = searchParams.get('token') || request.headers.get('X-SSO-Token')

    if (!ssoToken) {
      return NextResponse.json(
        { error: 'Token SSO não fornecido' },
        { status: 401 }
      )
    }

    // Validar token SSO
    let decodedToken: any
    try {
      decodedToken = jwt.verify(ssoToken, JWT_SECRET)
    } catch (error) {
      console.error('❌ Token SSO inválido:', error)
      return NextResponse.json(
        { error: 'Token SSO inválido ou expirado' },
        { status: 401 }
      )
    }

    // Buscar usuário autenticado pelo token
    const authenticatedUser = await prisma.user.findUnique({
      where: { id: decodedToken.userId },
      include: { tenant: true }
    })

    if (!authenticatedUser || !authenticatedUser.isActive) {
      return NextResponse.json(
        { error: 'Usuário não encontrado ou inativo' },
        { status: 403 }
      )
    }

    // Verificar se é ADMIN ou SUPER_ADMIN
    if (!['ADMIN', 'SUPER_ADMIN'].includes(authenticatedUser.role)) {
      return NextResponse.json(
        { error: 'Apenas administradores podem criar usuários' },
        { status: 403 }
      )
    }

    console.log(`✅ Token SSO validado - Usuário: ${authenticatedUser.email} (${authenticatedUser.role})`)

    // Extrair dados do novo usuário do body
    const body = await request.json()
    const { email, name, password, role, tenantId } = body

    // Validações básicas
    if (!email || !name || !password) {
      return NextResponse.json(
        { error: 'Email, nome e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Validar role
    const allowedRoles = authenticatedUser.role === 'SUPER_ADMIN'
      ? ['SUPER_ADMIN', 'ADMIN', 'USER']
      : ['USER']

    const finalRole = role || 'USER'
    if (!allowedRoles.includes(finalRole)) {
      return NextResponse.json(
        { error: 'Você não tem permissão para criar usuários com este papel' },
        { status: 403 }
      )
    }

    // Validar tenant
    let finalTenantId = null

    if (finalRole !== 'SUPER_ADMIN') {
      if (authenticatedUser.role === 'SUPER_ADMIN') {
        // Super Admin pode especificar tenant
        if (tenantId) {
          const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            include: { users: true, plan: true }
          })

          if (!tenant) {
            return NextResponse.json(
              { error: 'Tenant não encontrado' },
              { status: 400 }
            )
          }

          // Verificar limite de usuários
          if (tenant.users.length >= tenant.maxUsers) {
            return NextResponse.json(
              { error: `Limite de usuários atingido (${tenant.maxUsers} máximo)` },
              { status: 400 }
            )
          }

          finalTenantId = tenantId
        }
      } else {
        // Admin só pode criar no seu tenant
        finalTenantId = authenticatedUser.tenantId

        if (finalTenantId) {
          const tenant = await prisma.tenant.findUnique({
            where: { id: finalTenantId },
            include: { users: true }
          })

          if (tenant && tenant.users.length >= tenant.maxUsers) {
            return NextResponse.json(
              { error: `Limite de usuários atingido (${tenant.maxUsers} máximo)` },
              { status: 400 }
            )
          }
        }
      }
    }

    // Verificar se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Já existe um usuário com este email' },
        { status: 400 }
      )
    }

    // Hash da senha
    const hashedPassword = await hashPassword(password)

    // Criar usuário
    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: finalRole,
        tenantId: finalTenantId,
        isActive: true
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true
          }
        }
      }
    })

    console.log(`✅ Usuário criado via SSO: ${newUser.email} (ID: ${newUser.id})`)

    // Retornar usuário criado (sem senha)
    const userResponse = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      isActive: newUser.isActive,
      tenantId: newUser.tenantId,
      tenant: newUser.tenant,
      createdAt: newUser.createdAt
    }

    return NextResponse.json({
      success: true,
      user: userResponse
    }, { status: 201 })

  } catch (error) {
    console.error('❌ Erro ao criar usuário via SSO:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
