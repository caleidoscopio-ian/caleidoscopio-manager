"use client"

import { useAuth } from "@/lib/auth/hooks"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2, User, Mail, Calendar, Shield } from "lucide-react"

export default function ProfilePage() {
  const { user, loading, isAuthenticated } = useAuth()

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRoleBadge = (role: string) => {
    const variants = {
      SUPER_ADMIN: { variant: "default" as const, text: "Super Administrador" },
      ADMIN: { variant: "secondary" as const, text: "Administrador" },
      USER: { variant: "outline" as const, text: "Usuário" }
    }
    
    const config = variants[role as keyof typeof variants] || variants.USER
    return (
      <Badge variant={config.variant}>
        {config.text}
      </Badge>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-6 p-8 pt-6">
        {/* Header */}
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Meu Perfil</h2>
          <p className="text-muted-foreground">
            Gerencie suas informações pessoais e configurações de conta
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Profile Overview */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <form className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input
                      id="name"
                      defaultValue={user?.name}
                      disabled
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      defaultValue={user?.email}
                      disabled
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Função</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="role"
                      value={user?.role === "SUPER_ADMIN" ? "Super Administrador" : 
                            user?.role === "ADMIN" ? "Administrador" : "Usuário"}
                      disabled
                    />
                    {getRoleBadge(user?.role || "USER")}
                  </div>
                </div>

                {user?.tenant && (
                  <div className="space-y-2">
                    <Label htmlFor="tenant">Clínica</Label>
                    <Input
                      id="tenant"
                      value={`${user.tenant.name} (${user.tenant.slug})`}
                      disabled
                    />
                  </div>
                )}

                <div className="pt-4">
                  <Button type="button" disabled>
                    Editar Perfil (Em breve)
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Account Stats */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Estatísticas da Conta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Membro desde</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(new Date().toISOString())}
                    </p>
                  </div>
                </div>


                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Status da conta</p>
                    <Badge variant="default" className="text-xs">
                      Ativa
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Segurança</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full" disabled>
                  Alterar Senha (Em breve)
                </Button>
                <Button variant="outline" className="w-full" disabled>
                  Verificação em 2 Fatores (Em breve)
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}