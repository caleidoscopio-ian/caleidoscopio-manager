import { UserRole, TenantStatus } from '@prisma/client'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
  tenantId: string | null
  tenant?: {
    id: string
    name: string
    slug: string
    status: TenantStatus
  } | null
}

export interface SessionData {
  user: AuthUser
  token: string
  expiresAt: Date
}

export interface LoginCredentials {
  email: string
  password: string
  tenantSlug?: string // Para login específico de tenant
}

export interface CreateTenantData {
  name: string
  slug: string
  planId: string
  adminEmail: string
  adminName: string
  adminPassword: string
}