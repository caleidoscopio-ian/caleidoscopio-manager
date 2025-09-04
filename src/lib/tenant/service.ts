import { TenantStatus } from '@prisma/client'
import { prisma } from '../prisma'

// Buscar tenant por slug
export async function getTenantBySlug(slug: string) {
  return await prisma.tenant.findUnique({
    where: { slug },
    include: {
      plan: true,
      users: {
        where: { isActive: true },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          lastLogin: true,
        },
      },
    },
  })
}

// Buscar tenant por ID
export async function getTenantById(id: string) {
  return await prisma.tenant.findUnique({
    where: { id },
    include: {
      plan: true,
      users: {
        where: { isActive: true },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          lastLogin: true,
        },
      },
    },
  })
}

// Listar todos os tenants (para super admin)
export async function getAllTenants() {
  return await prisma.tenant.findMany({
    include: {
      plan: true,
      _count: {
        select: {
          users: {
            where: { isActive: true },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}

// Atualizar status do tenant
export async function updateTenantStatus(tenantId: string, status: TenantStatus) {
  return await prisma.tenant.update({
    where: { id: tenantId },
    data: { status },
  })
}

// Verificar disponibilidade de slug
export async function isSlugAvailable(slug: string): Promise<boolean> {
  const existing = await prisma.tenant.findUnique({
    where: { slug },
  })
  
  return !existing
}

// Estatísticas do tenant
export async function getTenantStats(tenantId: string) {
  const [userCount, activeUsers] = await Promise.all([
    prisma.user.count({
      where: { tenantId, isActive: true },
    }),
    prisma.user.count({
      where: {
        tenantId,
        isActive: true,
        lastLogin: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // últimos 30 dias
        },
      },
    }),
  ])

  return {
    totalUsers: userCount,
    activeUsers,
  }
}