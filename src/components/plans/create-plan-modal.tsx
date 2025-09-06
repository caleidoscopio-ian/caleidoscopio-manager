"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, CreditCard, Plus, X } from "lucide-react"

interface CreatePlanModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

const DEFAULT_FEATURES = [
  'gestao_pacientes',
  'agenda_basica',
  'agenda_avancada',
  'prontuario',
  'relatorios',
  'integracao_caleidoscopio',
  'api_acesso',
  'suporte_prioritario',
  'backup_automatico',
  'dominio_personalizado'
]

const FEATURE_LABELS = {
  gestao_pacientes: 'Gestão de Pacientes',
  agenda_basica: 'Agenda Básica',
  agenda_avancada: 'Agenda Avançada',
  prontuario: 'Prontuário Eletrônico',
  relatorios: 'Relatórios e Análises',
  integracao_caleidoscopio: 'Integração Caleidoscópio',
  api_acesso: 'Acesso à API',
  suporte_prioritario: 'Suporte Prioritário',
  backup_automatico: 'Backup Automático',
  dominio_personalizado: 'Domínio Personalizado'
}

export function CreatePlanModal({ open, onOpenChange, onSuccess }: CreatePlanModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    maxUsers: "",
    price: "",
    isActive: true,
    features: [] as string[],
  })

  const handleInputChange = (field: string, value: string | boolean) => {
    if (field === "name" && typeof value === "string") {
      // Auto-generate slug from name
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim()
      
      setFormData(prev => ({ ...prev, [field]: value, slug }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
  }

  const handleFeatureToggle = (feature: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      features: checked 
        ? [...prev.features, feature]
        : prev.features.filter(f => f !== feature)
    }))
  }

  const formatPrice = (price: string) => {
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
      const response = await fetch("/api/plans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          maxUsers: formData.maxUsers ? parseInt(formData.maxUsers) : undefined,
          price: formData.price ? parseFloat(formData.price) : null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao criar plano")
      }

      // Reset form
      setFormData({
        name: "",
        slug: "",
        description: "",
        maxUsers: "",
        price: "",
        isActive: true,
        features: [],
      })

      onOpenChange(false)
      onSuccess?.()
      
    } catch (error) {
      console.error("Erro ao criar plano:", error)
      setError(error instanceof Error ? error.message : "Erro ao criar plano")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Criar Novo Plano
          </DialogTitle>
          <DialogDescription>
            Crie um novo plano de assinatura com funcionalidades e preços personalizados.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Informações Básicas</h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Plano *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Plano Premium"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Identificador (Slug) *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => handleInputChange("slug", e.target.value)}
                  placeholder="plano-premium"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Descrição detalhada do plano..."
                rows={3}
              />
            </div>
          </div>

          {/* Configurações */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Configurações</h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="maxUsers">Limite de Usuários *</Label>
                <Input
                  id="maxUsers"
                  type="number"
                  value={formData.maxUsers}
                  onChange={(e) => handleInputChange("maxUsers", e.target.value)}
                  placeholder="50"
                  required
                  min="1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Preço Mensal (R$)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => handleInputChange("price", e.target.value)}
                  placeholder="199.99"
                />
                <p className="text-xs text-muted-foreground">
                  Deixe vazio para plano gratuito. Valor: {formatPrice(formData.price)}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => handleInputChange("isActive", checked)}
              />
              <Label htmlFor="isActive">Plano ativo</Label>
              <p className="text-xs text-muted-foreground">
                Planos inativos não ficam disponíveis para novos cadastros
              </p>
            </div>
          </div>

          {/* Funcionalidades */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Funcionalidades Incluídas</h3>
            
            <div className="grid gap-3 md:grid-cols-2">
              {DEFAULT_FEATURES.map((feature) => (
                <div key={feature} className="flex items-center space-x-2">
                  <Checkbox
                    id={feature}
                    checked={formData.features.includes(feature)}
                    onCheckedChange={(checked) => handleFeatureToggle(feature, !!checked)}
                  />
                  <Label htmlFor={feature} className="text-sm">
                    {FEATURE_LABELS[feature as keyof typeof FEATURE_LABELS]}
                  </Label>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground">
              Funcionalidades selecionadas: {formData.features.length}
            </p>
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
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Plano
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}