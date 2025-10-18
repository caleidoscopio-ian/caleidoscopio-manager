"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Package, Activity, Users, ShoppingCart, BookOpen, HeartPulse, GraduationCap, Store, Video, Calendar, Loader2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface ProductAccessCardProps {
  product: {
    id: string
    name: string
    slug: string
    description?: string
    icon?: string
    color?: string
    baseUrl?: string
    isActive: boolean
  }
  hasAccess: boolean
  config?: any
  onAccess?: (productSlug: string) => Promise<void>
}

export function ProductAccessCard({ product, hasAccess, config, onAccess }: ProductAccessCardProps) {
  const [isAccessing, setIsAccessing] = useState(false)

  const getIconComponent = (iconName?: string) => {
    const iconClass = "w-6 h-6"
    switch (iconName) {
      case 'package':
        return <Package className={iconClass} />
      case 'activity':
        return <Activity className={iconClass} />
      case 'users':
        return <Users className={iconClass} />
      case 'shopping-cart':
        return <ShoppingCart className={iconClass} />
      case 'book-open':
        return <BookOpen className={iconClass} />
      case 'heart-pulse':
        return <HeartPulse className={iconClass} />
      case 'graduation-cap':
        return <GraduationCap className={iconClass} />
      case 'store':
        return <Store className={iconClass} />
      case 'video':
        return <Video className={iconClass} />
      case 'calendar':
        return <Calendar className={iconClass} />
      default:
        return <Package className={iconClass} />
    }
  }

  const handleAccess = async () => {
    if (!onAccess) return

    setIsAccessing(true)
    try {
      await onAccess(product.slug)
    } catch (error) {
      console.error('Erro ao acessar produto:', error)
      toast.error('Erro ao acessar produto')
    } finally {
      setIsAccessing(false)
    }
  }

  return (
    <Card className={`transition-all duration-200 ${hasAccess ? 'hover:shadow-md' : 'opacity-60'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="p-3 rounded-lg"
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
                {product.description || `Acesso ao ${product.name}`}
              </p>
            </div>
          </div>
          <Badge variant={hasAccess ? "default" : "secondary"}>
            {hasAccess ? "Disponível" : "Não disponível"}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        {hasAccess ? (
          <div className="space-y-3">
            {config && Object.keys(config).length > 0 && (
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">Configurações:</span>
                <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto">
                  {JSON.stringify(config, null, 2)}
                </pre>
              </div>
            )}
            
            <Button
              onClick={handleAccess}
              disabled={isAccessing || !product.isActive}
              className="w-full gap-2"
            >
              {isAccessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4" />
                  Acessar {product.name}
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-2">
              Este produto não está disponível no seu plano atual
            </p>
            <Button variant="outline" disabled size="sm">
              Não disponível
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}