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
        planProducts: {
          include: {
            product: true
          }
        },
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
    const { name, slug, description, maxUsers, products, price, isActive } = body

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

    // Usar transação para criar plano e relacionamentos com produtos
    const result = await prisma.$transaction(async (tx) => {
      // Criar plano
      const plan = await tx.plan.create({
        data: {
          name,
          slug,
          description,
          maxUsers: parseInt(maxUsers),
          features: [], // Manter array vazio para compatibilidade
          price: price ? parseFloat(price) : null,
          isActive: isActive !== false
        }
      })

      // Criar relacionamentos com produtos se fornecidos
      if (products && Array.isArray(products) && products.length > 0) {
        const planProductsData = products.map((productId: string) => ({
          planId: plan.id,
          productId,
          isActive: true,
          config: {} // Configuração padrão vazia
        }))

        await tx.planProduct.createMany({
          data: planProductsData
        })
      }

      // Buscar plano completo com relacionamentos
      const planWithRelations = await tx.plan.findUnique({
        where: { id: plan.id },
        include: {
          planProducts: {
            include: {
              product: true
            }
          },
          _count: {
            select: {
              tenants: true,
            }
          }
        }
      })

      return planWithRelations
    })

    const planWithStats = {
      ...result,
      stats: {
        totalTenants: result?._count?.tenants || 0
      }
    }

    return NextResponse.json({ plan: planWithStats }, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar plano:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}