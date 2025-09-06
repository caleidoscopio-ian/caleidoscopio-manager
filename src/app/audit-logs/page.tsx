"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth/hooks"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Loader2, 
  FileText, 
  Download, 
  Shield, 
  AlertTriangle, 
  Activity, 
  TrendingUp,
  Users,
  Calendar,
  RefreshCw,
  Search,
  Filter,
  Eye
} from "lucide-react"
import { createColumns, type AuditLog } from "@/components/audit-logs/columns"
import { ViewLogModal } from "@/components/audit-logs/view-log-modal"
import { useRouter } from "next/navigation"

interface AuditLogsResponse {
  logs: AuditLog[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

interface AuditStats {
  overview: {
    totalLogs: number
    logsToday: number
    logsYesterday: number
    changeFromYesterday: number
    securityEvents: number
  }
  topActions: Array<{ action: string; count: number }>
  topUsers: Array<{ userId: string; count: number; user: any }>
  dailyActivity: Array<{ date: string; count: number }>
  criticalAlerts: AuditLog[]
}

interface Tenant {
  id: string
  name: string
  slug: string
}

export default function AuditLogsPage() {
  const { isAuthenticated, isSuperAdmin, loading: authLoading } = useAuth()
  const router = useRouter()
  
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [stats, setStats] = useState<AuditStats | null>(null)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [error, setError] = useState("")
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  })

  // Filtros
  const [filters, setFilters] = useState({
    action: '',
    userId: '',
    tenantId: '',
    resource: '',
    startDate: '',
    endDate: '',
    search: ''
  })

  // Estados dos modais
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isSuperAdmin)) {
      router.push("/dashboard")
      return
    }

    if (isAuthenticated && isSuperAdmin) {
      fetchLogs()
      fetchStats()
      if (isSuperAdmin) {
        fetchTenants()
      }
    }
  }, [authLoading, isAuthenticated, isSuperAdmin, router, filters, pagination.page])

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchLogs()
      fetchStats()
    }, 30000) // 30 segundos

    return () => clearInterval(interval)
  }, [autoRefresh])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      })

      const response = await fetch(`/api/audit-logs?${params}`)
      
      if (!response.ok) {
        throw new Error("Erro ao carregar logs")
      }

      const data: AuditLogsResponse = await response.json()
      setLogs(data.logs)
      setPagination(data.pagination)
    } catch (error) {
      console.error("Erro ao buscar logs:", error)
      setError("Erro ao carregar logs de auditoria")
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      setStatsLoading(true)
      const response = await fetch('/api/audit-logs/stats?days=7')
      
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error)
    } finally {
      setStatsLoading(false)
    }
  }

  const fetchTenants = async () => {
    try {
      const response = await fetch("/api/clinics")
      if (response.ok) {
        const data = await response.json()
        setTenants(data.tenants || [])
      }
    } catch (error) {
      console.error("Erro ao buscar tenants:", error)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    // Convert "all" back to empty string for API
    const actualValue = value === 'all' ? '' : value
    setFilters(prev => ({ ...prev, [key]: actualValue }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const clearFilters = () => {
    setFilters({
      action: '',
      userId: '',
      tenantId: '',
      resource: '',
      startDate: '',
      endDate: '',
      search: ''
    })
  }

  const handleViewLog = (log: AuditLog) => {
    setSelectedLog(log)
    setShowViewModal(true)
  }

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)),
        limit: '1000' // Exportar mais registros
      })

      const response = await fetch(`/api/audit-logs?${params}`)
      if (response.ok) {
        const data = await response.json()
        
        // Converter para CSV
        const csv = [
          'Data,Ação,Usuário,Recurso,Tenant,Detalhes',
          ...data.logs.map((log: AuditLog) => [
            new Date(log.createdAt).toLocaleString('pt-BR'),
            log.action,
            log.user?.name || 'Sistema',
            log.resource || '',
            log.tenant?.name || 'Global',
            JSON.stringify(log.details || {})
          ].join(','))
        ].join('\n')

        // Download
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Erro ao exportar logs:', error)
    }
  }

  const columns = createColumns({
    onView: handleViewLog,
  })

  if (authLoading || !isAuthenticated || !isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const formatChangePercentage = (change: number) => {
    const formatted = Math.abs(change).toFixed(1)
    return change >= 0 ? `+${formatted}%` : `-${formatted}%`
  }

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-6 p-8 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Logs de Auditoria</h2>
            <p className="text-muted-foreground">
              {isSuperAdmin ? "Monitore atividades de todo o sistema" : "Monitore atividades da sua clínica"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? "bg-green-50 border-green-200" : ""}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? "animate-spin text-green-600" : ""}`} />
              {autoRefresh ? "Auto Refresh ON" : "Auto Refresh"}
            </Button>
            <Button className="gap-2" onClick={handleExport}>
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {statsLoading ? (
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : stats && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total de Eventos
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.overview.totalLogs}</div>
                <p className="text-xs text-muted-foreground">
                  Últimos 7 dias
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Eventos Hoje
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.overview.logsToday}</div>
                <p className={`text-xs ${
                  stats.overview.changeFromYesterday >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatChangePercentage(stats.overview.changeFromYesterday)} vs ontem
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Eventos de Segurança
                </CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${
                  stats.overview.securityEvents > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {stats.overview.securityEvents}
                </div>
                <p className="text-xs text-muted-foreground">
                  Últimos 7 dias
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Usuários Ativos
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.topUsers.length}</div>
                <p className="text-xs text-muted-foreground">
                  Com atividade recente
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
              <div className="space-y-2">
                <Label htmlFor="search">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Buscar logs..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Ação</Label>
                <Select value={filters.action || 'all'} onValueChange={(value) => handleFilterChange('action', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as ações" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as ações</SelectItem>
                    <SelectItem value="LOGIN_SUCCESS">Login Sucesso</SelectItem>
                    <SelectItem value="LOGIN_FAILED">Login Falha</SelectItem>
                    <SelectItem value="CREATE_USER">Criar Usuário</SelectItem>
                    <SelectItem value="UPDATE_USER">Atualizar Usuário</SelectItem>
                    <SelectItem value="DELETE_USER">Excluir Usuário</SelectItem>
                    <SelectItem value="CREATE_TENANT">Criar Clínica</SelectItem>
                    <SelectItem value="UPDATE_TENANT">Atualizar Clínica</SelectItem>
                    <SelectItem value="DELETE_TENANT">Excluir Clínica</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isSuperAdmin && (
                <div className="space-y-2">
                  <Label>Clínica</Label>
                  <Select value={filters.tenantId || 'all'} onValueChange={(value) => handleFilterChange('tenantId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as clínicas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as clínicas</SelectItem>
                      <SelectItem value="global">Ações Globais</SelectItem>
                      {tenants.map((tenant) => (
                        <SelectItem key={tenant.id} value={tenant.id}>
                          {tenant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="startDate">Data Início</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">Data Fim</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                />
              </div>

              <div className="flex items-end">
                <Button variant="outline" onClick={clearFilters} className="w-full">
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Eventos de Auditoria</CardTitle>
              <div className="text-sm text-muted-foreground">
                {pagination.total} evento(s) encontrado(s)
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <p className="text-destructive mb-4">{error}</p>
                <Button onClick={fetchLogs} variant="outline">
                  Tentar Novamente
                </Button>
              </div>
            ) : (
              <div className="px-6 pb-6">
                <DataTable
                  columns={columns}
                  data={logs}
                  searchKey="action"
                  searchPlaceholder="Buscar por ação..."
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal */}
        <ViewLogModal
          open={showViewModal}
          onOpenChange={setShowViewModal}
          log={selectedLog}
        />
      </div>
    </DashboardLayout>
  )
}