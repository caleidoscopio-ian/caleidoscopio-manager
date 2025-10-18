import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth/session'

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await verifySession(request)
    if (!sessionUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        planProducts: {
          include: {
            plan: true
          }
        },
        tenantProducts: {
          include: {
            tenant: true
          }
        },
        _count: {
          select: {
            tenantProducts: true,
            planProducts: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({ products })
  } catch (error) {
    console.error('Erro ao buscar produtos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await verifySession(request)
    if (!sessionUser || sessionUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { name, slug, description, icon, color, baseUrl, defaultConfig } = body

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Nome e slug são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se slug já existe
    const existingProduct = await prisma.product.findUnique({
      where: { slug }
    })

    if (existingProduct) {
      return NextResponse.json(
        { error: 'Slug já existe' },
        { status: 400 }
      )
    }

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        icon,
        color,
        baseUrl,
        defaultConfig
      }
    })

    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar produto:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}