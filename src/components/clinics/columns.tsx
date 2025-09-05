"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  ArrowUpDown, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  Building2,
  Calendar,
  Users
} from "lucide-react"

interface Plan {
  id: string
  name: string
  maxUsers: number
  price: number | null
}

export interface Tenant {
  id: string
  name: string
  slug: string
  domain: string | null
  status: "ACTIVE" | "SUSPENDED" | "INACTIVE"
  maxUsers: number
  createdAt: string
  updatedAt: string
  plan: Plan
  stats: {
    totalUsers: number
    activeUsers: number
    adminCount: number
    userCount: number
    lastActivity: string | null
  }
}

interface ColumnsProps {
  onView: (tenant: Tenant) => void
  onEdit: (tenant: Tenant) => void
  onDelete: (tenant: Tenant) => void
}

export const createColumns = ({ onView, onEdit, onDelete }: ColumnsProps): ColumnDef<Tenant>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold"
        >
          Clínica
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const tenant = row.original
      return (
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="font-semibold">{tenant.name}</div>
            <div className="text-sm text-muted-foreground">
              {tenant.slug}
            </div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as Tenant['status']
      
      const variants = {
        ACTIVE: { variant: "default" as const, text: "Ativo" },
        SUSPENDED: { variant: "secondary" as const, text: "Suspenso" },
        INACTIVE: { variant: "destructive" as const, text: "Inativo" }
      }
      
      const config = variants[status]
      return <Badge variant={config.variant}>{config.text}</Badge>
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "plan",
    header: "Plano",
    cell: ({ row }) => {
      const plan = row.original.plan
      const formatPrice = (price: number | null) => {
        if (!price) return "Gratuito"
        return new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL"
        }).format(Number(price))
      }

      return (
        <div>
          <div className="font-medium">{plan.name}</div>
          <div className="text-sm text-muted-foreground">
            {formatPrice(plan.price)}
          </div>
        </div>
      )
    },
  },
  {
    id: "users",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold"
        >
          <Users className="mr-2 h-4 w-4" />
          Usuários
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const tenant = row.original
      const usagePercent = (tenant.stats.totalUsers / tenant.maxUsers) * 100

      return (
        <div className="space-y-1">
          <div className="font-medium">
            {tenant.stats.activeUsers}/{tenant.maxUsers}
          </div>
          <div className="w-16 bg-gray-200 rounded-full h-1.5">
            <div 
              className={`h-1.5 rounded-full ${
                usagePercent > 90 
                  ? 'bg-red-500' 
                  : usagePercent > 70 
                    ? 'bg-yellow-500' 
                    : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(usagePercent, 100)}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground">
            {tenant.stats.adminCount}A • {tenant.stats.userCount}U
          </div>
        </div>
      )
    },
    sortingFn: (rowA, rowB, columnId) => {
      return rowA.original.stats.totalUsers - rowB.original.stats.totalUsers
    },
  },
  {
    accessorKey: "domain",
    header: "Domínio",
    cell: ({ row }) => {
      const domain = row.getValue("domain") as string | null
      return (
        <div className="font-mono text-sm">
          {domain || (
            <span className="text-muted-foreground italic">Não configurado</span>
          )}
        </div>
      )
    },
  },
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
          Criada em
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"))
      return (
        <div className="text-sm">
          {date.toLocaleDateString("pt-BR")}
        </div>
      )
    },
    sortingFn: (rowA, rowB, columnId) => {
      const dateA = new Date(rowA.getValue(columnId))
      const dateB = new Date(rowB.getValue(columnId))
      return dateA.getTime() - dateB.getTime()
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const tenant = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView(tenant)}>
              <Eye className="mr-2 h-4 w-4" />
              Ver Detalhes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(tenant)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-destructive"
              onClick={() => onDelete(tenant)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]