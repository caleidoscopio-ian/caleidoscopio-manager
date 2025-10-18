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
  Building2,
  Settings,
  AlertCircle,
  Users,
  Calendar
} from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { toast } from "sonner"

interface Tenant {
  id: string
  name: string
  slug: string
  status: string
  plan: {
    id: string
    name: string
    slug: string
  }
  maxUsers: number
  createdAt: string
}

interface TenantProduct {
  id: string
  tenantId: string
  productId: string
  tenant: Tenant
  config?: any
  isActive: boolean
  activatedAt: string
  lastAccessed?: string
  accessCount: number
  createdAt: string
  updatedAt: string
}

interface Product {
  id: string
  name: string
  slug: string
  description?: string
  tenantProducts: TenantProduct[]
}

export default function ProductTenantsPage() {
  const { user, loading, isAuthenticated, isSuperAdmin } = useAuth()
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string

  const [product, setProduct] = useState<Product | null>(null)
  const [availableTenants, setAvailableTenants] = useState<Tenant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [tenantConfigs, setTenantConfigs] = useState<Record<string, { config: string, isActive: boolean }>>({})

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
      
      // Buscar produto e tenants que podem ter acesso (baseado no plano)
      const [productResponse, tenantsResponse] = await Promise.all([
        fetch(`/api/products/${productId}/tenants`),
        fetch('/api/tenants') // Buscar todos os tenants para ver quais podem ter acesso
      ])

      if (!productResponse.ok || !tenantsResponse.ok) {
        throw new Error('Erro ao carregar dados')
      }

      const productData = await productResponse.json()
      const tenantsData = await tenantsResponse.json()

      // Filtrar apenas tenants cujo plano inclui este produto
      const eligibleTenants = tenantsData.tenants.filter((tenant: Tenant) => {
        // Aqui você pode adicionar lógica para verificar se o plano do tenant inclui este produto
        return tenant.status === 'ACTIVE'
      })

      setProduct({ id: productId, ...productData })
      setAvailableTenants(eligibleTenants)

      // Inicializar configurações dos tenants
      const configs: Record<string, { config: string, isActive: boolean }> = {}
      eligibleTenants.forEach((tenant: Tenant) => {
        const tenantProduct = productData.tenantProducts?.find((tp: TenantProduct) => tp.tenantId === tenant.id)
        configs[tenant.id] = {
          config: tenantProduct?.config ? JSON.stringify(tenantProduct.config, null, 2) : '{}',
          isActive: tenantProduct?.isActive ?? false
        }
      })
      setTenantConfigs(configs)

    } catch (error: any) {
      console.error('Erro ao carregar dados:', error)
      toast.error(error.message || 'Erro ao carregar dados')
      router.push('/products')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveTenantProduct = async (tenantId: string) => {
    try {
      setIsSaving(true)
      
      const config = tenantConfigs[tenantId]
      let parsedConfig
      
      try {
        parsedConfig = JSON.parse(config.config)
      } catch {
        toast.error('Configuração deve ser um JSON válido')
        return
      }

      const existingTenantProduct = product?.tenantProducts?.find(tp => tp.tenantId === tenantId)

      if (config.isActive) {
        // Ativar produto para o tenant
        const response = await fetch(`/api/products/${productId}/tenants`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenantId,
            config: parsedConfig
          })
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Erro ao ativar produto')
        }
      } else if (existingTenantProduct) {
        // Desativar produto para o tenant
        const response = await fetch(`/api/tenants/${tenantId}/products/${productId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            isActive: false
          })
        })

        if (!response.ok) {
          throw new Error('Erro ao desativar produto')
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
            <h2 className="text-3xl font-bold tracking-tight">Acesso por Clínica</h2>
            <p className="text-muted-foreground">
              Gerencie quais clínicas têm acesso ao "{product.name}"
            </p>
          </div>
        </div>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Controle de Acesso
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Ative ou desative o acesso ao produto para clínicas específicas e configure parâmetros individuais
            </p>
          </CardHeader>
        </Card>

        {/* Clínicas */}
        <div className="grid gap-6">
          {availableTenants.map((tenant) => {
            const config = tenantConfigs[tenant.id]
            const existingTenantProduct = product.tenantProducts?.find(tp => tp.tenantId === tenant.id)
            
            return (
              <Card key={tenant.id} className={`transition-all ${config?.isActive ? 'ring-2 ring-primary/20' : ''}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <CardTitle className="text-lg">{tenant.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {tenant.slug} • Plano: {tenant.plan.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-3 w-3" />
                          <span>Até {tenant.maxUsers} usuários</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>Desde {new Date(tenant.createdAt).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                      <Badge variant={tenant.status === 'ACTIVE' ? "default" : "secondary"}>
                        {tenant.status === 'ACTIVE' ? "Ativa" : "Inativa"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Switch para ativar/desativar produto para esta clínica */}
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          Permitir acesso ao "{product.name}"
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {config?.isActive 
                            ? 'Esta clínica pode acessar o produto' 
                            : 'Esta clínica não tem acesso ao produto'
                          }
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={config?.isActive || false}
                      onCheckedChange={(checked) => {
                        setTenantConfigs(prev => ({
                          ...prev,
                          [tenant.id]: {
                            ...prev[tenant.id],
                            isActive: checked
                          }
                        }))
                      }}
                      disabled={tenant.status !== 'ACTIVE'}
                    />
                  </div>

                  {/* Configuração específica do produto para esta clínica */}
                  {config?.isActive && (
                    <div className="space-y-3">
                      <Label htmlFor={`config-${tenant.id}`}>
                        Configuração específica para {tenant.name}
                      </Label>
                      <Textarea
                        id={`config-${tenant.id}`}
                        value={config.config}
                        onChange={(e) => {
                          setTenantConfigs(prev => ({
                            ...prev,
                            [tenant.id]: {
                              ...prev[tenant.id],
                              config: e.target.value
                            }
                          }))
                        }}
                        placeholder='{"feature1": true, "limit": 100}'
                        rows={4}
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        Configurações específicas que serão aplicadas quando esta clínica usar o produto
                      </p>
                    </div>
                  )}

                  {/* Estatísticas de uso */}
                  {existingTenantProduct && (
                    <div className="grid grid-cols-3 gap-4 p-3 bg-muted/50 rounded-lg">
                      <div className="text-center">
                        <p className="text-sm font-medium">{existingTenantProduct.accessCount}</p>
                        <p className="text-xs text-muted-foreground">Acessos</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium">
                          {existingTenantProduct.lastAccessed 
                            ? new Date(existingTenantProduct.lastAccessed).toLocaleDateString('pt-BR')
                            : 'Nunca'
                          }
                        </p>
                        <p className="text-xs text-muted-foreground">Último acesso</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium">
                          {new Date(existingTenantProduct.activatedAt).toLocaleDateString('pt-BR')}
                        </p>
                        <p className="text-xs text-muted-foreground">Ativado em</p>
                      </div>
                    </div>
                  )}

                  {/* Botão salvar */}
                  <div className="flex justify-end">
                    <Button
                      onClick={() => handleSaveTenantProduct(tenant.id)}
                      disabled={isSaving || tenant.status !== 'ACTIVE'}
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
                  {existingTenantProduct && (
                    <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <AlertCircle className="h-3 w-3" />
                        <span>
                          Última atualização: {new Date(existingTenantProduct.updatedAt).toLocaleString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {availableTenants.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma clínica encontrada</h3>
              <p className="text-muted-foreground text-center">
                Não há clínicas disponíveis para este produto
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}