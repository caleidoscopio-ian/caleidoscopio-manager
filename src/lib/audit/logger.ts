import { prisma } from '../prisma'

export interface AuditLogData {
  action: string
  resource?: string
  details?: Record<string, any>
  userId?: string
  tenantId?: string
  ipAddress?: string
  userAgent?: string
}

export class AuditLogger {
  static async log(data: AuditLogData): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          action: data.action,
          resource: data.resource || null,
          details: {
            ...data.details,
            ipAddress: data.ipAddress,
            userAgent: data.userAgent,
            timestamp: new Date().toISOString()
          },
          userId: data.userId || null,
          tenantId: data.tenantId || null,
        }
      })
    } catch (error) {
      console.error('Erro ao registrar log de auditoria:', error)
      // Não quebrar o fluxo principal por erro no log
    }
  }

  // Métodos de conveniência para diferentes tipos de ações
  static async logAuth(action: 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'LOGOUT', userId: string, details?: Record<string, any>, ipAddress?: string) {
    await this.log({
      action,
      resource: `user:${userId}`,
      details,
      userId,
      ipAddress
    })
  }

  static async logUserAction(
    action: 'CREATE_USER' | 'UPDATE_USER' | 'DELETE_USER' | 'CHANGE_PASSWORD',
    actorId: string,
    targetUserId: string,
    tenantId?: string,
    details?: Record<string, any>
  ) {
    await this.log({
      action,
      resource: `user:${targetUserId}`,
      details: {
        ...details,
        targetUserId,
        actorId
      },
      userId: actorId,
      tenantId
    })
  }

  static async logTenantAction(
    action: 'CREATE_TENANT' | 'UPDATE_TENANT' | 'DELETE_TENANT' | 'SUSPEND_TENANT',
    actorId: string,
    tenantId: string,
    details?: Record<string, any>
  ) {
    await this.log({
      action,
      resource: `tenant:${tenantId}`,
      details: {
        ...details,
        tenantId,
        actorId
      },
      userId: actorId,
      tenantId
    })
  }

  static async logPlanAction(
    action: 'CREATE_PLAN' | 'UPDATE_PLAN' | 'DELETE_PLAN',
    actorId: string,
    planId: string,
    details?: Record<string, any>
  ) {
    await this.log({
      action,
      resource: `plan:${planId}`,
      details: {
        ...details,
        planId,
        actorId
      },
      userId: actorId
    })
  }

  static async logSecurityEvent(
    action: 'SUSPICIOUS_ACTIVITY' | 'BRUTE_FORCE' | 'PERMISSION_DENIED',
    userId?: string,
    details?: Record<string, any>,
    ipAddress?: string
  ) {
    await this.log({
      action,
      resource: userId ? `user:${userId}` : 'system',
      details: {
        ...details,
        severity: 'HIGH',
        requiresAttention: true
      },
      userId,
      ipAddress
    })
  }

  static async logSystemEvent(
    action: 'CONFIG_CHANGE' | 'BACKUP_CREATED' | 'SYSTEM_ERROR' | 'MAINTENANCE',
    actorId?: string,
    details?: Record<string, any>
  ) {
    await this.log({
      action,
      resource: 'system',
      details,
      userId: actorId
    })
  }
}

// Constantes para tipos de ações
export const AUDIT_ACTIONS = {
  // Autenticação
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGOUT: 'LOGOUT',
  
  // Usuários
  CREATE_USER: 'CREATE_USER',
  UPDATE_USER: 'UPDATE_USER',
  DELETE_USER: 'DELETE_USER',
  CHANGE_PASSWORD: 'CHANGE_PASSWORD',
  
  // Tenants/Clínicas
  CREATE_TENANT: 'CREATE_TENANT',
  UPDATE_TENANT: 'UPDATE_TENANT',
  DELETE_TENANT: 'DELETE_TENANT',
  SUSPEND_TENANT: 'SUSPEND_TENANT',
  
  // Planos
  CREATE_PLAN: 'CREATE_PLAN',
  UPDATE_PLAN: 'UPDATE_PLAN',
  DELETE_PLAN: 'DELETE_PLAN',
  
  // Segurança
  SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
  BRUTE_FORCE: 'BRUTE_FORCE',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  
  // Sistema
  CONFIG_CHANGE: 'CONFIG_CHANGE',
  BACKUP_CREATED: 'BACKUP_CREATED',
  SYSTEM_ERROR: 'SYSTEM_ERROR',
  MAINTENANCE: 'MAINTENANCE',
} as const

// Helper para obter informações da requisição
export function getRequestInfo(request: Request) {
  const userAgent = request.headers.get('user-agent') || ''
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ipAddress = forwarded?.split(',')[0] || realIp || 'unknown'

  return {
    ipAddress,
    userAgent
  }
}