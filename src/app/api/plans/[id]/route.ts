import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const plan = await prisma.plan.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            tenants: true,
          }
        },
        tenants: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
            createdAt: true,
          }
        }
      }
    })

    if (!plan) {
      return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 })
    }

    const planWithStats = {
      ...plan,
      stats: {
        totalTenants: plan._count.tenants
      }
    }

    return NextResponse.json({ plan: planWithStats })
  } catch (error) {
    console.error('Erro ao buscar plano:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Verificar se slug já existe (exceto para o plano atual)
    const existingPlan = await prisma.plan.findFirst({
      where: { 
        slug,
        id: { not: params.id }
      }
    })

    if (existingPlan) {
      return NextResponse.json({ 
        error: 'Já existe um plano com este slug' 
      }, { status: 400 })
    }

    // Usar transação para atualizar plano e relacionamentos com produtos
    const result = await prisma.$transaction(async (tx) => {
      // Atualizar plano
      const plan = await tx.plan.update({
        where: { id: params.id },
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

      // Remover todas as associações de produtos existentes
      await tx.planProduct.deleteMany({
        where: { planId: plan.id }
      })

      // Criar novas associações com produtos se fornecidos
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

    return NextResponse.json({ plan: planWithStats })
  } catch (error) {
    console.error('Erro ao atualizar plano:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação e se é super admin
    const auth = await verifyAuth(request)
    if (!auth || auth.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Verificar se o plano existe
    const existingPlan = await prisma.plan.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            tenants: true,
          }
        }
      }
    })

    if (!existingPlan) {
      return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 })
    }

    // Verificar se há clínicas usando este plano
    if (existingPlan._count.tenants > 0) {
      return NextResponse.json({ 
        error: `Não é possível excluir este plano pois há ${existingPlan._count.tenants} clínica(s) utilizando-o` 
      }, { status: 400 })
    }

    // Usar transação para excluir plano e relacionamentos
    await prisma.$transaction(async (tx) => {
      // Excluir relacionamentos com produtos
      await tx.planProduct.deleteMany({
        where: { planId: params.id }
      })

      // Excluir plano
      await tx.plan.delete({
        where: { id: params.id }
      })
    })

    return NextResponse.json({ message: 'Plano excluído com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir plano:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}