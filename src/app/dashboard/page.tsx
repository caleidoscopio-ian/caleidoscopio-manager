"use client"

import { useAuth } from "@/lib/auth/hooks"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Loader2, TrendingUp, Users, Building2, Calendar, DollarSign, Activity } from "lucide-react"

export default function DashboardPage() {
  const { user, loading, isAuthenticated, isSuperAdmin, isAdmin } = useAuth()

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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Estatísticas baseadas no role do usuário */}
          {isSuperAdmin && (
            <>
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
                {isSuperAdmin ? "2,350" : user?.tenant ? "24" : "1"}
              </div>
              <p className="text-xs text-muted-foreground">
                {isSuperAdmin ? "+180 este mês" : "+3 esta semana"}
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
              <div className="text-2xl font-bold text-green-600">Online</div>
              <p className="text-xs text-muted-foreground">
                99.9% uptime
              </p>
            </CardContent>
          </Card>
        </div>

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
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Nova clínica cadastrada</p>
                    <p className="text-xs text-muted-foreground">2 horas atrás</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Usuário conectado</p>
                    <p className="text-xs text-muted-foreground">4 horas atrás</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Atualização do sistema</p>
                    <p className="text-xs text-muted-foreground">1 dia atrás</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Backup realizado</p>
                    <p className="text-xs text-muted-foreground">1 dia atrás</p>
                  </div>
                </div>
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
                    <button className="flex flex-col items-center p-4 text-center space-y-2 rounded-lg border border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors">
                      <Building2 className="h-8 w-8 text-muted-foreground" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Nova Clínica</p>
                        <p className="text-xs text-muted-foreground">Cadastrar nova clínica</p>
                      </div>
                    </button>
                    
                    <button className="flex flex-col items-center p-4 text-center space-y-2 rounded-lg border border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors">
                      <DollarSign className="h-8 w-8 text-muted-foreground" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Gerenciar Planos</p>
                        <p className="text-xs text-muted-foreground">Configurar assinaturas</p>
                      </div>
                    </button>
                  </>
                )}
                
                <button className="flex flex-col items-center p-4 text-center space-y-2 rounded-lg border border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors">
                  <Users className="h-8 w-8 text-muted-foreground" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Gerenciar Usuários</p>
                    <p className="text-xs text-muted-foreground">Adicionar ou editar usuários</p>
                  </div>
                </button>
                
                <button className="flex flex-col items-center p-4 text-center space-y-2 rounded-lg border border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors">
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