"use client"

import { useAuth } from "@/lib/auth/hooks"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, BarChart3, Download } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function ReportsPage() {
  const { isAuthenticated, isAdmin, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!isAuthenticated || !isAdmin)) {
      router.push("/dashboard")
    }
  }, [loading, isAuthenticated, isAdmin, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated || !isAdmin) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-6 p-8 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Relatórios</h2>
            <p className="text-muted-foreground">
              Visualize relatórios e estatísticas do sistema
            </p>
          </div>
          <Button className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>

        {/* Coming Soon Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Sistema de Relatórios
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center py-12">
            <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Em Desenvolvimento</h3>
            <p className="text-muted-foreground mb-4">
              Os relatórios e estatísticas estão sendo desenvolvidos.
            </p>
            <p className="text-sm text-muted-foreground">
              Em breve você poderá visualizar relatórios detalhados de uso, performance e estatísticas.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}