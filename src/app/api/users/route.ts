import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth/server'
import { hashPassword } from '@/lib/auth/password'

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação e se é admin
    const auth = await verifyAuth(request)
    if (!auth || !['SUPER_ADMIN', 'ADMIN'].includes(auth.user.role)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'
    const tenantId = searchParams.get('tenantId')

    // Super Admin pode ver todos os usuários, Admin só do seu tenant
    let whereClause: any = {}
    
    if (auth.user.role === 'SUPER_ADMIN') {
      // Super Admin pode filtrar por tenant ou ver todos
      if (tenantId) {
        whereClause.tenantId = tenantId
      }
    } else {
      // Admin só vê usuários do seu tenant
      whereClause.tenantId = auth.user.tenantId
    }

    if (!includeInactive) {
      whereClause.isActive = true
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
          }
        },
        _count: {
          select: {
            sessions: true,
          }
        }
      },
      orderBy: [
        { role: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    const usersWithStats = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      tenant: user.tenant,
      tenantId: user.tenantId,
      stats: {
        activeSessions: user._count.sessions
      }
    }))

    return NextResponse.json({
      users: usersWithStats,
      total: users.length
    })
  } catch (error) {
    console.error('Erro ao buscar usuários:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação e se é admin
    const auth = await verifyAuth(request)
    if (!auth || !['SUPER_ADMIN', 'ADMIN'].includes(auth.user.role)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const body = await request.json()
    const { email, name, password, role, tenantId, isActive } = body

    // Validações básicas
    if (!email || !name || !password) {
      return NextResponse.json({ 
        error: 'Email, nome e senha são obrigatórios' 
      }, { status: 400 })
    }

    // Validar role baseado no usuário atual
    const allowedRoles = auth.user.role === 'SUPER_ADMIN' 
      ? ['SUPER_ADMIN', 'ADMIN', 'USER'] 
      : ['USER']

    if (role && !allowedRoles.includes(role)) {
      return NextResponse.json({ 
        error: 'Você não tem permissão para criar usuários com este papel' 
      }, { status: 403 })
    }

    // Validar tenant
    let finalTenantId = null
    const finalRole = role || 'USER'

    if (finalRole !== 'SUPER_ADMIN') {
      if (auth.user.role === 'SUPER_ADMIN') {
        // Super Admin pode especificar tenant ou deixar null
        if (tenantId) {
          const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            include: { 
              users: true,
              plan: true
            }
          })

          if (!tenant) {
            return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 400 })
          }

          // Verificar limite de usuários do plano
          if (tenant.users.length >= tenant.maxUsers) {
            return NextResponse.json({ 
              error: `Limite de usuários atingido para este tenant (${tenant.maxUsers} máximo)` 
            }, { status: 400 })
          }

          finalTenantId = tenantId
        }
      } else {
        // Admin só pode criar usuários no seu tenant
        finalTenantId = auth.user.tenantId
        
        if (finalTenantId) {
          const tenant = await prisma.tenant.findUnique({
            where: { id: finalTenantId },
            include: { 
              users: true,
              plan: true
            }
          })

          if (tenant && tenant.users.length >= tenant.maxUsers) {
            return NextResponse.json({ 
              error: `Limite de usuários atingido para seu tenant (${tenant.maxUsers} máximo)` 
            }, { status: 400 })
          }
        }
      }
    }

    // Verificar se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ 
        error: 'Já existe um usuário com este email' 
      }, { status: 400 })
    }

    // Hash da senha
    const hashedPassword = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: finalRole,
        tenantId: finalTenantId,
        isActive: isActive !== false
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
          }
        },
        _count: {
          select: {
            sessions: true,
          }
        }
      }
    })

    const userWithStats = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      tenant: user.tenant,
      tenantId: user.tenantId,
      stats: {
        activeSessions: user._count.sessions
      }
    }

    return NextResponse.json({ user: userWithStats }, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar usuário:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}