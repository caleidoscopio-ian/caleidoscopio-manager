"use client"

import { useAuth } from "@/lib/auth/hooks"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, FileText, Download } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function AuditLogsPage() {
  const { isAuthenticated, isSuperAdmin, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!isAuthenticated || !isSuperAdmin)) {
      router.push("/dashboard")
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
            <h2 className="text-3xl font-bold tracking-tight">Logs de Auditoria</h2>
            <p className="text-muted-foreground">
              Monitore atividades e eventos de segurança do sistema
            </p>
          </div>
          <Button className="gap-2">
            <Download className="h-4 w-4" />
            Exportar Logs
          </Button>
        </div>

        {/* Coming Soon Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Sistema de Auditoria
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center py-12">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Em Desenvolvimento</h3>
            <p className="text-muted-foreground mb-4">
              O sistema de logs de auditoria está sendo desenvolvido.
            </p>
            <p className="text-sm text-muted-foreground">
              Em breve você poderá monitorar todas as atividades do sistema e eventos de segurança.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}