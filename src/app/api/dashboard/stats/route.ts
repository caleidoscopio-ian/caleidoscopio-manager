import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth/server'

export async function GET(request: NextRequest) {
  try {
    console.log('Dashboard stats API called')
    
    // Verificar autenticação
    const auth = await verifyAuth(request)
    if (!auth) {
      console.log('Authentication failed')
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }
    
    console.log('User authenticated:', auth.user.role)

    const { user } = auth
    const isSuperAdmin = user.role === 'SUPER_ADMIN'
    const isAdmin = user.role === 'ADMIN'

    // Datas para comparação
    const today = new Date()
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0)
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - 7)

    let stats: any = {}

    if (isSuperAdmin) {
      console.log('Fetching Super Admin stats')
      
      // Total de clínicas
      const totalClinics = await prisma.tenant.count()
      console.log('Total clinics:', totalClinics)
      
      const clinicsThisMonth = await prisma.tenant.count({
        where: {
          createdAt: {
            gte: startOfMonth
          }
        }
      })
      console.log('Clinics this month:', clinicsThisMonth)

      // Receita mensal (clínicas ativas) - simplificada
      const activeTenants = await prisma.tenant.findMany({
        where: {
          status: 'ACTIVE'
        },
        include: {
          plan: {
            select: {
              price: true
            }
          }
        }
      })
      
      const monthlyRevenue = activeTenants.reduce((total, tenant) => {
        return total + (Number(tenant.plan?.price) || 0)
      }, 0)
      console.log('Monthly revenue:', monthlyRevenue)

      // Calcular crescimento de receita
      const revenueGrowth = 0

      // Total de usuários
      const totalUsers = await prisma.user.count()
      const usersThisMonth = await prisma.user.count({
        where: {
          createdAt: {
            gte: startOfMonth
          }
        }
      })
      
      console.log('Total users:', totalUsers, 'Users this month:', usersThisMonth)

      stats = {
        totalClinics,
        clinicsThisMonth,
        monthlyRevenue,
        revenueGrowth,
        totalUsers,
        usersThisMonth
      }
      
      console.log('Super Admin stats compiled:', stats)

    } else if (isAdmin && user.tenantId) {
      console.log('Fetching Admin stats for tenant:', user.tenantId)
      
      // Usuários ativos do tenant
      const activeUsers = await prisma.user.count({
        where: {
          tenantId: user.tenantId,
          isActive: true
        }
      })
      console.log('Active users:', activeUsers)

      const usersThisWeek = await prisma.user.count({
        where: {
          tenantId: user.tenantId,
          createdAt: {
            gte: startOfWeek
          }
        }
      })
      console.log('Users this week:', usersThisWeek)

      // Informações da clínica
      const tenant = await prisma.tenant.findUnique({
        where: {
          id: user.tenantId
        },
        include: {
          plan: {
            select: {
              name: true,
              maxUsers: true
            }
          }
        }
      })
      console.log('Tenant data:', tenant)

      stats = {
        activeUsers,
        usersThisWeek,
        maxUsers: tenant?.plan?.maxUsers || 0,
        clinicName: tenant?.name || 'N/A',
        planName: tenant?.plan?.name || 'N/A'
      }
      
      console.log('Admin stats compiled:', stats)
    } else {
      // Usuário comum - estatísticas básicas
      stats = {
        userRole: user.role,
        clinicName: user.tenant?.name || 'N/A'
      }
    }

    // Atividade recente (simplificada por agora)
    let recentActivity: any[] = []
    
    try {
      console.log('Fetching recent activity...')
      
      if (isSuperAdmin) {
        // Super admin vê atividades de todo o sistema
        const recentLogs = await prisma.auditLog.findMany({
          take: 5,
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            user: {
              select: {
                name: true
              }
            },
            tenant: {
              select: {
                name: true
              }
            }
          }
        })
        
        console.log('Recent logs found:', recentLogs.length)

        recentActivity = recentLogs.map(log => ({
          id: log.id,
          action: log.action,
          description: getActivityDescription(log.action, log.user?.name, log.tenant?.name),
          createdAt: log.createdAt.toISOString(),
          type: getActivityType(log.action)
        }))
      } else if (isAdmin && user.tenantId) {
        // Admin vê apenas atividades do próprio tenant
        const recentLogs = await prisma.auditLog.findMany({
          take: 5,
          orderBy: {
            createdAt: 'desc'
          },
          where: {
            OR: [
              { tenantId: user.tenantId },
              { tenantId: null, userId: user.id }
            ]
          },
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        })
        
        console.log('Admin recent logs found:', recentLogs.length)

        recentActivity = recentLogs.map(log => ({
          id: log.id,
          action: log.action,
          description: getActivityDescription(log.action, log.user?.name),
          createdAt: log.createdAt.toISOString(),
          type: getActivityType(log.action)
        }))
      }
    } catch (activityError) {
      console.error('Error fetching recent activity:', activityError)
      // Não quebrar a API por causa disso
      recentActivity = []
    }

    // System status (sempre online por enquanto)
    const systemStatus = {
      status: 'online',
      uptime: '99.9%'
    }

    const responseData = {
      success: true,
      stats,
      recentActivity,
      systemStatus,
      userRole: user.role
    }
    
    console.log('API Response data:', JSON.stringify(responseData, null, 2))
    
    return NextResponse.json(responseData)

  } catch (error) {
    console.error('Erro ao buscar estatísticas do dashboard:', error)
    
    // Retornar erro mais específico para debugging
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

// Função helper para gerar descrição da atividade
function getActivityDescription(action: string, userName?: string, tenantName?: string): string {
  const user = userName || 'Sistema'
  
  switch (action) {
    case 'LOGIN_SUCCESS':
      return `${user} fez login no sistema`
    case 'CREATE_USER':
      return `Novo usuário foi criado`
    case 'CREATE_TENANT':
      return `Nova clínica "${tenantName}" foi cadastrada`
    case 'UPDATE_USER':
      return `Usuário foi atualizado`
    case 'DELETE_USER':
      return `Usuário foi removido`
    case 'CHANGE_PASSWORD':
      return `${user} alterou a senha`
    default:
      return `Ação ${action.toLowerCase().replace(/_/g, ' ')} realizada`
  }
}

// Função helper para determinar tipo da atividade (cor)
function getActivityType(action: string): 'success' | 'info' | 'warning' | 'error' {
  switch (action) {
    case 'LOGIN_SUCCESS':
    case 'CREATE_USER':
    case 'CREATE_TENANT':
      return 'success'
    case 'UPDATE_USER':
    case 'CHANGE_PASSWORD':
      return 'info'
    case 'LOGIN_FAILED':
    case 'DELETE_USER':
    case 'DELETE_TENANT':
      return 'error'
    case 'SUSPICIOUS_ACTIVITY':
    case 'BRUTE_FORCE':
      return 'warning'
    default:
      return 'info'
  }
}