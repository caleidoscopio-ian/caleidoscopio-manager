"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, CreditCard, Package, Plus } from "lucide-react";

interface CreatePlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  isActive: boolean;
}

export function CreatePlanModal({
  open,
  onOpenChange,
  onSuccess,
}: CreatePlanModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    maxUsers: "",
    price: "",
    isActive: true,
    products: [] as string[],
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    if (field === "name" && typeof value === "string") {
      // Auto-generate slug from name
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();

      setFormData((prev) => ({ ...prev, [field]: value, slug }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  useEffect(() => {
    if (open) {
      fetchProducts();
    }
  }, [open]);

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Erro ao carregar produtos");

      const data = await response.json();
      setProducts(data.products.filter((p: Product) => p.isActive));
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleProductToggle = (productId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      products: checked
        ? [...prev.products, productId]
        : prev.products.filter((p) => p !== productId),
    }));
  };

  const formatPrice = (price: string) => {
    if (!price) return "Gratuito";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(price));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

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
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao criar plano");
      }

      // Reset form
      setFormData({
        name: "",
        slug: "",
        description: "",
        maxUsers: "",
        price: "",
        isActive: true,
        products: [],
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Erro ao criar plano:", error);
      setError(error instanceof Error ? error.message : "Erro ao criar plano");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Criar Novo Plano
          </DialogTitle>
          <DialogDescription>
            Crie um novo plano de assinatura com funcionalidades e preços
            personalizados.
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
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
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
                  onChange={(e) =>
                    handleInputChange("maxUsers", e.target.value)
                  }
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
                  Deixe vazio para plano gratuito. Valor:{" "}
                  {formatPrice(formData.price)}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  handleInputChange("isActive", checked)
                }
              />
              <Label htmlFor="isActive">Plano ativo</Label>
              <p className="text-xs text-muted-foreground">
                Planos inativos não ficam disponíveis para novos cadastros
              </p>
            </div>
          </div>

          {/* Produtos Incluídos */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Produtos do Ecossistema</h3>
            <p className="text-xs text-muted-foreground">
              Selecione quais produtos estarão disponíveis neste plano
            </p>

            {loadingProducts ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">
                  Carregando produtos...
                </span>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-1">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center space-x-3 p-3 border rounded-lg"
                  >
                    <Checkbox
                      id={product.id}
                      checked={formData.products.includes(product.id)}
                      onCheckedChange={(checked) =>
                        handleProductToggle(product.id, !!checked)
                      }
                    />
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className="p-2 rounded-lg"
                        style={{
                          backgroundColor: product.color
                            ? `${product.color}20`
                            : "#f1f5f9",
                          color: product.color || "#64748b",
                        }}
                      >
                        <Package className="h-4 w-4" />
                      </div>
                      <div>
                        <Label
                          htmlFor={product.id}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {product.name}
                        </Label>
                        {product.description && (
                          <p className="text-xs text-muted-foreground">
                            {product.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loadingProducts && (
              <p className="text-xs text-muted-foreground">
                Produtos selecionados: {formData.products.length}
              </p>
            )}
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
  );
}
