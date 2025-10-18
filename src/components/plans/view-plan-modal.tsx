"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { CreditCard, Users, Calendar, Check, Building2, DollarSign, Package } from "lucide-react"
import { Plan } from "./columns"

interface ViewPlanModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plan: Plan | null
}


export function ViewPlanModal({ open, onOpenChange, plan }: ViewPlanModalProps) {
  if (!plan) return null

  const formatPrice = (price: number | null) => {
    if (!price) return "Gratuito"
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(Number(price))
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {plan.name}
          </DialogTitle>
          <DialogDescription>
            Detalhes completos do plano de assinatura
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Principais */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status</span>
                <Badge variant={plan.isActive ? "default" : "secondary"}>
                  {plan.isActive ? "Ativo" : "Inativo"}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Preço</span>
                <div className="text-right">
                  <div className="font-semibold">{formatPrice(plan.price)}</div>
                  <div className="text-xs text-muted-foreground">/mês</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Usuários</span>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">{plan.maxUsers}</span>
                  <span className="text-sm text-muted-foreground">máximo</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Clínicas Usando</span>
                <div className="flex items-center gap-1">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">{plan.stats.totalTenants}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium">Identificador</span>
                <div className="text-sm text-muted-foreground font-mono bg-muted px-2 py-1 rounded mt-1">
                  {plan.slug}
                </div>
              </div>

              <div>
                <span className="text-sm font-medium">Receita Potencial</span>
                <div className="flex items-center gap-1 mt-1">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">
                    {formatPrice((plan.price || 0) * plan.stats.totalTenants)}
                  </span>
                  <span className="text-sm text-muted-foreground">/mês</span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Descrição */}
          {plan.description && (
            <>
              <div>
                <h3 className="text-sm font-medium mb-2">Descrição</h3>
                <p className="text-sm text-muted-foreground">
                  {plan.description}
                </p>
              </div>
              <Separator />
            </>
          )}

          {/* Produtos do Ecossistema */}
          <div>
            <h3 className="text-sm font-medium mb-3">
              Produtos do Ecossistema ({plan.planProducts?.filter(pp => pp.isActive).length || 0})
            </h3>
            
            {plan.planProducts && plan.planProducts.filter(pp => pp.isActive).length > 0 ? (
              <div className="grid gap-3 md:grid-cols-1">
                {plan.planProducts
                  .filter(pp => pp.isActive)
                  .map((planProduct) => (
                    <div
                      key={planProduct.id}
                      className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50"
                    >
                      <div
                        className="p-2 rounded-lg"
                        style={{
                          backgroundColor: planProduct.product.color
                            ? `${planProduct.product.color}20`
                            : "#f1f5f9",
                          color: planProduct.product.color || "#64748b",
                        }}
                      >
                        <Package className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium">
                            {planProduct.product.name}
                          </span>
                        </div>
                        {planProduct.product.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {planProduct.product.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Nenhum produto do ecossistema associado a este plano
              </p>
            )}
          </div>

          <Separator />

          {/* Metadados */}
          <div className="grid gap-3 md:grid-cols-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>Criado em: {formatDate(plan.createdAt)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>Atualizado em: {formatDate(plan.updatedAt)}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}