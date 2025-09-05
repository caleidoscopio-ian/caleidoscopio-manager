"use client"

import { useAuth } from "@/lib/auth/hooks"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Loader2, Building2, Users, Settings, DollarSign, Activity, TrendingUp, AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function AdminPage() {
  const { user, loading, isAuthenticated, isSuperAdmin } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!isAuthenticated || !isSuperAdmin)) {
      router.push("/login")
    }
  }, [loading, isAuthenticated, isSuperAdmin, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated || !isSuperAdmin) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-6 p-8 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Painel de Administração</h2>
            <p className="text-muted-foreground">
              Controle total do ecossistema Caleidoscópio
            </p>
          </div>
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Dashboard Geral
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Clínicas
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">
                +2 este mês
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Usuários
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2,350</div>
              <p className="text-xs text-muted-foreground">
                +180 este mês
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
              <div className="text-2xl font-bold">R$ 45.231</div>
              <p className="text-xs text-muted-foreground">
                +20.1% do mês anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Status do Sistema
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Operacional</div>
              <p className="text-xs text-muted-foreground">
                99.9% uptime
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Gerenciar Clínicas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Gerenciar Clínicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Criar, editar e gerenciar todas as clínicas do sistema.
              </p>
              <div className="space-y-2">
                <Button className="w-full" size="sm">
                  <Building2 className="mr-2 h-4 w-4" />
                  Criar Nova Clínica
                </Button>
                <Button variant="outline" className="w-full" size="sm">
                  Listar Todas as Clínicas
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Planos e Licenças */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Planos & Assinaturas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Gerenciar planos de assinatura e controle de licenças.
              </p>
              <div className="space-y-2">
                <Button variant="outline" className="w-full" size="sm">
                  Gerenciar Planos
                </Button>
                <Button variant="outline" className="w-full" size="sm">
                  Controle de Licenças
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Usuários Globais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Usuários Globais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Gerenciar usuários super admin e visualizar todos os usuários.
              </p>
              <div className="space-y-2">
                <Button variant="outline" className="w-full" size="sm">
                  Criar Super Admin
                </Button>
                <Button variant="outline" className="w-full" size="sm">
                  Listar Todos os Usuários
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Relatórios Avançados */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Relatórios Avançados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Relatórios detalhados de uso, faturamento e performance.
              </p>
              <div className="space-y-2">
                <Button variant="outline" className="w-full" size="sm">
                  Relatório de Uso
                </Button>
                <Button variant="outline" className="w-full" size="sm">
                  Relatório Financeiro
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Logs e Auditoria */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Logs & Auditoria
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Monitoramento de atividades e logs de segurança.
              </p>
              <div className="space-y-2">
                <Button variant="outline" className="w-full" size="sm">
                  Logs de Auditoria
                </Button>
                <Button variant="outline" className="w-full" size="sm">
                  Logs do Sistema
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Configurações do Sistema */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Configurações globais do sistema e manutenção.
              </p>
              <div className="space-y-2">
                <Button variant="outline" className="w-full" size="sm">
                  Configurações Gerais
                </Button>
                <Button variant="outline" className="w-full" size="sm">
                  Backup & Segurança
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts ou Notificações Importantes */}
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <AlertTriangle className="h-5 w-5" />
              Alertas do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-yellow-800 dark:text-yellow-200">
                  • 2 clínicas com licenças próximas ao vencimento
                </span>
                <Button variant="outline" size="sm">
                  Ver Detalhes
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-yellow-800 dark:text-yellow-200">
                  • Backup programado para hoje às 02:00
                </span>
                <Button variant="outline" size="sm">
                  Configurar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}