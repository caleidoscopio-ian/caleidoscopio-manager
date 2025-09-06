"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
  Calendar,
  Building2,
  Shield,
  ShieldCheck,
  Crown
} from "lucide-react"

interface Tenant {
  id: string
  name: string
  slug: string
  status: string
}

export interface User {
  id: string
  email: string
  name: string
  role: "SUPER_ADMIN" | "ADMIN" | "USER"
  isActive: boolean
  lastLogin: string | null
  createdAt: string
  updatedAt: string
  tenant: Tenant | null
  tenantId: string | null
  stats: {
    activeSessions: number
  }
}

interface ColumnsProps {
  onView: (user: User) => void
  onEdit: (user: User) => void
  onDelete: (user: User) => void
  currentUser: any
}

export const createColumns = ({ onView, onEdit, onDelete, currentUser }: ColumnsProps): ColumnDef<User>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold"
        >
          Usuário
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const user = row.original
      const initials = user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()

      return (
        <div className="flex items-center space-x-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="text-xs font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-semibold flex items-center gap-2">
              {user.name}
              {currentUser?.id === user.id && (
                <Badge variant="outline" className="text-xs">
                  Você
                </Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {user.email}
            </div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "role",
    header: "Papel",
    cell: ({ row }) => {
      const role = row.getValue("role") as User['role']
      
      const roleConfig = {
        SUPER_ADMIN: { 
          variant: "default" as const, 
          text: "Super Admin", 
          icon: Crown,
          className: "bg-gradient-to-r from-yellow-500 to-orange-500 text-white"
        },
        ADMIN: { 
          variant: "secondary" as const, 
          text: "Admin", 
          icon: ShieldCheck,
          className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
        },
        USER: { 
          variant: "outline" as const, 
          text: "Usuário", 
          icon: Shield,
          className: ""
        }
      }
      
      const config = roleConfig[role]
      const Icon = config.icon
      
      return (
        <Badge variant={config.variant} className={`${config.className} flex items-center gap-1 w-fit`}>
          <Icon className="h-3 w-3" />
          {config.text}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "tenant",
    header: "Clínica",
    cell: ({ row }) => {
      const tenant = row.original.tenant
      
      if (!tenant) {
        return (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Crown className="h-4 w-4" />
            <span className="italic">Global</span>
          </div>
        )
      }

      const statusColors = {
        ACTIVE: "text-green-600",
        SUSPENDED: "text-yellow-600", 
        INACTIVE: "text-red-600"
      }

      return (
        <div className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="font-medium">{tenant.name}</div>
            <div className={`text-xs ${statusColors[tenant.status as keyof typeof statusColors] || 'text-muted-foreground'}`}>
              {tenant.slug}
            </div>
          </div>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      const tenant = row.original.tenant
      if (!tenant) return value.includes("global")
      return value.includes(tenant.name.toLowerCase()) || value.includes(tenant.slug.toLowerCase())
    },
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.getValue("isActive") as boolean
      const lastLogin = row.original.lastLogin
      
      return (
        <div className="space-y-1">
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Ativo" : "Inativo"}
          </Badge>
          {lastLogin && (
            <div className="text-xs text-muted-foreground">
              Último acesso: {new Date(lastLogin).toLocaleDateString("pt-BR")}
            </div>
          )}
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    id: "sessions",
    header: "Sessões",
    cell: ({ row }) => {
      const user = row.original
      const sessions = user.stats.activeSessions
      
      return (
        <div className="text-center">
          <div className={`font-medium ${sessions > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
            {sessions}
          </div>
          <div className="text-xs text-muted-foreground">
            {sessions === 1 ? 'sessão ativa' : 'sessões ativas'}
          </div>
        </div>
      )
    },
    sortingFn: (rowA, rowB, columnId) => {
      return rowA.original.stats.activeSessions - rowB.original.stats.activeSessions
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
          Criado em
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
      const user = row.original
      const isCurrentUser = currentUser?.id === user.id

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView(user)}>
              <Eye className="mr-2 h-4 w-4" />
              Ver Detalhes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(user)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            {!isCurrentUser && (
              <DropdownMenuItem 
                className="text-destructive"
                onClick={() => onDelete(user)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]