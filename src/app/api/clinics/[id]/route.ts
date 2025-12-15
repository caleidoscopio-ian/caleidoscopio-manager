import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const tenant = await prisma.tenant.findUnique({
      where: { id: resolvedParams.id },
      include: {
        plan: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            lastLogin: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            users: true,
          }
        }
      }
    })

    if (!tenant) {
      return NextResponse.json(
        { error: 'Clínica não encontrada' },
        { status: 404 }
      )
    }

    const tenantWithStats = {
      ...tenant,
      stats: {
        totalUsers: tenant._count.users,
        activeUsers: tenant.users.filter(user => user.isActive).length,
        adminCount: tenant.users.filter(user => user.role === 'ADMIN').length,
        userCount: tenant.users.filter(user => user.role === 'USER').length,
        lastActivity: tenant.users
          .filter(user => user.lastLogin)
          .sort((a, b) => new Date(b.lastLogin!).getTime() - new Date(a.lastLogin!).getTime())[0]?.lastLogin || null
      }
    }

    return NextResponse.json(tenantWithStats)
  } catch (error) {
    console.error('Erro ao buscar clínica:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const body = await request.json()
    const {
      name, slug, domain, status, maxUsers, planId,
      // Novos campos
      cnpj, razaoSocial, cep, endereco, cidade, estado
    } = body

    // Verificar se tenant existe
    const existingTenant = await prisma.tenant.findUnique({
      where: { id: resolvedParams.id }
    })

    if (!existingTenant) {
      return NextResponse.json(
        { error: 'Clínica não encontrada' },
        { status: 404 }
      )
    }

    // Se slug foi alterado, verificar se já existe
    if (slug && slug !== existingTenant.slug) {
      const slugExists = await prisma.tenant.findUnique({
        where: { slug }
      })

      if (slugExists) {
        return NextResponse.json(
          { error: 'Slug já existe' },
          { status: 400 }
        )
      }
    }

    // Se planId foi fornecido, verificar se o plano existe e está ativo
    if (planId && planId !== existingTenant.planId) {
      const plan = await prisma.plan.findUnique({
        where: { id: planId },
        include: {
          planProducts: {
            where: { isActive: true },
            include: {
              product: true
            }
          }
        }
      })

      if (!plan) {
        return NextResponse.json(
          { error: 'Plano não encontrado' },
          { status: 404 }
        )
      }

      if (!plan.isActive) {
        return NextResponse.json(
          { error: 'Plano não está ativo' },
          { status: 400 }
        )
      }

      // Usar transação para atualizar tenant e sincronizar produtos
      const updatedTenant = await prisma.$transaction(async (tx) => {
        // Atualizar tenant
        const tenant = await tx.tenant.update({
          where: { id: resolvedParams.id },
          data: {
            ...(name && { name }),
            ...(slug && { slug }),
            ...(domain !== undefined && { domain }),
            ...(status && { status }),
            ...(maxUsers && { maxUsers }),
            planId,
            // Novos campos
            ...(cnpj !== undefined && { cnpj }),
            ...(razaoSocial !== undefined && { razaoSocial }),
            ...(cep !== undefined && { cep }),
            ...(endereco !== undefined && { endereco }),
            ...(cidade !== undefined && { cidade }),
            ...(estado !== undefined && { estado }),
          },
          include: {
            plan: true,
            users: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                lastLogin: true,
              }
            }
          }
        })

        // Desativar produtos antigos que não estão no novo plano
        await tx.tenantProduct.updateMany({
          where: {
            tenantId: resolvedParams.id,
          },
          data: {
            isActive: false
          }
        })

        // Ativar/criar produtos do novo plano
        for (const planProduct of plan.planProducts) {
          await tx.tenantProduct.upsert({
            where: {
              tenantId_productId: {
                tenantId: resolvedParams.id,
                productId: planProduct.productId
              }
            },
            update: {
              isActive: true,
              config: planProduct.config || {}
            },
            create: {
              tenantId: resolvedParams.id,
              productId: planProduct.productId,
              isActive: true,
              config: planProduct.config || {}
            }
          })
        }

        console.log(`✅ Produtos sincronizados para plano ${plan.name}: ${plan.planProducts.length} produto(s)`)

        return tenant
      })

      return NextResponse.json({
        message: 'Clínica atualizada com sucesso',
        tenant: updatedTenant
      })
    }

    // Se planId não foi alterado, atualizar normalmente
    const updatedTenant = await prisma.tenant.update({
      where: { id: resolvedParams.id },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(domain !== undefined && { domain }),
        ...(status && { status }),
        ...(maxUsers && { maxUsers }),
        // Novos campos
        ...(cnpj !== undefined && { cnpj }),
        ...(razaoSocial !== undefined && { razaoSocial }),
        ...(cep !== undefined && { cep }),
        ...(endereco !== undefined && { endereco }),
        ...(cidade !== undefined && { cidade }),
        ...(estado !== undefined && { estado }),
      },
      include: {
        plan: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            lastLogin: true,
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Clínica atualizada com sucesso',
      tenant: updatedTenant
    })

  } catch (error) {
    console.error('Erro ao atualizar clínica:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    
    // Verificar se tenant existe e buscar usuários
    const existingTenant = await prisma.tenant.findUnique({
      where: { id: resolvedParams.id },
      include: {
        users: {
          select: {
            id: true,
            role: true,
          }
        }
      }
    })

    if (!existingTenant) {
      return NextResponse.json(
        { error: 'Clínica não encontrada' },
        { status: 404 }
      )
    }

    // Contar usuários não-admin
    const nonAdminUsers = existingTenant.users.filter(user => user.role !== 'ADMIN')
    
    // Só impedir exclusão se houver usuários que não são admin
    if (nonAdminUsers.length > 0) {
      return NextResponse.json(
        { error: `Não é possível excluir uma clínica que possui ${nonAdminUsers.length} usuário(s) regular(es). Remova todos os usuários não-admin primeiro.` },
        { status: 400 }
      )
    }

    // Excluir clínica (cascade vai remover os admins automaticamente)
    await prisma.tenant.delete({
      where: { id: resolvedParams.id }
    })

    return NextResponse.json({
      message: 'Clínica excluída com sucesso'
    })

  } catch (error) {
    console.error('Erro ao excluir clínica:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}