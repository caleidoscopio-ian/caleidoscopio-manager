"use client"

import { useAuth } from "@/lib/auth/hooks"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Users, UserPlus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function UsersPage() {
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
            <h2 className="text-3xl font-bold tracking-tight">Usuários</h2>
            <p className="text-muted-foreground">
              Gerencie usuários do sistema
            </p>
          </div>
          <Button className="gap-2">
            <UserPlus className="h-4 w-4" />
            Novo Usuário
          </Button>
        </div>

        {/* Coming Soon Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Gerenciamento de Usuários
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center py-12">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Em Desenvolvimento</h3>
            <p className="text-muted-foreground mb-4">
              A funcionalidade de gerenciamento de usuários está sendo desenvolvida.
            </p>
            <p className="text-sm text-muted-foreground">
              Em breve você poderá criar, editar e gerenciar usuários do sistema.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}