"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Loader2, Building2 } from "lucide-react"

interface Plan {
  id: string
  name: string
  slug: string
  maxUsers: number
  price: number | null
  stats: {
    totalTenants: number
  }
}

interface CreateClinicModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateClinicModal({ open, onOpenChange, onSuccess }: CreateClinicModalProps) {
  const [loading, setLoading] = useState(false)
  const [plans, setPlans] = useState<Plan[]>([])
  const [loadingPlans, setLoadingPlans] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    domain: "",
    planId: "",
    maxUsers: "",
    adminName: "",
    adminEmail: "",
    adminPassword: "",
  })

  useEffect(() => {
    if (open) {
      fetchPlans()
    }
  }, [open])

  const fetchPlans = async () => {
    try {
      setLoadingPlans(true)
      const response = await fetch("/api/plans")
      
      if (!response.ok) {
        throw new Error("Erro ao carregar planos")
      }

      const data = await response.json()
      setPlans(data.plans)
    } catch (error) {
      console.error("Erro ao buscar planos:", error)
      setError("Erro ao carregar planos disponíveis")
    } finally {
      setLoadingPlans(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Auto-generate slug from name
    if (field === "name") {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim()
      
      setFormData(prev => ({ ...prev, slug }))
    }
  }

  const formatPrice = (price: number | null) => {
    if (!price) return "Gratuito"
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(Number(price))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/clinics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          maxUsers: formData.maxUsers ? parseInt(formData.maxUsers) : undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao criar clínica")
      }

      // Reset form
      setFormData({
        name: "",
        slug: "",
        domain: "",
        planId: "",
        maxUsers: "",
        adminName: "",
        adminEmail: "",
        adminPassword: "",
      })

      onOpenChange(false)
      onSuccess?.()
      
    } catch (error) {
      console.error("Erro ao criar clínica:", error)
      setError(error instanceof Error ? error.message : "Erro ao criar clínica")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Criar Nova Clínica
          </DialogTitle>
          <DialogDescription>
            Cadastre uma nova clínica no sistema. Um usuário administrador será criado automaticamente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações da Clínica */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Informações da Clínica</h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Clínica *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Clínica São Paulo"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Identificador (Slug) *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => handleInputChange("slug", e.target.value)}
                  placeholder="clinica-sao-paulo"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Usado para identificar a clínica no sistema
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="domain">Domínio Personalizado</Label>
              <Input
                id="domain"
                value={formData.domain}
                onChange={(e) => handleInputChange("domain", e.target.value)}
                placeholder="clinica.exemplo.com"
              />
              <p className="text-xs text-muted-foreground">
                Opcional: domínio personalizado para a clínica
              </p>
            </div>
          </div>

          {/* Plano e Configurações */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Plano e Configurações</h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="planId">Plano *</Label>
                {loadingPlans ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Carregando planos...</span>
                  </div>
                ) : (
                  <Select
                    value={formData.planId}
                    onValueChange={(value) => handleInputChange("planId", value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um plano" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{plan.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatPrice(plan.price)} • {plan.maxUsers} usuários
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxUsers">Limite de Usuários</Label>
                <Input
                  id="maxUsers"
                  type="number"
                  value={formData.maxUsers}
                  onChange={(e) => handleInputChange("maxUsers", e.target.value)}
                  placeholder="Padrão do plano"
                  min="1"
                />
                <p className="text-xs text-muted-foreground">
                  Deixe vazio para usar o limite do plano
                </p>
              </div>
            </div>
          </div>

          {/* Dados do Administrador */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Administrador da Clínica</h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="adminName">Nome do Administrador *</Label>
                <Input
                  id="adminName"
                  value={formData.adminName}
                  onChange={(e) => handleInputChange("adminName", e.target.value)}
                  placeholder="João Silva"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminEmail">Email do Administrador *</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  value={formData.adminEmail}
                  onChange={(e) => handleInputChange("adminEmail", e.target.value)}
                  placeholder="admin@clinica.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminPassword">Senha Inicial *</Label>
              <Input
                id="adminPassword"
                type="password"
                value={formData.adminPassword}
                onChange={(e) => handleInputChange("adminPassword", e.target.value)}
                placeholder="Senha segura"
                required
                minLength={6}
              />
              <p className="text-xs text-muted-foreground">
                Mínimo de 6 caracteres. O administrador poderá alterar depois.
              </p>
            </div>
          </div>

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
                  Criando...
                </>
              ) : (
                "Criar Clínica"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}