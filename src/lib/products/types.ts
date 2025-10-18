import { Product, PlanProduct, TenantProduct, ProductToken } from '@prisma/client'

export interface ProductWithRelations extends Product {
  planProducts: (PlanProduct & {
    plan: {
      id: string
      name: string
      slug: string
    }
  })[]
  tenantProducts: (TenantProduct & {
    tenant: {
      id: string
      name: string
      slug: string
    }
  })[]
  _count?: {
    tenantProducts: number
    planProducts: number
  }
}

export interface CreateProductData {
  name: string
  slug: string
  description?: string
  icon?: string
  color?: string
  baseUrl?: string
  defaultConfig?: any
}

export interface UpdateProductData {
  name?: string
  slug?: string
  description?: string
  icon?: string
  color?: string
  baseUrl?: string
  defaultConfig?: any
  isActive?: boolean
}

export interface TenantProductWithRelations extends TenantProduct {
  tenant: {
    id: string
    name: string
    slug: string
    plan: {
      id: string
      name: string
      slug: string
    }
  }
  product: Product
}

export interface ProductTokenData extends ProductToken {
  user: {
    id: string
    email: string
    name: string
    role: string
    tenant?: {
      id: string
      name: string
      slug: string
    } | null
  }
  product: Product
}

export interface SSOTokenPayload {
  userId: string
  userEmail: string
  userName: string
  userRole: string
  tenantId?: string
  tenantSlug?: string
  productId: string
  productSlug: string
  iat: number
  exp: number
}

export interface ProductAccessInfo {
  hasAccess: boolean
  product: Product
  tenantProduct?: TenantProduct
  config?: any
}