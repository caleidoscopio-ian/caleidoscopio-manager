import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth/server'

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)

    // Parâmetros de filtro
    const action = searchParams.get('action')
    const userId = searchParams.get('userId')
    const tenantId = searchParams.get('tenantId')
    const resource = searchParams.get('resource')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search')

    // Construir filtros
    let whereClause: any = {}

    // Super Admin vê todos os logs, Admin só do seu tenant
    if (auth.user.role === 'ADMIN') {
      whereClause.OR = [
        { tenantId: auth.user.tenantId },
        { tenantId: null } // Ações globais que afetam todos
      ]
    } else if (auth.user.role === 'SUPER_ADMIN' && tenantId) {
      // Super Admin pode filtrar por tenant específico
      if (tenantId === 'global') {
        whereClause.tenantId = null
      } else {
        whereClause.tenantId = tenantId
      }
    } else if (auth.user.role !== 'SUPER_ADMIN') {
      // Outros usuários não têm acesso
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    if (action) {
      whereClause.action = action
    }

    if (userId) {
      whereClause.userId = userId
    }

    if (resource) {
      whereClause.resource = {
        contains: resource,
        mode: 'insensitive'
      }
    }

    if (startDate || endDate) {
      whereClause.createdAt = {}
      if (startDate) {
        whereClause.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        whereClause.createdAt.lte = new Date(endDate)
      }
    }

    if (search) {
      whereClause.OR = [
        ...(whereClause.OR || []),
        {
          action: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          resource: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ]
    }

    // Buscar logs com paginação
    const [logs, totalCount] = await Promise.all([
      prisma.auditLog.findMany({
        where: whereClause,
        orderBy: {
          createdAt: 'desc'
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where: whereClause })
    ])

    // Buscar informações dos usuários relacionados
    const userIds = [...new Set(logs.map(log => log.userId).filter((id): id is string => id !== null))]
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    })

    // Buscar informações dos tenants relacionados
    const tenantIds = [...new Set(logs.map(log => log.tenantId).filter((id): id is string => id !== null))]
    const tenants = await prisma.tenant.findMany({
      where: {
        id: { in: tenantIds }
      },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true
      }
    })

    // Enriched logs com informações dos usuários e tenants
    const enrichedLogs = logs.map(log => ({
      ...log,
      user: users.find(u => u.id === log.userId) || null,
      tenant: tenants.find(t => t.id === log.tenantId) || null,
    }))

    return NextResponse.json({
      logs: enrichedLogs,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    })
  } catch (error) {
    console.error('Erro ao buscar logs de auditoria:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação (apenas para criar logs via API se necessário)
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { action, resource, details, tenantId } = body

    if (!action) {
      return NextResponse.json({ 
        error: 'Ação é obrigatória' 
      }, { status: 400 })
    }

    const auditLog = await prisma.auditLog.create({
      data: {
        action,
        resource,
        details,
        userId: auth.user.id,
        tenantId: tenantId || auth.user.tenantId,
      }
    })

    return NextResponse.json({ log: auditLog }, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar log de auditoria:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}