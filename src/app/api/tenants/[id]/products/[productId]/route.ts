import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth/session'

// Atualizar configuração de produto para tenant
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
    const existingTenantProduct = await prisma.tenantProduct.findUnique({
      where: {
        tenantId_productId: {
          tenantId: params.id,
          productId: params.productId
        }
      }
    })

    if (!existingTenantProduct) {
      return NextResponse.json(
        { error: 'Produto não está ativado para este tenant' },
        { status: 404 }
      )
    }

    // Atualizar configuração
    const tenantProduct = await prisma.tenantProduct.update({
      where: {
        tenantId_productId: {
          tenantId: params.id,
          productId: params.productId
        }
      },
      data: {
        ...(config !== undefined && { config }),
        ...(isActive !== undefined && { isActive })
      },
      include: {
        tenant: true,
        product: true
      }
    })

    return NextResponse.json({ tenantProduct })
  } catch (error) {
    console.error('Erro ao atualizar produto do tenant:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Remover produto de tenant
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
    const existingTenantProduct = await prisma.tenantProduct.findUnique({
      where: {
        tenantId_productId: {
          tenantId: params.id,
          productId: params.productId
        }
      }
    })

    if (!existingTenantProduct) {
      return NextResponse.json(
        { error: 'Produto não está ativado para este tenant' },
        { status: 404 }
      )
    }

    // Revogar todos os tokens SSO ativos para este produto/tenant
    await prisma.productToken.updateMany({
      where: {
        productId: params.productId,
        user: {
          tenantId: params.id
        },
        isRevoked: false
      },
      data: {
        isRevoked: true
      }
    })

    // Remover associação
    await prisma.tenantProduct.delete({
      where: {
        tenantId_productId: {
          tenantId: params.id,
          productId: params.productId
        }
      }
    })

    return NextResponse.json({ message: 'Produto removido do tenant com sucesso' })
  } catch (error) {
    console.error('Erro ao remover produto do tenant:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}