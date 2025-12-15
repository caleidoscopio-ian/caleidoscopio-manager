"use client"

import { useAuth } from "@/lib/auth/hooks"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Trash2, 
  AlertTriangle,
  Settings,
  Users,
  Building2,
  Package
} from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { toast } from "sonner"

const ICON_OPTIONS = [
  { value: 'package', label: 'Package (Padrão)' },
  { value: 'activity', label: 'Activity' },
  { value: 'users', label: 'Users' },
  { value: 'shopping-cart', label: 'Shopping Cart' },
  { value: 'book-open', label: 'Book Open' },
  { value: 'heart-pulse', label: 'Heart Pulse' },
  { value: 'graduation-cap', label: 'Graduation Cap' },
  { value: 'store', label: 'Store' },
  { value: 'video', label: 'Video' },
  { value: 'calendar', label: 'Calendar' },
]

const COLOR_OPTIONS = [
  { value: '#3b82f6', label: 'Azul', bg: 'bg-blue-500' },
  { value: '#10b981', label: 'Verde', bg: 'bg-green-500' },
  { value: '#f59e0b', label: 'Amarelo', bg: 'bg-yellow-500' },
  { value: '#ef4444', label: 'Vermelho', bg: 'bg-red-500' },
  { value: '#8b5cf6', label: 'Roxo', bg: 'bg-purple-500' },
  { value: '#06b6d4', label: 'Ciano', bg: 'bg-cyan-500' },
  { value: '#f97316', label: 'Laranja', bg: 'bg-orange-500' },
  { value: '#84cc16', label: 'Lima', bg: 'bg-lime-500' },
]

interface Product {
  id: string
  name: string
  slug: string
  description?: string
  icon?: string
  color?: string
  baseUrl?: string
  isActive: boolean
  defaultConfig?: any
  createdAt: string
  updatedAt: string
  planProducts: Array<{
    id: string
    plan: {
      id: string
      name: string
      slug: string
    }
    config?: any
    isActive: boolean
  }>
  tenantProducts: Array<{
    id: string
    tenant: {
      id: string
      name: string
      slug: string
    }
    config?: any
    isActive: boolean
    activatedAt: string
  }>
}

interface FormData {
  name: string
  slug: string
  description: string
  icon: string
  color: string
  baseUrl: string
  defaultConfig: string
  isActive: boolean
}

export default function ProductEditPage() {
  const { user, loading, isAuthenticated, isSuperAdmin } = useAuth()
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string

  const [product, setProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    slug: '',
    description: '',
    icon: 'package',
    color: '#3b82f6',
    baseUrl: '',
    defaultConfig: '{}',
    isActive: true
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [errors, setErrors] = useState<Partial<FormData>>({})

  useEffect(() => {
    if (loading) return
    
    if (!isAuthenticated || !isSuperAdmin) {
      router.push('/dashboard')
      return
    }

    if (productId) {
      fetchProduct()
    }
  }, [loading, isAuthenticated, isSuperAdmin, router, productId])

  const fetchProduct = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/products/${productId}`)
      
      if (!response.ok) {
        throw new Error('Produto não encontrado')
      }

      const data = await response.json()
      const productData = data.product
      
      setProduct(productData)
      setFormData({
        name: productData.name,
        slug: productData.slug,
        description: productData.description || '',
        icon: productData.icon || 'package',
        color: productData.color || '#3b82f6',
        baseUrl: productData.baseUrl || '',
        defaultConfig: productData.defaultConfig ? JSON.stringify(productData.defaultConfig, null, 2) : '{}',
        isActive: productData.isActive
      })
    } catch (error: any) {
      console.error('Erro ao carregar produto:', error)
      toast.error(error.message || 'Erro ao carregar produto')
      router.push('/products')
    } finally {
      setIsLoading(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório'
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'Slug é obrigatório'
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'Slug deve conter apenas letras minúsculas, números e hífens'
    }

    if (formData.baseUrl && !formData.baseUrl.startsWith('http')) {
      newErrors.baseUrl = 'URL deve começar com http:// ou https://'
    }

    if (formData.defaultConfig) {
      try {
        JSON.parse(formData.defaultConfig)
      } catch {
        newErrors.defaultConfig = 'Configuração deve ser um JSON válido'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description.trim() || undefined,
        icon: formData.icon,
        color: formData.color,
        baseUrl: formData.baseUrl.trim() || undefined,
        defaultConfig: formData.defaultConfig ? JSON.parse(formData.defaultConfig) : undefined,
        isActive: formData.isActive
      }

      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao atualizar produto')
      }

      toast.success('Produto atualizado com sucesso!')
      await fetchProduct() // Recarregar dados
    } catch (error: any) {
      console.error('Erro ao atualizar produto:', error)
      toast.error(error.message || 'Erro ao atualizar produto')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao excluir produto')
      }

      toast.success('Produto excluído com sucesso!')
      router.push('/products')
    } catch (error: any) {
      console.error('Erro ao excluir produto:', error)
      toast.error(error.message || 'Erro ao excluir produto')
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
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
            onClick={() => router.push('/products')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Configurar Produto</h2>
            <p className="text-muted-foreground">
              Edite as configurações do produto "{product.name}"
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Formulário Principal */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Nome */}
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome do Produto *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Ex: E-commerce"
                        className={errors.name ? "border-red-500" : ""}
                      />
                      {errors.name && (
                        <p className="text-sm text-red-500">{errors.name}</p>
                      )}
                    </div>

                    {/* Slug */}
                    <div className="space-y-2">
                      <Label htmlFor="slug">Slug *</Label>
                      <Input
                        id="slug"
                        value={formData.slug}
                        onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                        placeholder="ecommerce"
                        className={errors.slug ? "border-red-500" : ""}
                      />
                      {errors.slug && (
                        <p className="text-sm text-red-500">{errors.slug}</p>
                      )}
                    </div>

                    {/* Ícone */}
                    <div className="space-y-2">
                      <Label htmlFor="icon">Ícone</Label>
                      <Select
                        value={formData.icon}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, icon: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ICON_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Cor */}
                    <div className="space-y-2">
                      <Label htmlFor="color">Cor do Tema</Label>
                      <Select
                        value={formData.color}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, color: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {COLOR_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center gap-2">
                                <div className={`w-4 h-4 rounded-full ${option.bg}`} />
                                {option.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Descrição */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descreva o produto e suas funcionalidades..."
                      rows={3}
                    />
                  </div>

                  {/* URL Base */}
                  <div className="space-y-2">
                    <Label htmlFor="baseUrl">URL Base (opcional)</Label>
                    <Input
                      id="baseUrl"
                      value={formData.baseUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, baseUrl: e.target.value }))}
                      placeholder="https://ecommerce.example.com"
                      className={errors.baseUrl ? "border-red-500" : ""}
                    />
                    {errors.baseUrl && (
                      <p className="text-sm text-red-500">{errors.baseUrl}</p>
                    )}
                  </div>

                  {/* Configuração Padrão */}
                  <div className="space-y-2">
                    <Label htmlFor="defaultConfig">Configuração Padrão (JSON)</Label>
                    <Textarea
                      id="defaultConfig"
                      value={formData.defaultConfig}
                      onChange={(e) => setFormData(prev => ({ ...prev, defaultConfig: e.target.value }))}
                      placeholder='{"feature1": true, "limit": 100}'
                      rows={6}
                      className={errors.defaultConfig ? "border-red-500" : ""}
                    />
                    {errors.defaultConfig && (
                      <p className="text-sm text-red-500">{errors.defaultConfig}</p>
                    )}
                  </div>

                  {/* Status Ativo */}
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                    />
                    <Label htmlFor="isActive">Produto ativo</Label>
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex justify-between">
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Excluir Produto
                    </Button>

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push('/products')}
                        disabled={isSubmitting}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Salvar Alterações
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar de Informações */}
          <div className="space-y-6">
            {/* Status do Produto */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Estado:</span>
                  <Badge variant={product.isActive ? "default" : "secondary"}>
                    {product.isActive ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Criado em:</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(product.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Atualizado em:</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(product.updatedAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Estatísticas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Uso do Produto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Planos:</span>
                  </div>
                  <span className="text-sm font-medium">
                    {product.planProducts.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Clínicas:</span>
                  </div>
                  <span className="text-sm font-medium">
                    {product.tenantProducts.length}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Gestão de Planos */}
            <Card>
              <CardHeader>
                <CardTitle>Configuração por Planos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Configure como este produto se comporta em cada plano de assinatura
                </div>
                
                <Button
                  onClick={() => router.push(`/products/${productId}/plans`)}
                  className="w-full gap-2"
                  variant="outline"
                >
                  <Settings className="h-4 w-4" />
                  Gerenciar Configurações
                </Button>
                
                {product.planProducts.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground">Atualmente em {product.planProducts.length} planos:</div>
                    {product.planProducts.map((planProduct) => (
                      <div key={planProduct.id} className="flex items-center justify-between p-2 border rounded text-xs">
                        <span>{planProduct.plan.name}</span>
                        <Badge variant={planProduct.isActive ? "default" : "secondary"} className="text-xs">
                          {planProduct.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Gestão de Clínicas */}
            <Card>
              <CardHeader>
                <CardTitle>Acesso por Clínica</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Gerencie quais clínicas têm acesso a este produto
                </div>
                
                <Button
                  onClick={() => router.push(`/products/${productId}/tenants`)}
                  className="w-full gap-2"
                  variant="outline"
                >
                  <Building2 className="h-4 w-4" />
                  Gerenciar Clínicas
                </Button>
                
                {product.tenantProducts.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground">
                      {product.tenantProducts.filter(tp => tp.isActive).length} clínicas ativas:
                    </div>
                    {product.tenantProducts.slice(0, 3).map((tenantProduct) => (
                      <div key={tenantProduct.id} className="flex items-center justify-between p-2 border rounded text-xs">
                        <span>{tenantProduct.tenant.name}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant={tenantProduct.isActive ? "default" : "secondary"} className="text-xs">
                            {tenantProduct.isActive ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {product.tenantProducts.length > 3 && (
                      <div className="text-xs text-muted-foreground text-center">
                        e mais {product.tenantProducts.length - 3} clínicas...
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Modal de Confirmação de Exclusão */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  Confirmar Exclusão
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Tem certeza que deseja excluir o produto "{product.name}"?
                </p>
                <p className="text-sm text-red-600 font-medium">
                  Esta ação não pode ser desfeita e removerá todas as associações com planos e clínicas.
                </p>
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Excluindo...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}