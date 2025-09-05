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
import { Loader2, AlertTriangle, Building2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Tenant {
  id: string
  name: string
  slug: string
  stats: {
    totalUsers: number
    adminCount: number
    userCount: number
  }
}

interface DeleteClinicModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenant: Tenant | null
  onSuccess?: () => void
}

export function DeleteClinicModal({ open, onOpenChange, tenant, onSuccess }: DeleteClinicModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleDelete = async () => {
    if (!tenant) return
    
    setLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/clinics/${tenant.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao excluir clínica")
      }

      onOpenChange(false)
      onSuccess?.()
      
    } catch (error) {
      console.error("Erro ao excluir clínica:", error)
      setError(error instanceof Error ? error.message : "Erro ao excluir clínica")
    } finally {
      setLoading(false)
    }
  }

  // Pode excluir se não tem usuários regulares (só admin pode ficar)
  const canDelete = tenant?.stats.userCount === 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Excluir Clínica
          </DialogTitle>
          <DialogDescription>
            Esta ação não pode ser desfeita. A clínica será permanentemente removida do sistema.
          </DialogDescription>
        </DialogHeader>

        {tenant && (
          <div className="space-y-4">
            {/* Clinic Info */}
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                  <Building2 className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <h3 className="font-semibold">{tenant.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Slug: {tenant.slug}
                  </p>
                </div>
              </div>
            </div>

            {/* Users Check */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Admins:</span>
                  <Badge variant="secondary">
                    {tenant.stats.adminCount}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Usuários regulares:</span>
                  <Badge variant={tenant.stats.userCount === 0 ? "secondary" : "destructive"}>
                    {tenant.stats.userCount}
                  </Badge>
                </div>
              </div>
              
              {!canDelete && (
                <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium">Não é possível excluir esta clínica</p>
                      <p>Remova todos os usuários regulares antes de excluir. Os administradores serão removidos automaticamente.</p>
                    </div>
                  </div>
                </div>
              )}

              {canDelete && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                    <div className="text-sm text-red-800">
                      <p className="font-medium">Atenção!</p>
                      <p>Esta ação irá remover permanentemente a clínica, todos os dados e os administradores associados.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
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
              "Excluir Clínica"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}