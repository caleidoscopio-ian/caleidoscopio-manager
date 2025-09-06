import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const plans = await prisma.plan.findMany({
      where: includeInactive ? {} : {
        isActive: true
      },
      include: {
        _count: {
          select: {
            tenants: true,
          }
        }
      },
      orderBy: {
        price: 'asc'
      }
    })

    const plansWithStats = plans.map(plan => ({
      ...plan,
      stats: {
        totalTenants: plan._count.tenants
      }
    }))

    return NextResponse.json({
      plans: plansWithStats,
      total: plans.length
    })
  } catch (error) {
    console.error('Erro ao buscar planos:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação e se é super admin
    const auth = await verifyAuth(request)
    if (!auth || auth.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const body = await request.json()
    const { name, slug, description, maxUsers, features, price, isActive } = body

    // Validações básicas
    if (!name || !slug || !maxUsers) {
      return NextResponse.json({ 
        error: 'Nome, slug e limite de usuários são obrigatórios' 
      }, { status: 400 })
    }

    // Verificar se slug já existe
    const existingPlan = await prisma.plan.findUnique({
      where: { slug }
    })

    if (existingPlan) {
      return NextResponse.json({ 
        error: 'Já existe um plano com este slug' 
      }, { status: 400 })
    }

    const plan = await prisma.plan.create({
      data: {
        name,
        slug,
        description,
        maxUsers: parseInt(maxUsers),
        features: features || [],
        price: price ? parseFloat(price) : null,
        isActive: isActive !== false
      },
      include: {
        _count: {
          select: {
            tenants: true,
          }
        }
      }
    })

    const planWithStats = {
      ...plan,
      stats: {
        totalTenants: plan._count.tenants
      }
    }

    return NextResponse.json({ plan: planWithStats }, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar plano:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}