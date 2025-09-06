"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  Loader2, 
  Trash2, 
  AlertTriangle, 
  Building2, 
  Shield,
  ShieldCheck,
  Crown,
  Globe
} from "lucide-react"
import { User } from "./columns"

interface DeleteUserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
  onSuccess?: () => void
}

export function DeleteUserModal({ open, onOpenChange, user, onSuccess }: DeleteUserModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleDelete = async () => {
    if (!user) return

    setLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao excluir usuário")
      }

      onOpenChange(false)
      onSuccess?.()
      
    } catch (error) {
      console.error("Erro ao excluir usuário:", error)
      setError(error instanceof Error ? error.message : "Erro ao excluir usuário")
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  const getRoleConfig = (role: string) => {
    const configs = {
      SUPER_ADMIN: { text: "Super Administrador", icon: Crown, color: "text-yellow-600" },
      ADMIN: { text: "Administrador", icon: ShieldCheck, color: "text-blue-600" },
      USER: { text: "Usuário", icon: Shield, color: "text-gray-600" }
    }
    return configs[role as keyof typeof configs] || configs.USER
  }

  const roleConfig = getRoleConfig(user.role)
  const RoleIcon = roleConfig.icon

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Excluir Usuário
          </DialogTitle>
          <DialogDescription>
            Esta ação não pode ser desfeita. O usuário será permanentemente removido do sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações do Usuário */}
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
            <div className="flex items-start space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="text-sm font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{user.name}</h3>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <Badge variant={user.isActive ? "default" : "secondary"}>
                    {user.isActive ? "Ativo" : "Inativo"}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <div className={`flex items-center gap-1 ${roleConfig.color}`}>
                    <RoleIcon className="h-4 w-4" />
                    <span>{roleConfig.text}</span>
                  </div>

                  <div className="flex items-center gap-1 text-muted-foreground">
                    {user.tenant ? (
                      <>
                        <Building2 className="h-4 w-4" />
                        <span>{user.tenant.name}</span>
                      </>
                    ) : (
                      <>
                        <Globe className="h-4 w-4" />
                        <span>Global</span>
                      </>
                    )}
                  </div>
                </div>

                {user.stats.activeSessions > 0 && (
                  <div className="text-xs text-yellow-600 font-medium">
                    ⚠️ {user.stats.activeSessions} sessão(ões) ativa(s)
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Avisos */}
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                Tem certeza que deseja excluir este usuário?
              </p>
              <div className="text-xs text-red-700 dark:text-red-300 space-y-1">
                <p>• Esta ação é permanente e não pode ser desfeita</p>
                <p>• Todas as sessões ativas serão encerradas</p>
                <p>• O histórico de atividades será mantido para auditoria</p>
                {user.role === 'SUPER_ADMIN' && (
                  <p className="font-medium">• ⚠️ CUIDADO: Este é um Super Administrador!</p>
                )}
                {user.role === 'ADMIN' && user.tenant && (
                  <p className="font-medium">• ⚠️ Este usuário é administrador de "{user.tenant.name}"</p>
                )}
              </div>
            </div>
          </div>

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
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Excluindo...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir Usuário
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}