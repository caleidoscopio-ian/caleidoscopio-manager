import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth/server'
import { hashPassword } from '@/lib/auth/password'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
            plan: {
              select: {
                id: true,
                name: true,
                maxUsers: true
              }
            }
          }
        },
        sessions: {
          select: {
            id: true,
            expiresAt: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Verificar permissões de acesso
    const canAccess = 
      auth.user.role === 'SUPER_ADMIN' || // Super admin vê todos
      auth.user.id === user.id || // Próprio usuário
      (auth.user.role === 'ADMIN' && auth.user.tenantId === user.tenantId) // Admin do mesmo tenant

    if (!canAccess) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

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
        activeSessions: user.sessions.filter(s => s.expiresAt > new Date()).length,
        totalSessions: user.sessions.length,
        lastSession: user.sessions[0]?.createdAt || null
      }
    }

    return NextResponse.json({ user: userWithStats })
  } catch (error) {
    console.error('Erro ao buscar usuário:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { email, name, password, role, tenantId, isActive } = body

    // Verificar se o usuário existe
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        tenant: true
      }
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Verificar permissões de edição
    const canEdit = 
      auth.user.role === 'SUPER_ADMIN' || // Super admin edita todos
      (auth.user.role === 'ADMIN' && auth.user.tenantId === existingUser.tenantId) // Admin do mesmo tenant

    // Usuário pode editar próprios dados básicos (nome, senha)
    const isSelfEdit = auth.user.id === existingUser.id
    
    if (!canEdit && !isSelfEdit) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Preparar dados de atualização
    const updateData: any = {}

    // Nome pode ser alterado por todos
    if (name !== undefined) {
      updateData.name = name
    }

    // Email só por admins
    if (email !== undefined && canEdit) {
      if (email !== existingUser.email) {
        const emailExists = await prisma.user.findUnique({
          where: { email }
        })
        if (emailExists) {
          return NextResponse.json({ 
            error: 'Já existe um usuário com este email' 
          }, { status: 400 })
        }
      }
      updateData.email = email
    }

    // Senha pode ser alterada pelo próprio usuário ou admins
    if (password && (isSelfEdit || canEdit)) {
      updateData.password = await hashPassword(password)
    }

    // Role só por admins com permissão adequada
    if (role !== undefined && canEdit) {
      const allowedRoles = auth.user.role === 'SUPER_ADMIN' 
        ? ['SUPER_ADMIN', 'ADMIN', 'USER'] 
        : ['USER']

      if (!allowedRoles.includes(role)) {
        return NextResponse.json({ 
          error: 'Você não tem permissão para alterar para este papel' 
        }, { status: 403 })
      }

      updateData.role = role
    }

    // TenantId só por super admin
    if (tenantId !== undefined && auth.user.role === 'SUPER_ADMIN') {
      if (tenantId && tenantId !== existingUser.tenantId) {
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

        // Verificar limite de usuários
        if (tenant.users.length >= tenant.maxUsers) {
          return NextResponse.json({ 
            error: `Limite de usuários atingido para este tenant (${tenant.maxUsers} máximo)` 
          }, { status: 400 })
        }
      }

      updateData.tenantId = tenantId
    }

    // isActive só por admins
    if (isActive !== undefined && canEdit) {
      // Não permitir desativar o próprio usuário
      if (!isActive && auth.user.id === existingUser.id) {
        return NextResponse.json({ 
          error: 'Você não pode desativar sua própria conta' 
        }, { status: 400 })
      }
      updateData.isActive = isActive
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
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

    return NextResponse.json({ user: userWithStats })
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação e se é admin
    const auth = await verifyAuth(request)
    if (!auth || !['SUPER_ADMIN', 'ADMIN'].includes(auth.user.role)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Verificar se o usuário existe
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        tenant: true
      }
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Verificar permissões
    const canDelete = 
      auth.user.role === 'SUPER_ADMIN' || 
      (auth.user.role === 'ADMIN' && auth.user.tenantId === existingUser.tenantId)

    if (!canDelete) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Não permitir excluir a si mesmo
    if (auth.user.id === existingUser.id) {
      return NextResponse.json({ 
        error: 'Você não pode excluir sua própria conta' 
      }, { status: 400 })
    }

    // Não permitir excluir super admin (só outro super admin pode)
    if (existingUser.role === 'SUPER_ADMIN' && auth.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ 
        error: 'Apenas Super Admins podem excluir outros Super Admins' 
      }, { status: 403 })
    }

    await prisma.user.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Usuário excluído com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir usuário:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}