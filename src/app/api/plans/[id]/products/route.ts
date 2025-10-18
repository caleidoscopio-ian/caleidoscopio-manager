import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth/session'

// Listar produtos associados ao plano
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionUser = await verifySession(request)
    if (!sessionUser || sessionUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const planProducts = await prisma.planProduct.findMany({
      where: { planId: params.id },
      include: {
        product: true,
        plan: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ planProducts })
  } catch (error) {
    console.error('Erro ao buscar produtos do plano:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Associar produto ao plano
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionUser = await verifySession(request)
    if (!sessionUser || sessionUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { productId, config, isActive = true } = body

    if (!productId) {
      return NextResponse.json(
        { error: 'ID do produto é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se plano e produto existem
    const [plan, product] = await Promise.all([
      prisma.plan.findUnique({ where: { id: params.id } }),
      prisma.product.findUnique({ where: { id: productId } })
    ])

    if (!plan) {
      return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 })
    }

    if (!product) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
    }

    // Verificar se associação já existe
    const existingPlanProduct = await prisma.planProduct.findUnique({
      where: {
        planId_productId: {
          planId: params.id,
          productId
        }
      }
    })

    if (existingPlanProduct) {
      return NextResponse.json(
        { error: 'Produto já está associado a este plano' },
        { status: 400 }
      )
    }

    // Criar associação
    const planProduct = await prisma.planProduct.create({
      data: {
        planId: params.id,
        productId,
        config,
        isActive
      },
      include: {
        plan: true,
        product: true
      }
    })

    return NextResponse.json({ planProduct }, { status: 201 })
  } catch (error) {
    console.error('Erro ao associar produto ao plano:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}