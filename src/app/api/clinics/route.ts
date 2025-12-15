import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth/server'

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação e se é admin ou super admin
    const auth = await verifyAuth(request)
    if (!auth || !['SUPER_ADMIN', 'ADMIN'].includes(auth.user.role)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }
    // Admin só vê sua própria clínica, Super Admin vê todas
    const whereClause = auth.user.role === 'ADMIN' && auth.user.tenantId ? { id: auth.user.tenantId } : {}
    
    const tenants = await prisma.tenant.findMany({
      where: whereClause,
      include: {
        plan: {
          select: {
            name: true,
            slug: true,
            maxUsers: true,
            price: true,
          }
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            lastLogin: true,
          },
          where: {
            isActive: true,
          }
        },
        _count: {
          select: {
            users: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const tenantsWithStats = tenants.map(tenant => ({
      ...tenant,
      stats: {
        totalUsers: tenant._count.users,
        activeUsers: tenant.users.filter(user => user.isActive).length,
        adminCount: tenant.users.filter(user => user.role === 'ADMIN').length,
        userCount: tenant.users.filter(user => user.role === 'USER').length,
        lastActivity: tenant.users
          .filter(user => user.lastLogin)
          .sort((a, b) => new Date(b.lastLogin!).getTime() - new Date(a.lastLogin!).getTime())[0]?.lastLogin || null
      }
    }))

    return NextResponse.json({
      tenants: tenantsWithStats,
      total: tenants.length
    })
  } catch (error) {
    console.error('Erro ao buscar clínicas:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação e se é super admin (só ele pode criar clínicas)
    const auth = await verifyAuth(request)
    if (!auth || auth.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }
    
    const body = await request.json()
    const { 
      name, slug, domain, planId, maxUsers, 
      adminEmail, adminName, adminPassword,
      // Novos campos
      cnpj, razaoSocial, cep, endereco, cidade, estado 
    } = body

    // Validações
    if (!name || !slug || !planId || !adminEmail || !adminName || !adminPassword) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: name, slug, planId, adminEmail, adminName, adminPassword' },
        { status: 400 }
      )
    }

    // Verificar se slug já existe
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug }
    })

    if (existingTenant) {
      return NextResponse.json(
        { error: 'Slug já existe' },
        { status: 400 }
      )
    }

    // Verificar se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email já está em uso' },
        { status: 400 }
      )
    }

    // Verificar se plano existe
    const plan = await prisma.plan.findUnique({
      where: { id: planId }
    })

    if (!plan) {
      return NextResponse.json(
        { error: 'Plano não encontrado' },
        { status: 400 }
      )
    }

    // Criar tenant com admin usando o service
    const { createTenant } = await import('@/lib/auth/service')
    
    const result = await createTenant({
      name,
      slug,
      planId,
      adminEmail,
      adminName,
      adminPassword,
      ...(domain && { domain }),
      ...(maxUsers && { maxUsers }),
      // Novos campos opcionais
      ...(cnpj && { cnpj }),
      ...(razaoSocial && { razaoSocial }),
      ...(cep && { cep }),
      ...(endereco && { endereco }),
      ...(cidade && { cidade }),
      ...(estado && { estado })
    })

    return NextResponse.json({
      message: 'Clínica criada com sucesso',
      tenant: result.tenant,
      admin: result.admin
    }, { status: 201 })

  } catch (error) {
    console.error('Erro ao criar clínica:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}