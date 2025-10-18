import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth/session'
import jwt from 'jsonwebtoken'

// Gerar token SSO para acesso ao produto
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ productSlug: string }> }
) {
  try {
    const sessionUser = await verifySession(request)
    if (!sessionUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Aguardar params (necessário no Next.js 15)
    const resolvedParams = await params

    // Buscar produto
    const product = await prisma.product.findUnique({
      where: { slug: resolvedParams.productSlug }
    })

    if (!product || !product.isActive) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
    }

    // Verificar se o usuário tem acesso ao produto
    let hasAccess = false

    if (sessionUser.role === 'SUPER_ADMIN') {
      hasAccess = true
    } else if (sessionUser.tenantId) {
      // Verificar se o tenant tem acesso ao produto
      const tenantProduct = await prisma.tenantProduct.findFirst({
        where: {
          tenantId: sessionUser.tenantId,
          productId: product.id,
          isActive: true
        }
      })
      hasAccess = !!tenantProduct
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Usuário não tem acesso a este produto' },
        { status: 403 }
      )
    }

    // Gerar token JWT para SSO
    const payload = {
      userId: sessionUser.id,
      userEmail: sessionUser.email,
      userName: sessionUser.name,
      userRole: sessionUser.role,
      tenantId: sessionUser.tenantId,
      tenantSlug: sessionUser.tenant?.slug,
      productId: product.id,
      productSlug: product.slug,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hora
    }

    const secret = process.env.JWT_SECRET || 'default-secret'
    const token = jwt.sign(payload, secret)

    // Salvar token no banco para rastreamento
    await prisma.productToken.create({
      data: {
        token,
        userId: sessionUser.id,
        productId: product.id,
        expiresAt: new Date(Date.now() + (60 * 60 * 1000)) // 1 hora
      }
    })

    // Atualizar estatísticas de acesso
    if (sessionUser.tenantId) {
      await prisma.tenantProduct.updateMany({
        where: {
          tenantId: sessionUser.tenantId,
          productId: product.id
        },
        data: {
          lastAccessed: new Date(),
          accessCount: { increment: 1 }
        }
      })
    }

    const redirectUrl = product.baseUrl ? 
      `${product.baseUrl}?token=${token}` : 
      `/products/${product.slug}?token=${token}`

    return NextResponse.json({
      token,
      redirectUrl,
      expiresIn: 3600 // 1 hora em segundos
    })
  } catch (error) {
    console.error('Erro ao gerar token SSO:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Validar token SSO (para ser usado pelos produtos externos)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productSlug: string }> }
) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 400 })
    }

    // Aguardar params (necessário no Next.js 15)
    const resolvedParams = await params

    // Verificar token no banco
    const productToken = await prisma.productToken.findUnique({
      where: { token },
      include: {
        user: {
          include: {
            tenant: true
          }
        },
        product: true
      }
    })

    if (!productToken || productToken.isRevoked || productToken.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 401 })
    }

    // Verificar se o produto corresponde
    if (productToken.product.slug !== resolvedParams.productSlug) {
      return NextResponse.json({ error: 'Token não é válido para este produto' }, { status: 401 })
    }

    // Atualizar último uso
    await prisma.productToken.update({
      where: { id: productToken.id },
      data: { lastUsed: new Date() }
    })

    // Retornar dados do usuário
    const userData = {
      userId: productToken.user.id,
      email: productToken.user.email,
      name: productToken.user.name,
      role: productToken.user.role,
      tenant: productToken.user.tenant ? {
        id: productToken.user.tenant.id,
        name: productToken.user.tenant.name,
        slug: productToken.user.tenant.slug
      } : null
    }

    return NextResponse.json({ valid: true, user: userData })
  } catch (error) {
    console.error('Erro ao validar token SSO:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}