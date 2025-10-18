import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth/session'

// Atualizar associação plano-produto
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string, productId: string } }
) {
  try {
    const sessionUser = await verifySession(request)
    if (!sessionUser || sessionUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { config, isActive } = body

    // Verificar se associação existe
    const existingPlanProduct = await prisma.planProduct.findUnique({
      where: {
        planId_productId: {
          planId: params.id,
          productId: params.productId
        }
      }
    })

    if (!existingPlanProduct) {
      return NextResponse.json(
        { error: 'Associação não encontrada' },
        { status: 404 }
      )
    }

    // Atualizar associação
    const planProduct = await prisma.planProduct.update({
      where: {
        planId_productId: {
          planId: params.id,
          productId: params.productId
        }
      },
      data: {
        ...(config !== undefined && { config }),
        ...(isActive !== undefined && { isActive })
      },
      include: {
        plan: true,
        product: true
      }
    })

    return NextResponse.json({ planProduct })
  } catch (error) {
    console.error('Erro ao atualizar associação plano-produto:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Remover associação plano-produto
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string, productId: string } }
) {
  try {
    const sessionUser = await verifySession(request)
    if (!sessionUser || sessionUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se associação existe
    const existingPlanProduct = await prisma.planProduct.findUnique({
      where: {
        planId_productId: {
          planId: params.id,
          productId: params.productId
        }
      }
    })

    if (!existingPlanProduct) {
      return NextResponse.json(
        { error: 'Associação não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se existem tenants usando este produto através deste plano
    const tenantsUsingProduct = await prisma.tenant.findMany({
      where: {
        planId: params.id,
        tenantProducts: {
          some: {
            productId: params.productId,
            isActive: true
          }
        }
      }
    })

    if (tenantsUsingProduct.length > 0) {
      return NextResponse.json(
        { 
          error: 'Não é possível remover este produto do plano pois existem clínicas utilizando-o',
          tenantsCount: tenantsUsingProduct.length
        },
        { status: 400 }
      )
    }

    // Remover associação
    await prisma.planProduct.delete({
      where: {
        planId_productId: {
          planId: params.id,
          productId: params.productId
        }
      }
    })

    return NextResponse.json({ message: 'Associação removida com sucesso' })
  } catch (error) {
    console.error('Erro ao remover associação plano-produto:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}