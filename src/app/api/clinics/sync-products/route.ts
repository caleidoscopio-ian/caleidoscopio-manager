import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth/server'

/**
 * Endpoint para sincronizar produtos dos planos com as clínicas
 * Útil para corrigir clínicas que foram criadas antes da implementação
 * da sincronização automática
 */
export async function POST(request: NextRequest) {
  try {
    // Apenas Super Admin pode executar
    const auth = await verifyAuth(request)
    if (!auth || auth.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    console.log('🔄 Iniciando sincronização de produtos...')

    // Buscar todas as clínicas ativas com seus planos
    const tenants = await prisma.tenant.findMany({
      where: {
        status: 'ACTIVE'
      },
      include: {
        plan: {
          include: {
            planProducts: {
              where: {
                isActive: true
              },
              include: {
                product: true
              }
            }
          }
        },
        tenantProducts: true
      }
    })

    let tenantsUpdated = 0
    let productsActivated = 0

    // Sincronizar cada clínica
    for (const tenant of tenants) {
      const planProductIds = tenant.plan.planProducts.map(pp => pp.productId)
      const tenantProductIds = tenant.tenantProducts
        .filter(tp => tp.isActive)
        .map(tp => tp.productId)

      // Verificar se há produtos do plano que não estão ativos para o tenant
      const missingProducts = tenant.plan.planProducts.filter(
        pp => !tenantProductIds.includes(pp.productId)
      )

      if (missingProducts.length > 0) {
        console.log(`📦 Clínica "${tenant.name}": ${missingProducts.length} produto(s) faltando`)

        // Ativar produtos faltantes
        for (const planProduct of missingProducts) {
          await prisma.tenantProduct.upsert({
            where: {
              tenantId_productId: {
                tenantId: tenant.id,
                productId: planProduct.productId
              }
            },
            update: {
              isActive: true,
              config: planProduct.config || {}
            },
            create: {
              tenantId: tenant.id,
              productId: planProduct.productId,
              isActive: true,
              config: planProduct.config || {}
            }
          })

          productsActivated++
        }

        tenantsUpdated++
      }

      // Desativar produtos que não estão mais no plano
      const extraProducts = tenant.tenantProducts.filter(
        tp => tp.isActive && !planProductIds.includes(tp.productId)
      )

      if (extraProducts.length > 0) {
        console.log(`🔒 Clínica "${tenant.name}": ${extraProducts.length} produto(s) removido(s)`)

        await prisma.tenantProduct.updateMany({
          where: {
            tenantId: tenant.id,
            productId: {
              in: extraProducts.map(tp => tp.productId)
            }
          },
          data: {
            isActive: false
          }
        })
      }
    }

    console.log(`✅ Sincronização concluída: ${tenantsUpdated} clínica(s) atualizada(s), ${productsActivated} produto(s) ativado(s)`)

    return NextResponse.json({
      message: 'Sincronização concluída com sucesso',
      stats: {
        totalTenants: tenants.length,
        tenantsUpdated,
        productsActivated
      }
    })

  } catch (error) {
    console.error('❌ Erro ao sincronizar produtos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
