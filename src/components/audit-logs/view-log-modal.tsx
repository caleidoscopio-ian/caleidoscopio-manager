/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  Calendar,
  User,
  Building2,
  Globe,
  Settings,
  Activity,
  Shield,
  ShieldCheck,
  Crown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Copy,
  ExternalLink,
} from "lucide-react";
import { AuditLog } from "./columns";

interface ViewLogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  log: AuditLog | null;
}

export function ViewLogModal({ open, onOpenChange, log }: ViewLogModalProps) {
  if (!log) return null;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getActionConfig = (action: string) => {
    const configs: Record<
      string,
      {
        icon: any;
        color: string;
        label: string;
        description: string;
        severity: "info" | "warning" | "error" | "success";
      }
    > = {
      // Autenticação
      LOGIN_SUCCESS: {
        icon: CheckCircle,
        color: "text-green-600",
        label: "Login Realizado com Sucesso",
        description: "Usuário fez login no sistema",
        severity: "success",
      },
      LOGIN_FAILED: {
        icon: XCircle,
        color: "text-red-600",
        label: "Tentativa de Login Falhada",
        description: "Falha na autenticação do usuário",
        severity: "error",
      },
      LOGOUT: {
        icon: Activity,
        color: "text-blue-600",
        label: "Logout Realizado",
        description: "Usuário encerrou a sessão",
        severity: "info",
      },

      // Usuários
      CREATE_USER: {
        icon: User,
        color: "text-green-600",
        label: "Usuário Criado",
        description: "Novo usuário foi adicionado ao sistema",
        severity: "success",
      },
      UPDATE_USER: {
        icon: User,
        color: "text-blue-600",
        label: "Usuário Atualizado",
        description: "Informações do usuário foram modificadas",
        severity: "info",
      },
      DELETE_USER: {
        icon: User,
        color: "text-red-600",
        label: "Usuário Excluído",
        description: "Usuário foi removido do sistema",
        severity: "error",
      },

      // Tenants
      CREATE_TENANT: {
        icon: Building2,
        color: "text-green-600",
        label: "Clínica Criada",
        description: "Nova clínica foi cadastrada no sistema",
        severity: "success",
      },
      DELETE_TENANT: {
        icon: Building2,
        color: "text-red-600",
        label: "Clínica Excluída",
        description: "Clínica foi removida do sistema",
        severity: "error",
      },

      // Segurança
      SUSPICIOUS_ACTIVITY: {
        icon: AlertTriangle,
        color: "text-red-600",
        label: "Atividade Suspeita Detectada",
        description: "Comportamento anômalo foi identificado",
        severity: "error",
      },
      BRUTE_FORCE: {
        icon: AlertTriangle,
        color: "text-red-600",
        label: "Tentativa de Força Bruta",
        description: "Múltiplas tentativas de login detectadas",
        severity: "error",
      },
    };

    return (
      configs[action] || {
        icon: Activity,
        color: "text-gray-600",
        label: action.replace(/_/g, " "),
        description: "Ação realizada no sistema",
        severity: "info" as const,
      }
    );
  };

  const config = getActionConfig(log.action);
  const Icon = config.icon;

  const getSeverityBadge = (severity: string) => {
    const variants = {
      success: {
        variant: "default" as const,
        color: "bg-green-100 text-green-800",
      },
      info: {
        variant: "secondary" as const,
        color: "bg-blue-100 text-blue-800",
      },
      warning: {
        variant: "outline" as const,
        color: "bg-yellow-100 text-yellow-800",
      },
      error: {
        variant: "destructive" as const,
        color: "bg-red-100 text-red-800",
      },
    };
    return variants[severity as keyof typeof variants] || variants.info;
  };

  const severityConfig = getSeverityBadge(config.severity);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const renderUser = (user: any) => {
    if (!user) {
      return (
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <div className="font-medium">Sistema</div>
            <div className="text-sm">Ação automática do sistema</div>
          </div>
        </div>
      );
    }

    const initials = user.name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();

    const getRoleIcon = (role: string) => {
      switch (role) {
        case "SUPER_ADMIN":
          return Crown;
        case "ADMIN":
          return ShieldCheck;
        default:
          return Shield;
      }
    };

    const RoleIcon = getRoleIcon(user.role);

    return (
      <div className="flex items-center space-x-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="text-sm font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">{user.name}</span>
            <RoleIcon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-sm text-muted-foreground">{user.email}</div>
          <div className="text-xs text-muted-foreground capitalize">
            {user.role.replace("_", " ").toLowerCase()}
          </div>
        </div>
      </div>
    );
  };

  const renderDetails = (details: Record<string, any> | null) => {
    if (!details || Object.keys(details).length === 0) {
      return (
        <div className="text-muted-foreground italic text-sm">
          Nenhum detalhe adicional disponível
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {Object.entries(details).map(([key, value]) => (
          <div key={key} className="flex justify-between items-start">
            <div className="font-medium text-sm capitalize">
              {key
                .replace(/([A-Z])/g, " $1")
                .replace(/^./, (str) => str.toUpperCase())}
              :
            </div>
            <div className="text-sm text-right flex-1 ml-4">
              {typeof value === "object" ? (
                <pre className="text-xs bg-muted p-2 rounded font-mono overflow-x-auto">
                  {JSON.stringify(value, null, 2)}
                </pre>
              ) : (
                <span
                  className={
                    key === "ipAddress" || key === "userAgent"
                      ? "font-mono"
                      : ""
                  }
                >
                  {String(value)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detalhes do Log de Auditoria
          </DialogTitle>
          <DialogDescription>
            Informações completas sobre o evento registrado
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Cabeçalho do Evento */}
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Icon className={`h-6 w-6 ${config.color}`} />
                <div>
                  <h3 className="text-lg font-semibold">{config.label}</h3>
                  <p className="text-sm text-muted-foreground">
                    {config.description}
                  </p>
                </div>
              </div>
            </div>
            <Badge className={severityConfig.color}>
              {config.severity.toUpperCase()}
            </Badge>
          </div>

          <Separator />

          {/* Informações Básicas */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Informações Temporais
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data/Hora:</span>
                  <span className="font-mono">{formatDate(log.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID do Evento:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs">{log.id}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => copyToClipboard(log.id)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Classificação
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ação:</span>
                  <Badge variant="outline">{log.action}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Recurso:</span>
                  <span className="font-mono text-xs">
                    {log.resource || "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Usuário Responsável */}
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <User className="h-4 w-4" />
              Usuário Responsável
            </h4>
            {renderUser(log.user)}
          </div>

          <Separator />

          {/* Clínica/Contexto */}
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Contexto da Clínica
            </h4>
            {log.tenant ? (
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold">{log.tenant.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {log.tenant.slug} • Status: {log.tenant.status}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3 text-muted-foreground">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium">Ação Global</div>
                  <div className="text-sm">
                    Não está vinculada a uma clínica específica
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Detalhes Técnicos */}
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Detalhes Técnicos
            </h4>
            {renderDetails(log.details)}
          </div>

          {/* JSON Raw (para desenvolvedores) */}
          {log.details && Object.keys(log.details).length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Dados Brutos (JSON)
                </h4>
                <div className="relative">
                  <pre className="text-xs bg-muted p-4 rounded font-mono overflow-x-auto max-h-40">
                    {JSON.stringify(
                      {
                        id: log.id,
                        action: log.action,
                        resource: log.resource,
                        userId: log.userId,
                        tenantId: log.tenantId,
                        details: log.details,
                        createdAt: log.createdAt,
                      },
                      null,
                      2
                    )}
                  </pre>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() =>
                      copyToClipboard(JSON.stringify(log, null, 2))
                    }
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
