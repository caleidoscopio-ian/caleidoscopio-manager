"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth/hooks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Save, Eye, EyeOff, AlertTriangle } from "lucide-react"
import { User } from "./columns"

interface Tenant {
  id: string
  name: string
  slug: string
}

interface EditUserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
  onSuccess?: () => void
  tenants: Tenant[]
}

export function EditUserModal({ open, onOpenChange, user, onSuccess, tenants }: EditUserModalProps) {
  const { user: currentUser, isSuperAdmin } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [changePassword, setChangePassword] = useState(false)

  const [formData, setFormData] = useState({
    email: "",
    name: "",
    password: "",
    role: "USER" as "SUPER_ADMIN" | "ADMIN" | "USER",
    tenantId: "",
    isActive: true,
  })

  useEffect(() => {
    if (user && open) {
      setFormData({
        email: user.email,
        name: user.name,
        password: "",
        role: user.role,
        tenantId: user.tenantId || "global",
        isActive: user.isActive,
      })
      setChangePassword(false)
      setError("")
    }
  }, [user, open])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData(prev => ({ ...prev, password }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setError("")

    try {
      const submitData: any = {
        email: formData.email,
        name: formData.name,
        role: formData.role,
        tenantId: formData.tenantId === 'global' ? null : formData.tenantId || null,
        isActive: formData.isActive,
      }

      // Só incluir senha se estiver sendo alterada
      if (changePassword && formData.password) {
        submitData.password = formData.password
      }

      const response = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao atualizar usuário")
      }

      onOpenChange(false)
      onSuccess?.()
      
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error)
      setError(error instanceof Error ? error.message : "Erro ao atualizar usuário")
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  const isCurrentUser = currentUser?.id === user.id
  const canEditRole = isSuperAdmin || (currentUser?.role === 'ADMIN' && user.role !== 'SUPER_ADMIN')
  const canEditEmail = !isCurrentUser
  const canEditStatus = !isCurrentUser

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Editar Usuário: {user.name}
          </DialogTitle>
          <DialogDescription>
            Modifique as informações e permissões do usuário.
            {isCurrentUser && (
              <span className="text-yellow-600 block mt-1">
                ⚠️ Você está editando sua própria conta.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="João Silva"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="joao@exemplo.com"
                  required
                  disabled={!canEditEmail}
                />
                {!canEditEmail && (
                  <p className="text-xs text-muted-foreground">
                    Você não pode alterar seu próprio email
                  </p>
                )}
              </div>
            </div>

            {/* Alterar Senha */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="changePassword"
                  checked={changePassword}
                  onCheckedChange={setChangePassword}
                />
                <Label htmlFor="changePassword">Alterar senha</Label>
              </div>

              {changePassword && (
                <div className="space-y-2">
                  <Label htmlFor="password">Nova Senha *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      placeholder="Digite a nova senha"
                      required={changePassword}
                      minLength={6}
                      className="pr-20"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-3">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-xs text-muted-foreground">
                      Mínimo de 6 caracteres
                    </p>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs"
                      onClick={generatePassword}
                    >
                      Gerar senha
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Permissões e Configurações */}
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="role">Papel *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: "SUPER_ADMIN" | "ADMIN" | "USER") => handleInputChange("role", value)}
                  disabled={!canEditRole}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o papel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">Usuário</SelectItem>
                    <SelectItem value="ADMIN">Administrador</SelectItem>
                    {isSuperAdmin && (
                      <SelectItem value="SUPER_ADMIN">Super Administrador</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {!canEditRole && (
                  <p className="text-xs text-muted-foreground">
                    Você não tem permissão para alterar este papel
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenantId">Clínica</Label>
                <Select
                  value={formData.tenantId}
                  onValueChange={(value) => handleInputChange("tenantId", value)}
                  disabled={formData.role === "SUPER_ADMIN" || !isSuperAdmin}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={formData.role === "SUPER_ADMIN" ? "Usuário global" : "Selecione uma clínica"} />
                  </SelectTrigger>
                  <SelectContent>
                    {isSuperAdmin && formData.role !== "SUPER_ADMIN" && (
                      <SelectItem value="global">Usuário global</SelectItem>
                    )}
                    {tenants.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {formData.role === "SUPER_ADMIN" 
                    ? "Super Admins são usuários globais" 
                    : !isSuperAdmin 
                      ? "Apenas Super Admins podem alterar clínicas"
                      : "Deixe vazio para usuário global"}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => handleInputChange("isActive", checked)}
                disabled={!canEditStatus}
              />
              <Label htmlFor="isActive">Usuário ativo</Label>
              <p className="text-xs text-muted-foreground">
                {!canEditStatus ? "Você não pode desativar sua própria conta" : "Usuários inativos não conseguem fazer login"}
              </p>
            </div>
          </div>

          {/* Avisos */}
          {isCurrentUser && !formData.isActive && (
            <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Atenção
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  Você não pode desativar sua própria conta.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-md bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{error}</p>
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
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}