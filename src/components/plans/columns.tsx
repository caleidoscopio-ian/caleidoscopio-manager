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
  CreditCard,
  DollarSign,
  Users,
  Building2
} from "lucide-react"

export interface Plan {
  id: string
  name: string
  slug: string
  description: string | null
  maxUsers: number
  features: string[]
  price: number | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  stats: {
    totalTenants: number
  }
}

interface ColumnsProps {
  onView: (plan: Plan) => void
  onEdit: (plan: Plan) => void
  onDelete: (plan: Plan) => void
}

export const createColumns = ({ onView, onEdit, onDelete }: ColumnsProps): ColumnDef<Plan>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold"
        >
          Plano
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const plan = row.original
      return (
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <CreditCard className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="font-semibold">{plan.name}</div>
            <div className="text-sm text-muted-foreground">
              {plan.slug}
            </div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "price",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold"
        >
          <DollarSign className="mr-2 h-4 w-4" />
          Preço
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const price = row.getValue("price") as number | null
      const formatPrice = (price: number | null) => {
        if (!price) return "Gratuito"
        return new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL"
        }).format(Number(price))
      }

      return (
        <div className="font-medium">
          {formatPrice(price)}
          <div className="text-xs text-muted-foreground">
            /mês
          </div>
        </div>
      )
    },
    sortingFn: (rowA, rowB, columnId) => {
      const priceA = rowA.getValue(columnId) as number | null
      const priceB = rowB.getValue(columnId) as number | null
      return (priceA || 0) - (priceB || 0)
    },
  },
  {
    accessorKey: "maxUsers",
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
      const maxUsers = row.getValue("maxUsers") as number
      return (
        <div className="font-medium">
          {maxUsers}
          <div className="text-xs text-muted-foreground">
            máximo
          </div>
        </div>
      )
    },
  },
  {
    id: "tenants",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-semibold"
        >
          <Building2 className="mr-2 h-4 w-4" />
          Clínicas
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const plan = row.original
      return (
        <div className="text-center">
          <div className="font-medium">
            {plan.stats.totalTenants}
          </div>
          <div className="text-xs text-muted-foreground">
            usando este plano
          </div>
        </div>
      )
    },
    sortingFn: (rowA, rowB, columnId) => {
      return rowA.original.stats.totalTenants - rowB.original.stats.totalTenants
    },
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.getValue("isActive") as boolean
      
      return (
        <Badge variant={isActive ? "default" : "secondary"}>
          {isActive ? "Ativo" : "Inativo"}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "features",
    header: "Funcionalidades",
    cell: ({ row }) => {
      const features = row.getValue("features") as string[]
      
      return (
        <div className="max-w-[200px]">
          <div className="text-sm font-medium">
            {features.length} funcionalidades
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {features.slice(0, 2).join(", ")}
            {features.length > 2 && `, +${features.length - 2}`}
          </div>
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
      const plan = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView(plan)}>
              <Eye className="mr-2 h-4 w-4" />
              Ver Detalhes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(plan)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-destructive"
              onClick={() => onDelete(plan)}
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