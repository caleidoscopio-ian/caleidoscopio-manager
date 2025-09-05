"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Building2, Users, Calendar, DollarSign, Globe, Activity } from "lucide-react"

interface Plan {
  id: string
  name: string
  maxUsers: number
  price: number | null
}

interface Tenant {
  id: string
  name: string
  slug: string
  domain: string | null
  status: "ACTIVE" | "SUSPENDED" | "INACTIVE"
  maxUsers: number
  createdAt: string
  updatedAt: string
  plan: Plan
  stats: {
    totalUsers: number
    activeUsers: number
    adminCount: number
    userCount: number
    lastActivity: string | null
  }
}

interface ViewClinicModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenant: Tenant | null
}

export function ViewClinicModal({ open, onOpenChange, tenant }: ViewClinicModalProps) {
  const formatPrice = (price: number | null) => {
    if (!price) return "Gratuito"
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(Number(price))
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

  const getStatusBadge = (status: Tenant['status']) => {
    const variants = {
      ACTIVE: { variant: "default" as const, text: "Ativo", color: "text-green-600" },
      SUSPENDED: { variant: "secondary" as const, text: "Suspenso", color: "text-yellow-600" },
      INACTIVE: { variant: "destructive" as const, text: "Inativo", color: "text-red-600" }
    }
    
    const config = variants[status]
    return (
      <Badge variant={config.variant}>
        {config.text}
      </Badge>
    )
  }

  if (!tenant) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {tenant.name}
          </DialogTitle>
          <DialogDescription>
            Informações detalhadas da clínica
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Nome</p>
                <p className="font-medium">{tenant.name}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Identificador</p>
                <p className="font-medium font-mono text-sm">{tenant.slug}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="mt-1">
                  {getStatusBadge(tenant.status)}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Domínio</p>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">{tenant.domain || "Não configurado"}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Criada em</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">{formatDate(tenant.createdAt)}</p>
                </div>
              </div>

              {tenant.stats.lastActivity && (
                <div>
                  <p className="text-sm text-muted-foreground">Última Atividade</p>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{formatDate(tenant.stats.lastActivity)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Plan Info */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Plano e Licenciamento
            </h3>
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Plano Atual</p>
                <p className="font-medium">{tenant.plan.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor Mensal</p>
                <p className="font-medium">{formatPrice(tenant.plan.price)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Limite de Usuários</p>
                <p className="font-medium">{tenant.maxUsers} usuários</p>
              </div>
            </div>
          </div>

          {/* Users Stats */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Estatísticas de Usuários
            </h3>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{tenant.stats.totalUsers}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{tenant.stats.activeUsers}</p>
                <p className="text-xs text-muted-foreground">Ativos</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{tenant.stats.adminCount}</p>
                <p className="text-xs text-muted-foreground">Admins</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{tenant.stats.userCount}</p>
                <p className="text-xs text-muted-foreground">Usuários</p>
              </div>
            </div>

            {/* Usage Progress */}
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Uso de Licenças</span>
                <span>{tenant.stats.totalUsers}/{tenant.maxUsers}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    (tenant.stats.totalUsers / tenant.maxUsers) > 0.9 
                      ? 'bg-red-500' 
                      : (tenant.stats.totalUsers / tenant.maxUsers) > 0.7 
                        ? 'bg-yellow-500' 
                        : 'bg-green-500'
                  }`}
                  style={{ 
                    width: `${Math.min((tenant.stats.totalUsers / tenant.maxUsers) * 100, 100)}%` 
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}