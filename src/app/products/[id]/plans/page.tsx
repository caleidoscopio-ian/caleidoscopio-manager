"use client"

import { useAuth } from "@/lib/auth/hooks"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Package,
  CreditCard,
  Settings,
  Plus,
  AlertCircle
} from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { toast } from "sonner"

interface Plan {
  id: string
  name: string
  slug: string
  description?: string
  maxUsers: number
  features: string[]
  price?: number
  isActive: boolean
}

interface PlanProduct {
  id: string
  planId: string
  productId: string
  plan: Plan
  config?: any
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface Product {
  id: string
  name: string
  slug: string
  description?: string
  planProducts: PlanProduct[]
}

export default function ProductPlansPage() {
  const { user, loading, isAuthenticated, isSuperAdmin } = useAuth()
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string

  const [product, setProduct] = useState<Product | null>(null)
  const [allPlans, setAllPlans] = useState<Plan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [planConfigs, setPlanConfigs] = useState<Record<string, { config: string, isActive: boolean }>>({})

  useEffect(() => {
    if (loading) return
    
    if (!isAuthenticated || !isSuperAdmin) {
      router.push('/dashboard')
      return
    }

    if (productId) {
      fetchData()
    }
  }, [loading, isAuthenticated, isSuperAdmin, router, productId])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      
      // Buscar produto com relacionamentos
      const [productResponse, plansResponse] = await Promise.all([
        fetch(`/api/products/${productId}`),
        fetch('/api/plans')
      ])

      if (!productResponse.ok || !plansResponse.ok) {
        throw new Error('Erro ao carregar dados')
      }

      const productData = await productResponse.json()
      const plansData = await plansResponse.json()

      setProduct(productData.product)
      setAllPlans(plansData.plans)

      // Inicializar configurações dos planos
      const configs: Record<string, { config: string, isActive: boolean }> = {}
      plansData.plans.forEach((plan: Plan) => {
        const planProduct = productData.product.planProducts.find((pp: PlanProduct) => pp.planId === plan.id)
        configs[plan.id] = {
          config: planProduct?.config ? JSON.stringify(planProduct.config, null, 2) : '{}',
          isActive: planProduct?.isActive ?? false
        }
      })
      setPlanConfigs(configs)

    } catch (error: any) {
      console.error('Erro ao carregar dados:', error)
      toast.error(error.message || 'Erro ao carregar dados')
      router.push('/products')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSavePlanProduct = async (planId: string) => {
    try {
      setIsSaving(true)
      
      const config = planConfigs[planId]
      let parsedConfig
      
      try {
        parsedConfig = JSON.parse(config.config)
      } catch {
        toast.error('Configuração deve ser um JSON válido')
        return
      }

      const existingPlanProduct = product?.planProducts.find(pp => pp.planId === planId)

      if (config.isActive) {
        // Criar ou atualizar associação
        const method = existingPlanProduct ? 'PUT' : 'POST'
        const url = existingPlanProduct 
          ? `/api/plans/${planId}/products/${productId}`
          : `/api/plans/${planId}/products`

        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId,
            config: parsedConfig,
            isActive: true
          })
        })

        if (!response.ok) {
          throw new Error('Erro ao salvar associação')
        }
      } else if (existingPlanProduct) {
        // Desativar associação existente
        const response = await fetch(`/api/plans/${planId}/products/${productId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            isActive: false
          })
        })

        if (!response.ok) {
          throw new Error('Erro ao desativar associação')
        }
      }

      toast.success('Configuração salva com sucesso!')
      await fetchData() // Recarregar dados

    } catch (error: any) {
      console.error('Erro ao salvar:', error)
      toast.error(error.message || 'Erro ao salvar configuração')
    } finally {
      setIsSaving(false)
    }
  }

  if (loading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  if (!product) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Produto não encontrado</p>
            <Button onClick={() => router.push('/products')} className="mt-4">
              Voltar para Produtos
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-6 p-8 pt-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push(`/products/${productId}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Configurações por Plano</h2>
            <p className="text-muted-foreground">
              Configure "{product.name}" para cada plano de assinatura
            </p>
          </div>
        </div>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {product.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {product.description || 'Configure como este produto se comporta em cada plano'}
            </p>
          </CardHeader>
        </Card>

        {/* Planos */}
        <div className="grid gap-6">
          {allPlans.map((plan) => {
            const config = planConfigs[plan.id]
            const existingPlanProduct = product.planProducts.find(pp => pp.planId === plan.id)
            
            return (
              <Card key={plan.id} className={`transition-all ${config?.isActive ? 'ring-2 ring-primary/20' : ''}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {plan.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {plan.price ? `R$ ${plan.price.toFixed(2)}` : 'Gratuito'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Até {plan.maxUsers} usuários
                        </p>
                      </div>
                      <Badge variant={plan.isActive ? "default" : "secondary"}>
                        {plan.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Switch para ativar/desativar produto neste plano */}
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          Incluir "{product.name}" neste plano
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {config?.isActive 
                            ? 'Produto disponível para clínicas neste plano' 
                            : 'Produto não disponível neste plano'
                          }
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={config?.isActive || false}
                      onCheckedChange={(checked) => {
                        setPlanConfigs(prev => ({
                          ...prev,
                          [plan.id]: {
                            ...prev[plan.id],
                            isActive: checked
                          }
                        }))
                      }}
                    />
                  </div>

                  {/* Configuração específica do produto para este plano */}
                  {config?.isActive && (
                    <div className="space-y-3">
                      <Label htmlFor={`config-${plan.id}`}>
                        Configuração específica para {plan.name}
                      </Label>
                      <Textarea
                        id={`config-${plan.id}`}
                        value={config.config}
                        onChange={(e) => {
                          setPlanConfigs(prev => ({
                            ...prev,
                            [plan.id]: {
                              ...prev[plan.id],
                              config: e.target.value
                            }
                          }))
                        }}
                        placeholder='{"feature1": true, "limit": 100}'
                        rows={4}
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        Configurações específicas que serão aplicadas quando este produto for usado por clínicas no plano {plan.name}
                      </p>
                    </div>
                  )}

                  {/* Botão salvar */}
                  <div className="flex justify-end">
                    <Button
                      onClick={() => handleSavePlanProduct(plan.id)}
                      disabled={isSaving}
                      size="sm"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Salvar Configuração
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Status atual */}
                  {existingPlanProduct && (
                    <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <AlertCircle className="h-3 w-3" />
                        <span>
                          Última atualização: {new Date(existingPlanProduct.updatedAt).toLocaleString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </DashboardLayout>
  )
}