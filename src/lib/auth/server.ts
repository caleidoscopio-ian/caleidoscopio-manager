import { NextRequest } from 'next/server'
import { prisma } from '../prisma'
import { AuthUser } from './types'

export async function verifyAuth(request: NextRequest): Promise<{ user: AuthUser } | null> {
  try {
    const token = request.cookies.get('session')?.value

    if (!token) {
      return null
    }

    // Buscar sessão válida
    const session = await prisma.session.findUnique({
      where: { token },
      include: {
        user: {
          include: {
            tenant: true
          }
        }
      }
    })

    if (!session || session.expiresAt < new Date() || !session.user.isActive) {
      return null
    }

    const authUser: AuthUser = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
      tenantId: session.user.tenantId,
      tenant: session.user.tenant
        ? {
            id: session.user.tenant.id,
            name: session.user.tenant.name,
            slug: session.user.tenant.slug,
            status: session.user.tenant.status,
          }
        : null,
    }

    return { user: authUser }
  } catch (error) {
    console.error('Erro ao verificar autenticação:', error)
    return null
  }
}