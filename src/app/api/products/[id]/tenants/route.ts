import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth/session'

// Ativar produto para um tenant
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await verifySession(request)
    if (!sessionUser || sessionUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { tenantId, config } = body

    if (!tenantId) {
      return NextResponse.json(
        { error: 'ID do tenant é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se produto e tenant existem
    const [product, tenant] = await Promise.all([
      prisma.product.findUnique({ where: { id } }),
      prisma.tenant.findUnique({ where: { id: tenantId } })
    ])

    if (!product) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
    }

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 })
    }

    // Verificar se o plano do tenant inclui este produto
    const planProduct = await prisma.planProduct.findFirst({
      where: {
        planId: tenant.planId,
        productId: id,
        isActive: true
      }
    })

    if (!planProduct) {
      return NextResponse.json(
        { error: 'O plano do tenant não inclui este produto' },
        { status: 400 }
      )
    }

    // Verificar se já não está ativado
    const existingTenantProduct = await prisma.tenantProduct.findUnique({
      where: {
        tenantId_productId: {
          tenantId,
          productId: id
        }
      }
    })

    if (existingTenantProduct) {
      return NextResponse.json(
        { error: 'Produto já está ativado para este tenant' },
        { status: 400 }
      )
    }

    // Ativar produto para o tenant
    const tenantProduct = await prisma.tenantProduct.create({
      data: {
        tenantId,
        productId: id,
        config: config || product.defaultConfig
      },
      include: {
        tenant: true,
        product: true
      }
    })

    return NextResponse.json({ tenantProduct }, { status: 201 })
  } catch (error) {
    console.error('Erro ao ativar produto para tenant:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Listar tenants com acesso ao produto
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await verifySession(request)
    if (!sessionUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params
    const tenantProducts = await prisma.tenantProduct.findMany({
      where: { productId: id },
      include: {
        tenant: {
          include: {
            plan: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ tenantProducts })
  } catch (error) {
    console.error('Erro ao buscar tenants do produto:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}