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
    const { name, slug, description, maxUsers, features, price, isActive } = body

    // Verificar se o plano existe
    const existingPlan = await prisma.plan.findUnique({
      where: { id: params.id }
    })

    if (!existingPlan) {
      return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 })
    }

    // Se slug foi alterado, verificar se não existe outro plano com este slug
    if (slug && slug !== existingPlan.slug) {
      const planWithSlug = await prisma.plan.findUnique({
        where: { slug }
      })

      if (planWithSlug) {
        return NextResponse.json({ 
          error: 'Já existe um plano com este slug' 
        }, { status: 400 })
      }
    }

    const plan = await prisma.plan.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(description !== undefined && { description }),
        ...(maxUsers && { maxUsers: parseInt(maxUsers) }),
        ...(features && { features }),
        ...(price !== undefined && { price: price ? parseFloat(price) : null }),
        ...(isActive !== undefined && { isActive }),
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

    await prisma.plan.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Plano excluído com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir plano:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}