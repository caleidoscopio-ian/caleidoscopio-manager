"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2 } from "lucide-react";

interface LoginFormProps {
  className?: string;
}

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  // Parâmetros SSO
  const redirectProduct = searchParams.get('redirect'); // ex: 'educational'
  const returnUrl = searchParams.get('returnUrl'); // URL de retorno

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    tenantSlug: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();

        // Se é um login SSO (vindo de sistema externo)
        if (redirectProduct && returnUrl) {
          try {
            // Verificar acesso ao produto
            const accessResponse = await fetch("/api/auth/validate-access", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                productSlug: redirectProduct,
                userEmail: formData.email
              })
            });

            const accessData = await accessResponse.json();

            if (!accessData.hasAccess) {
              setError(accessData.error || "Você não tem acesso a este produto");
              return;
            }

            // Gerar token SSO
            const ssoResponse = await fetch(`/api/products/sso/${redirectProduct}`, {
              method: "POST"
            });

            if (ssoResponse.ok) {
              const ssoData = await ssoResponse.json();
              const redirectUrlWithToken = `${returnUrl}?token=${ssoData.token}`;
              window.location.href = redirectUrlWithToken;
              return;
            }
          } catch (ssoError) {
            console.error("Erro no SSO:", ssoError);
            setError("Erro ao gerar acesso ao produto");
            return;
          }
        }

        // Login normal (sem SSO)
        if (data.user.role === "SUPER_ADMIN") {
          router.push("/admin");
        } else {
          router.push("/dashboard");
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Erro ao fazer login");
      }
    } catch (error) {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    };

  return (
    <div className={cn("flex flex-col gap-4 sm:gap-6", className)} {...props}>
      <Card className="overflow-hidden">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-4 sm:p-6 md:p-8" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-4 sm:gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-xl sm:text-2xl font-bold">Bem-vindo de volta</h1>
                <p className="text-balance text-muted-foreground text-sm sm:text-base">
                  Entre em sua conta Caleidoscópio
                </p>
              </div>

              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-center">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nome@exemplo.com"
                  value={formData.email}
                  onChange={handleChange("email")}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Senha</Label>
                  <a
                    href="#"
                    className="ml-auto text-sm underline-offset-2 hover:underline"
                  >
                    Esqueceu sua senha?
                  </a>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua senha"
                    value={formData.password}
                    onChange={handleChange("password")}
                    required
                    disabled={isLoading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="tenantSlug">Clínica (opcional)</Label>
                <Input
                  id="tenantSlug"
                  type="text"
                  placeholder="clinica-exemplo"
                  value={formData.tenantSlug}
                  onChange={handleChange("tenantSlug")}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Apenas necessário para usuários de clínicas específicas
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>

              <div className="text-center text-sm">
                Não tem conta?{" "}
                <a href="#" className="underline underline-offset-4">
                  Entre em contato
                </a>
              </div>
            </div>
          </form>

          <div className="relative hidden bg-muted md:block">
            <div className="absolute inset-0 bg-primary flex items-center justify-center">
              <div className="text-center text-white p-6 lg:p-8">
                <div className="mb-3 lg:mb-4 flex items-center justify-center">
                  <div className="mr-2 h-6 w-6 lg:h-8 lg:w-8 rounded-full bg-white/20 flex items-center justify-center">
                    <div className="h-3 w-3 lg:h-4 lg:w-4 rounded-full bg-white/40" />
                  </div>
                  <span className="text-lg lg:text-xl font-bold">Caleidoscópio</span>
                </div>
                <blockquote className="text-base lg:text-lg mb-2">
                  &quot;Transformando o atendimento terapêutico com tecnologia
                  especializada para TEA.&quot;
                </blockquote>
                <cite className="text-xs lg:text-sm opacity-80">Equipe Caleidoscópio</cite>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-balance text-center text-xs text-muted-foreground">
        Ao continuar, você concorda com nossos{" "}
        <a href="#" className="underline underline-offset-4 hover:text-primary">
          Termos de Serviço
        </a>{" "}
        e{" "}
        <a href="#" className="underline underline-offset-4 hover:text-primary">
          Política de Privacidade
        </a>
        .
      </div>
    </div>
  );
}
