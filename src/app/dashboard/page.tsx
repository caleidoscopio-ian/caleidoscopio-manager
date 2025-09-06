"use client"

import { useAuth } from "@/lib/auth/hooks"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Loader2, TrendingUp, Users, Building2, Calendar, DollarSign, Activity } from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface DashboardStats {
  // Super Admin stats
  totalClinics?: number
  clinicsThisMonth?: number
  monthlyRevenue?: number
  revenueGrowth?: number
  totalUsers?: number
  usersThisMonth?: number
  // Admin stats
  activeUsers?: number
  usersThisWeek?: number
  maxUsers?: number
  clinicName?: string
  planName?: string
  // User stats
  userRole?: string
}

interface ActivityItem {
  id: string
  action: string
  description: string
  createdAt: string
  type: 'success' | 'info' | 'warning' | 'error'
}

interface SystemStatus {
  status: string
  uptime: string
}

export default function DashboardPage() {
  const { user, loading, isAuthenticated, isSuperAdmin, isAdmin } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([])
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({ status: 'online', uptime: '99.9%' })
  const [statsLoading, setStatsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardStats()
    }
  }, [isAuthenticated])

  const fetchDashboardStats = async () => {
    try {
      setStatsLoading(true)
      setError('')
      
      console.log('Fetching dashboard stats...')
      // Testar primeiro a API simples
      const testResponse = await fetch('/api/dashboard/test')
      console.log('Test API response:', testResponse.status)
      
      const response = await fetch('/api/dashboard/stats')
      
      console.log('Response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('API Error:', errorData)
        throw new Error(`Erro ${response.status}: ${errorData.error || 'Erro desconhecido'}`)
      }

      const data = await response.json()
      console.log('Dashboard data received:', data)
      
      setStats(data.stats)
      setRecentActivity(data.recentActivity || [])
      setSystemStatus(data.systemStatus || { status: 'online', uptime: '99.9%' })
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
      setError(error instanceof Error ? error.message : 'Erro ao carregar dados do dashboard')
    } finally {
      setStatsLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price)
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-500'
      case 'warning': return 'bg-yellow-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-blue-500'
    }
  }

  const formatTimeAgo = (date: string) => {
    const now = new Date()
    const activityDate = new Date(date)
    const diffInMinutes = Math.floor((now.getTime() - activityDate.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutos atrás`
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60)
      return `${hours} hora${hours > 1 ? 's' : ''} atrás`
    } else {
      const days = Math.floor(diffInMinutes / 1440)
      return `${days} dia${days > 1 ? 's' : ''} atrás`
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p>Você não está autenticado. Por favor, faça login.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-6 p-8 pt-6">
        {/* Header */}
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Bem-vindo de volta, {user?.name}! Aqui está um resumo do seu sistema.
          </p>
        </div>

        {/* Stats Cards */}
        {statsLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Estatísticas baseadas no role do usuário */}
            {isSuperAdmin && stats && (
              <>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total de Clínicas
                    </CardTitle>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalClinics || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      +{stats.clinicsThisMonth || 0} este mês
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Receita Mensal
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatPrice(stats.monthlyRevenue || 0)}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats.revenueGrowth ? `+${stats.revenueGrowth.toFixed(1)}% do mês anterior` : 'Sem dados anteriores'}
                    </p>
                  </CardContent>
                </Card>
              </>
            )}

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {isSuperAdmin ? "Total de Usuários" : "Usuários Ativos"}
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isSuperAdmin 
                    ? (stats?.totalUsers || 0)
                    : (stats?.activeUsers || 0)
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  {isSuperAdmin 
                    ? `+${stats?.usersThisMonth || 0} este mês` 
                    : `+${stats?.usersThisWeek || 0} esta semana`
                  }
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Sistema
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${
                  systemStatus.status === 'online' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {systemStatus.status === 'online' ? 'Online' : 'Offline'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {systemStatus.uptime} uptime
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Area */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          {/* Overview Chart */}
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Visão Geral</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                <div className="text-center space-y-2">
                  <TrendingUp className="h-8 w-8 mx-auto" />
                  <p>Gráficos de estatísticas serão implementados aqui</p>
                  <p className="text-sm">Mostrando dados de uso e crescimento</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Atividade Recente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-4">
                      <div className={`w-2 h-2 rounded-full ${getActivityColor(activity.type)}`}></div>
                      <div className="space-y-1 flex-1">
                        <p className="text-sm font-medium">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatTimeAgo(activity.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-4">
                    <Activity className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">Nenhuma atividade recente</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        {(isSuperAdmin || isAdmin) && (
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {isSuperAdmin && (
                  <>
                    <button 
                      onClick={() => router.push('/clinics')}
                      className="flex flex-col items-center p-4 text-center space-y-2 rounded-lg border border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors hover:bg-muted/50"
                    >
                      <Building2 className="h-8 w-8 text-muted-foreground" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Nova Clínica</p>
                        <p className="text-xs text-muted-foreground">Cadastrar nova clínica</p>
                      </div>
                    </button>
                    
                    <button 
                      onClick={() => router.push('/plans')}
                      className="flex flex-col items-center p-4 text-center space-y-2 rounded-lg border border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors hover:bg-muted/50"
                    >
                      <DollarSign className="h-8 w-8 text-muted-foreground" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Gerenciar Planos</p>
                        <p className="text-xs text-muted-foreground">Configurar assinaturas</p>
                      </div>
                    </button>
                  </>
                )}
                
                <button 
                  onClick={() => router.push('/users')}
                  className="flex flex-col items-center p-4 text-center space-y-2 rounded-lg border border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors hover:bg-muted/50"
                >
                  <Users className="h-8 w-8 text-muted-foreground" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Gerenciar Usuários</p>
                    <p className="text-xs text-muted-foreground">Adicionar ou editar usuários</p>
                  </div>
                </button>
                
                <button 
                  onClick={() => router.push('/reports')}
                  className="flex flex-col items-center p-4 text-center space-y-2 rounded-lg border border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors hover:bg-muted/50"
                >
                  <TrendingUp className="h-8 w-8 text-muted-foreground" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Ver Relatórios</p>
                    <p className="text-xs text-muted-foreground">Acessar estatísticas</p>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}