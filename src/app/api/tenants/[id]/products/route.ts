import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/auth/session'

// Buscar produtos disponíveis para um tenant
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

    // Verificar se o usuário tem acesso ao tenant
    if (sessionUser.role !== 'SUPER_ADMIN' && sessionUser.tenantId !== id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Buscar tenant com plano
    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        plan: {
          include: {
            planProducts: {
              include: {
                product: true
              }
            }
          }
        },
        tenantProducts: {
          include: {
            product: true
          }
        }
      }
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 })
    }

    // Buscar todos os produtos disponíveis no plano
    const availableProducts = tenant.plan.planProducts.map(pp => {
      const tenantProduct = tenant.tenantProducts.find(tp => tp.productId === pp.productId)
      
      return {
        ...pp.product,
        hasAccess: !!tenantProduct && tenantProduct.isActive,
        planConfig: pp.config,
        tenantConfig: tenantProduct?.config,
        tenantProduct: tenantProduct || null
      }
    })

    return NextResponse.json({ 
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        plan: {
          id: tenant.plan.id,
          name: tenant.plan.name,
          slug: tenant.plan.slug
        }
      },
      products: availableProducts 
    })
  } catch (error) {
    console.error('Erro ao buscar produtos do tenant:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}