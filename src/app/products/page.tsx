"use client"

import { useAuth } from "@/lib/auth/hooks"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Package, 
  Plus, 
  Settings, 
  ExternalLink, 
  Users, 
  Activity,
  Loader2,
  AlertCircle
} from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface Product {
  id: string
  name: string
  slug: string
  description?: string
  icon?: string
  color?: string
  baseUrl?: string
  isActive: boolean
  _count: {
    tenantProducts: number
    planProducts: number
  }
}

export default function ProductsPage() {
  const { user, loading, isAuthenticated, isSuperAdmin } = useAuth()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (loading) return
    
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    if (!isSuperAdmin) {
      router.push('/dashboard')
      return
    }

    fetchProducts()
  }, [loading, isAuthenticated, isSuperAdmin, router])

  const fetchProducts = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/products')
      
      if (!response.ok) {
        throw new Error('Erro ao carregar produtos')
      }

      const data = await response.json()
      setProducts(data.products)
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
      setError('Erro ao carregar produtos')
      toast.error('Erro ao carregar produtos')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAccessProduct = async (productSlug: string) => {
    try {
      const response = await fetch(`/api/products/sso/${productSlug}`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Erro ao gerar acesso')
      }

      const data = await response.json()
      
      if (data.redirectUrl) {
        window.open(data.redirectUrl, '_blank')
      } else {
        toast.error('URL de redirecionamento não encontrada')
      }
    } catch (error) {
      console.error('Erro ao acessar produto:', error)
      toast.error('Erro ao acessar produto')
    }
  }

  const getIconComponent = (iconName?: string) => {
    switch (iconName) {
      case 'package':
        return <Package className="w-6 h-6" />
      case 'activity':
        return <Activity className="w-6 h-6" />
      case 'users':
        return <Users className="w-6 h-6" />
      default:
        return <Package className="w-6 h-6" />
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

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={fetchProducts} variant="outline">
              Tentar novamente
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
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Produtos do Ecossistema</h2>
            <p className="text-muted-foreground">
              Gerencie os produtos disponíveis no ecossistema Caleidoscópio
            </p>
          </div>
          <Button 
            onClick={() => router.push('/products/new')}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Novo Produto
          </Button>
        </div>

        {/* Estatísticas */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Produtos
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products.length}</div>
              <p className="text-xs text-muted-foreground">
                {products.filter(p => p.isActive).length} ativos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Clínicas Conectadas
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {products.reduce((acc, p) => acc + p._count.tenantProducts, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Conexões ativas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Integrações em Planos
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {products.reduce((acc, p) => acc + p._count.planProducts, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Produtos por planos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Produtos */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Card key={product.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="p-2 rounded-lg"
                      style={{ 
                        backgroundColor: product.color ? `${product.color}20` : '#f1f5f9',
                        color: product.color || '#64748b'
                      }}
                    >
                      {getIconComponent(product.icon)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        /{product.slug}
                      </p>
                    </div>
                  </div>
                  <Badge variant={product.isActive ? "default" : "secondary"}>
                    {product.isActive ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {product.description && (
                  <p className="text-sm text-muted-foreground">
                    {product.description}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Clínicas:</span>
                    <br />
                    <span className="text-muted-foreground">
                      {product._count.tenantProducts}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Planos:</span>
                    <br />
                    <span className="text-muted-foreground">
                      {product._count.planProducts}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() => router.push(`/products/${product.id}`)}
                  >
                    <Settings className="w-4 h-4" />
                    Configurar
                  </Button>
                  
                  {product.isActive && product.baseUrl && (
                    <Button
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => handleAccessProduct(product.slug)}
                    >
                      <ExternalLink className="w-4 h-4" />
                      Acessar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {products.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum produto encontrado</h3>
              <p className="text-muted-foreground text-center mb-4">
                Comece criando seu primeiro produto do ecossistema
              </p>
              <Button onClick={() => router.push('/products/new')}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Produto
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}