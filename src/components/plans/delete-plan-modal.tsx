"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Loader2, Trash2, AlertTriangle, Building2 } from "lucide-react"
import { Plan } from "./columns"

interface DeletePlanModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plan: Plan | null
  onSuccess?: () => void
}

export function DeletePlanModal({ open, onOpenChange, plan, onSuccess }: DeletePlanModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleDelete = async () => {
    if (!plan) return

    setLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/plans/${plan.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao excluir plano")
      }

      onOpenChange(false)
      onSuccess?.()
      
    } catch (error) {
      console.error("Erro ao excluir plano:", error)
      setError(error instanceof Error ? error.message : "Erro ao excluir plano")
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number | null) => {
    if (!price) return "Gratuito"
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(Number(price))
  }

  if (!plan) return null

  const hasActiveTenants = plan.stats.totalTenants > 0
  const canDelete = !hasActiveTenants

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Excluir Plano
          </DialogTitle>
          <DialogDescription>
            Esta ação não pode ser desfeita. O plano será permanentemente removido do sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações do Plano */}
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.slug}</p>
              </div>
              <Badge variant={plan.isActive ? "default" : "secondary"}>
                {plan.isActive ? "Ativo" : "Inativo"}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Preço:</span>
                <div className="font-medium">{formatPrice(plan.price)}/mês</div>
              </div>
              <div>
                <span className="text-muted-foreground">Usuários:</span>
                <div className="font-medium">{plan.maxUsers} máximo</div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-destructive/20">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <strong>{plan.stats.totalTenants}</strong> clínica(s) usando este plano
                </span>
              </div>
            </div>
          </div>

          {/* Warning se há clínicas usando */}
          {hasActiveTenants && (
            <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Não é possível excluir este plano
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  Existem {plan.stats.totalTenants} clínica(s) utilizando este plano. 
                  Para excluir, primeiro mova todas as clínicas para outros planos ou desative-as.
                </p>
              </div>
            </div>
          )}

          {/* Confirmar exclusão se não há impedimentos */}
          {canDelete && (
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  Tem certeza que deseja excluir este plano?
                </p>
                <p className="text-xs text-red-700 dark:text-red-300">
                  Esta ação é permanente e não pode ser desfeita.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-md bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading || !canDelete}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Excluindo...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                {canDelete ? "Excluir Plano" : "Não é possível excluir"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}