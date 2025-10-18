"use client"

import { useAuth } from "@/lib/auth/hooks"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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

interface FormData {
  name: string
  slug: string
  description: string
  icon: string
  color: string
  baseUrl: string
  defaultConfig: string
}

export default function NewProductPage() {
  const { user, loading, isAuthenticated, isSuperAdmin } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({
    name: '',
    slug: '',
    description: '',
    icon: 'package',
    color: '#3b82f6',
    baseUrl: '',
    defaultConfig: '{}'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Partial<FormData>>({})

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
  }, [loading, isAuthenticated, isSuperAdmin, router])

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, '-') // Substitui espaços por hífens
      .replace(/-+/g, '-') // Remove hífens duplicados
      .trim()
  }

  const handleNameChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      name: value,
      slug: prev.slug === generateSlug(prev.name) || prev.slug === '' ? generateSlug(value) : prev.slug
    }))
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
        defaultConfig: formData.defaultConfig ? JSON.parse(formData.defaultConfig) : undefined
      }

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao criar produto')
      }

      toast.success('Produto criado com sucesso!')
      router.push('/products')
    } catch (error: any) {
      console.error('Erro ao criar produto:', error)
      toast.error(error.message || 'Erro ao criar produto')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
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
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Novo Produto</h2>
            <p className="text-muted-foreground">
              Adicione um novo produto ao ecossistema Caleidoscópio
            </p>
          </div>
        </div>

        {/* Formulário */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Produto</CardTitle>
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
                    onChange={(e) => handleNameChange(e.target.value)}
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
                  <p className="text-xs text-muted-foreground">
                    Usado na URL: /products/{formData.slug || 'slug'}
                  </p>
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
                <p className="text-xs text-muted-foreground">
                  URL para redirecionamento via SSO. Se não informada, será usado o padrão interno.
                </p>
              </div>

              {/* Configuração Padrão */}
              <div className="space-y-2">
                <Label htmlFor="defaultConfig">Configuração Padrão (JSON)</Label>
                <Textarea
                  id="defaultConfig"
                  value={formData.defaultConfig}
                  onChange={(e) => setFormData(prev => ({ ...prev, defaultConfig: e.target.value }))}
                  placeholder='{"feature1": true, "limit": 100}'
                  rows={4}
                  className={errors.defaultConfig ? "border-red-500" : ""}
                />
                {errors.defaultConfig && (
                  <p className="text-sm text-red-500">{errors.defaultConfig}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Configurações padrão aplicadas quando o produto é ativado para uma clínica.
                </p>
              </div>

              {/* Botões */}
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Criar Produto
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}