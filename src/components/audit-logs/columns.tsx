/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowUpDown,
  MoreHorizontal,
  Eye,
  Calendar,
  Shield,
  ShieldCheck,
  Crown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  User,
  Building2,
  Globe,
  Zap,
  Settings,
} from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  tenant?: {
    id: string;
    name: string;
    slug: string;
  };
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: string;
}

export interface AuditLog {
  id: string;
  action: string;
  resource: string | null;
  details: Record<string, any> | null;
  createdAt: string;
  userId: string | null;
  tenantId: string | null;
  user: User | null;
  tenant: Tenant | null;
}

interface ColumnsProps {
  onView: (log: AuditLog) => void;
}

export const createColumns = ({
  onView,
}: ColumnsProps): ColumnDef<AuditLog>[] => [
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold"
        >
          <Calendar className="mr-2 h-4 w-4" />
          Data/Hora
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"));
      return (
        <div className="space-y-1">
          <div className="font-medium text-sm">
            {date.toLocaleDateString("pt-BR")}
          </div>
          <div className="text-xs text-muted-foreground">
            {date.toLocaleTimeString("pt-BR")}
          </div>
        </div>
      );
    },
    sortingFn: (rowA, rowB, columnId) => {
      const dateA = new Date(rowA.getValue(columnId));
      const dateB = new Date(rowB.getValue(columnId));
      return dateB.getTime() - dateA.getTime(); // Mais recente primeiro
    },
  },
  {
    accessorKey: "action",
    header: "Ação",
    cell: ({ row }) => {
      const action = row.getValue("action") as string;

      const getActionConfig = (action: string) => {
        const configs: Record<
          string,
          { icon: any; color: string; label: string; category: string }
        > = {
          // Autenticação
          LOGIN_SUCCESS: {
            icon: CheckCircle,
            color: "text-green-600",
            label: "Login Realizado",
            category: "auth",
          },
          LOGIN_FAILED: {
            icon: XCircle,
            color: "text-red-600",
            label: "Falha no Login",
            category: "auth",
          },
          LOGOUT: {
            icon: Activity,
            color: "text-blue-600",
            label: "Logout",
            category: "auth",
          },

          // Usuários
          CREATE_USER: {
            icon: User,
            color: "text-green-600",
            label: "Usuário Criado",
            category: "user",
          },
          UPDATE_USER: {
            icon: User,
            color: "text-blue-600",
            label: "Usuário Atualizado",
            category: "user",
          },
          DELETE_USER: {
            icon: User,
            color: "text-red-600",
            label: "Usuário Excluído",
            category: "user",
          },
          CHANGE_PASSWORD: {
            icon: Shield,
            color: "text-yellow-600",
            label: "Senha Alterada",
            category: "user",
          },

          // Tenants
          CREATE_TENANT: {
            icon: Building2,
            color: "text-green-600",
            label: "Clínica Criada",
            category: "tenant",
          },
          UPDATE_TENANT: {
            icon: Building2,
            color: "text-blue-600",
            label: "Clínica Atualizada",
            category: "tenant",
          },
          DELETE_TENANT: {
            icon: Building2,
            color: "text-red-600",
            label: "Clínica Excluída",
            category: "tenant",
          },
          SUSPEND_TENANT: {
            icon: Building2,
            color: "text-yellow-600",
            label: "Clínica Suspensa",
            category: "tenant",
          },

          // Planos
          CREATE_PLAN: {
            icon: Crown,
            color: "text-green-600",
            label: "Plano Criado",
            category: "plan",
          },
          UPDATE_PLAN: {
            icon: Crown,
            color: "text-blue-600",
            label: "Plano Atualizado",
            category: "plan",
          },
          DELETE_PLAN: {
            icon: Crown,
            color: "text-red-600",
            label: "Plano Excluído",
            category: "plan",
          },

          // Segurança
          SUSPICIOUS_ACTIVITY: {
            icon: AlertTriangle,
            color: "text-red-600",
            label: "Atividade Suspeita",
            category: "security",
          },
          BRUTE_FORCE: {
            icon: AlertTriangle,
            color: "text-red-600",
            label: "Força Bruta",
            category: "security",
          },
          PERMISSION_DENIED: {
            icon: Shield,
            color: "text-yellow-600",
            label: "Permissão Negada",
            category: "security",
          },

          // Sistema
          CONFIG_CHANGE: {
            icon: Settings,
            color: "text-blue-600",
            label: "Configuração Alterada",
            category: "system",
          },
          BACKUP_CREATED: {
            icon: CheckCircle,
            color: "text-green-600",
            label: "Backup Criado",
            category: "system",
          },
          SYSTEM_ERROR: {
            icon: XCircle,
            color: "text-red-600",
            label: "Erro do Sistema",
            category: "system",
          },
          MAINTENANCE: {
            icon: Settings,
            color: "text-yellow-600",
            label: "Manutenção",
            category: "system",
          },
        };

        return (
          configs[action] || {
            icon: Activity,
            color: "text-gray-600",
            label: action.replace(/_/g, " "),
            category: "other",
          }
        );
      };

      const config = getActionConfig(action);
      const Icon = config.icon;

      const getCategoryColor = (category: string) => {
        const colors = {
          auth: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
          user: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
          tenant:
            "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
          plan: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
          security: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
          system:
            "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
          other:
            "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
        };
        return colors[category as keyof typeof colors] || colors.other;
      };

      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Icon className={`h-4 w-4 ${config.color}`} />
            <span className="font-medium text-sm">{config.label}</span>
          </div>
          <Badge
            variant="outline"
            className={`text-xs ${getCategoryColor(config.category)}`}
          >
            {config.category.toUpperCase()}
          </Badge>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "user",
    header: "Usuário",
    cell: ({ row }) => {
      const user = row.original.user;

      if (!user) {
        return (
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
              <Settings className="h-4 w-4" />
            </div>
            <span className="italic text-sm">Sistema</span>
          </div>
        );
      }

      const initials = user.name
        .split(" ")
        .map((n) => n[0])
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
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-1">
              <span className="font-medium text-sm">{user.name}</span>
              <RoleIcon className="h-3 w-3 text-muted-foreground" />
            </div>
            <div className="text-xs text-muted-foreground">{user.email}</div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "resource",
    header: "Recurso",
    cell: ({ row }) => {
      const resource = row.original.resource;
      const details = row.original.details;

      if (!resource) {
        return (
          <span className="text-muted-foreground italic text-sm">N/A</span>
        );
      }

      // Extrair tipo e ID do recurso (ex: "user:123" -> tipo: "user", id: "123")
      const [type, id] = resource.split(":");

      const getResourceIcon = (type: string) => {
        switch (type?.toLowerCase()) {
          case "user":
            return User;
          case "tenant":
            return Building2;
          case "plan":
            return Crown;
          case "system":
            return Settings;
          default:
            return Activity;
        }
      };

      const Icon = getResourceIcon(type);

      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="font-mono text-sm">{resource}</span>
          </div>
          {details?.targetName && (
            <div className="text-xs text-muted-foreground">
              {details.targetName}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "tenant",
    header: "Clínica",
    cell: ({ row }) => {
      const tenant = row.original.tenant;

      if (!tenant) {
        return (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Globe className="h-4 w-4" />
            <span className="italic text-sm">Global</span>
          </div>
        );
      }

      const statusColors = {
        ACTIVE: "text-green-600",
        SUSPENDED: "text-yellow-600",
        INACTIVE: "text-red-600",
      };

      return (
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10">
              <Building2 className="h-3 w-3 text-primary" />
            </div>
            <span className="font-medium text-sm">{tenant.name}</span>
          </div>
          <div
            className={`text-xs ${statusColors[tenant.status as keyof typeof statusColors] || "text-muted-foreground"}`}
          >
            {tenant.slug}
          </div>
        </div>
      );
    },
  },
  {
    id: "details",
    header: "Detalhes",
    cell: ({ row }) => {
      const details = row.original.details;
      const action = row.original.action;

      if (!details) {
        return (
          <span className="text-muted-foreground italic text-sm">
            Sem detalhes
          </span>
        );
      }

      // Mostrar informações relevantes baseadas no tipo de ação
      const getRelevantDetails = (action: string, details: any) => {
        switch (action) {
          case "LOGIN_FAILED":
            return `IP: ${details.ipAddress || "N/A"}`;
          case "LOGIN_SUCCESS":
            return `IP: ${details.ipAddress || "N/A"}`;
          case "CREATE_USER":
          case "UPDATE_USER":
            return `Role: ${details.role || "N/A"}`;
          case "SUSPICIOUS_ACTIVITY":
          case "BRUTE_FORCE":
            return `Severity: ${details.severity || "MEDIUM"}`;
          default:
            return Object.keys(details).length > 0
              ? `${Object.keys(details).length} propriedades`
              : "Sem detalhes";
        }
      };

      const relevantInfo = getRelevantDetails(action, details);

      return (
        <div className="space-y-1">
          <div className="text-sm">{relevantInfo}</div>
          {details.ipAddress && (
            <div className="text-xs text-muted-foreground font-mono">
              {details.ipAddress}
            </div>
          )}
        </div>
      );
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const log = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView(log)}>
              <Eye className="mr-2 h-4 w-4" />
              Ver Detalhes
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
