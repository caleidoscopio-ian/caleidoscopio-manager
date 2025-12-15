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
import { useAuth } from "@/lib/auth/hooks"

interface Plan {
  id: string
  name: string
  slug: string
  maxUsers: number
  price: number | null
  isActive: boolean
}

interface Tenant {
  id: string
  name: string
  slug: string
  domain: string | null
  status: "ACTIVE" | "SUSPENDED" | "INACTIVE"
  maxUsers: number
  plan: Plan
  cnpj?: string | null
  razaoSocial?: string | null
  cep?: string | null
  endereco?: string | null
  cidade?: string | null
  estado?: string | null
}

interface EditClinicModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenant: Tenant | null
  onSuccess?: () => void
}

export function EditClinicModal({ open, onOpenChange, tenant, onSuccess }: EditClinicModalProps) {
  const { isSuperAdmin } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [availablePlans, setAvailablePlans] = useState<Plan[]>([])
  const [loadingPlans, setLoadingPlans] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    domain: "",
    status: "ACTIVE" as "ACTIVE" | "SUSPENDED" | "INACTIVE",
    maxUsers: "",
    planId: "",
    // Novos campos
    cnpj: "",
    razaoSocial: "",
    cep: "",
    endereco: "",
    cidade: "",
    estado: "",
  })

  useEffect(() => {
    if (tenant && open) {
      setFormData({
        name: tenant.name,
        slug: tenant.slug,
        domain: tenant.domain || "",
        status: tenant.status,
        maxUsers: tenant.maxUsers.toString(),
        planId: tenant.plan.id,
        // Novos campos (com valores padrão se não existirem)
        cnpj: tenant.cnpj || "",
        razaoSocial: tenant.razaoSocial || "",
        cep: tenant.cep || "",
        endereco: tenant.endereco || "",
        cidade: tenant.cidade || "",
        estado: tenant.estado || "",
      })
    }
  }, [tenant, open])

  useEffect(() => {
    if (open && isSuperAdmin) {
      fetchPlans()
    }
  }, [open, isSuperAdmin])

  const fetchPlans = async () => {
    try {
      setLoadingPlans(true)
      const response = await fetch('/api/plans')

      if (!response.ok) {
        throw new Error('Erro ao carregar planos')
      }

      const data = await response.json()
      setAvailablePlans(data.plans || [])
    } catch (error) {
      console.error('Erro ao buscar planos:', error)
    } finally {
      setLoadingPlans(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Auto-generate slug from name if name changed
    if (field === "name" && tenant?.slug === formData.slug) {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim()
      
      setFormData(prev => ({ ...prev, slug }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenant) return
    
    setLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/clinics/${tenant.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          maxUsers: formData.maxUsers ? parseInt(formData.maxUsers) : undefined,
          planId: formData.planId || undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao atualizar clínica")
      }

      onOpenChange(false)
      onSuccess?.()
      
    } catch (error) {
      console.error("Erro ao atualizar clínica:", error)
      setError(error instanceof Error ? error.message : "Erro ao atualizar clínica")
    } finally {
      setLoading(false)
    }
  }

  const getStatusText = (status: string) => {
    const statusMap = {
      ACTIVE: "Ativo",
      SUSPENDED: "Suspenso",
      INACTIVE: "Inativo"
    }
    return statusMap[status as keyof typeof statusMap] || status
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Editar Clínica
          </DialogTitle>
          <DialogDescription>
            Atualize as informações da clínica {tenant?.name}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome da Clínica *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Clínica São Paulo"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-slug">Identificador (Slug) *</Label>
              <Input
                id="edit-slug"
                value={formData.slug}
                onChange={(e) => handleInputChange("slug", e.target.value)}
                placeholder="clinica-sao-paulo"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-domain">Domínio Personalizado</Label>
            <Input
              id="edit-domain"
              value={formData.domain}
              onChange={(e) => handleInputChange("domain", e.target.value)}
              placeholder="clinica.exemplo.com"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange("status", value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Ativo</SelectItem>
                  <SelectItem value="SUSPENDED">Suspenso</SelectItem>
                  <SelectItem value="INACTIVE">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-maxUsers">Limite de Usuários</Label>
              <Input
                id="edit-maxUsers"
                type="number"
                value={formData.maxUsers}
                onChange={(e) => handleInputChange("maxUsers", e.target.value)}
                placeholder={tenant?.plan.maxUsers.toString()}
                min="1"
              />
              <p className="text-xs text-muted-foreground">
                Padrão do plano: {tenant?.plan.maxUsers} usuários
              </p>
            </div>
          </div>

          {/* Dados Empresariais */}
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Dados Empresariais</h3>
              <p className="text-sm text-muted-foreground">
                Informações da empresa para contratos e documentação
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  value={formData.cnpj}
                  onChange={(e) => handleInputChange("cnpj", e.target.value)}
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="razaoSocial">Razão Social</Label>
                <Input
                  id="razaoSocial"
                  value={formData.razaoSocial}
                  onChange={(e) => handleInputChange("razaoSocial", e.target.value)}
                  placeholder="Nome da empresa"
                />
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Endereço</h3>
              <p className="text-sm text-muted-foreground">
                Localização da clínica
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  value={formData.cep}
                  onChange={(e) => handleInputChange("cep", e.target.value)}
                  placeholder="00000-000"
                  maxLength={9}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  value={formData.cidade}
                  onChange={(e) => handleInputChange("cidade", e.target.value)}
                  placeholder="Cidade"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="endereco">Endereço Completo</Label>
                <Input
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => handleInputChange("endereco", e.target.value)}
                  placeholder="Rua, número, complemento"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Input
                  id="estado"
                  value={formData.estado}
                  onChange={(e) => handleInputChange("estado", e.target.value)}
                  placeholder="SP"
                  maxLength={2}
                />
              </div>
            </div>
          </div>

          {/* Plano - Editável apenas para Super Admin */}
          {isSuperAdmin ? (
            <div className="space-y-2">
              <Label htmlFor="edit-plan">Plano *</Label>
              <Select
                value={formData.planId}
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, planId: value }))
                  // Atualizar maxUsers baseado no plano selecionado
                  const selectedPlan = availablePlans.find(p => p.id === value)
                  if (selectedPlan) {
                    setFormData(prev => ({
                      ...prev,
                      maxUsers: selectedPlan.maxUsers.toString()
                    }))
                  }
                }}
                disabled={loadingPlans}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingPlans ? "Carregando planos..." : "Selecione um plano"} />
                </SelectTrigger>
                <SelectContent>
                  {availablePlans
                    .filter(plan => plan.isActive)
                    .map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name} - {plan.price ? `R$ ${plan.price}` : 'Gratuito'} ({plan.maxUsers} usuários)
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                O plano define os produtos disponíveis e o limite de usuários
              </p>
            </div>
          ) : (
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm font-medium">Plano Atual: {tenant?.plan.name}</p>
              <p className="text-xs text-muted-foreground">
                Apenas o Super Admin pode alterar o plano
              </p>
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
                "Salvar Alterações"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}