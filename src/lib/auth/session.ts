import { randomBytes } from 'crypto'
import { NextRequest } from 'next/server'
import { prisma } from '../prisma'
import { AuthUser, SessionData } from './types'

// Gerar token de sessão
export function generateSessionToken(): string {
  return randomBytes(32).toString('hex')
}

// Criar sessão
export async function createSession(userId: string): Promise<string> {
  const token = generateSessionToken()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 dias

  await prisma.session.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  })

  return token
}

// Validar sessão
export async function validateSession(token: string): Promise<SessionData | null> {
  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      user: {
        include: {
          tenant: true,
        },
      },
    },
  })

  if (!session || session.expiresAt < new Date()) {
    // Limpar sessão expirada
    if (session) {
      await prisma.session.delete({
        where: { id: session.id },
      })
    }
    return null
  }

  const authUser: AuthUser = {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
    tenantId: session.user.tenantId,
    tenant: session.user.tenant ? {
      id: session.user.tenant.id,
      name: session.user.tenant.name,
      slug: session.user.tenant.slug,
      status: session.user.tenant.status,
    } : null,
  }

  return {
    user: authUser,
    token: session.token,
    expiresAt: session.expiresAt,
  }
}

// Revogar sessão
export async function revokeSession(token: string): Promise<void> {
  await prisma.session.deleteMany({
    where: { token },
  })
}

// Verificar sessão a partir do request
export async function verifySession(request: NextRequest): Promise<AuthUser | null> {
  const token = request.cookies.get('session')?.value
  
  if (!token) {
    return null
  }

  const sessionData = await validateSession(token)
  return sessionData?.user || null
}

// Limpar sessões expiradas
export async function cleanupExpiredSessions(): Promise<void> {
  await prisma.session.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  })
}