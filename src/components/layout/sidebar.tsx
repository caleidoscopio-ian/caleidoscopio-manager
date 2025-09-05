"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth/hooks"
import {
  Home,
  Building2,
  Users,
  CreditCard,
  FileText,
  Settings,
  Shield,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  ExternalLink
} from "lucide-react"

interface SidebarItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  adminOnly?: boolean
  superAdminOnly?: boolean
}

const sidebarItems: SidebarItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "Meu Perfil",
    href: "/profile",
    icon: User,
  },
  {
    title: "Clínicas",
    href: "/clinics",
    icon: Building2,
    adminOnly: true,
  },
  {
    title: "Usuários",
    href: "/users",
    icon: Users,
    adminOnly: true,
  },
  {
    title: "Planos & Assinaturas",
    href: "/plans",
    icon: CreditCard,
    superAdminOnly: true,
  },
  {
    title: "Relatórios",
    href: "/reports",
    icon: BarChart3,
    adminOnly: true,
  },
  {
    title: "Logs de Auditoria",
    href: "/audit-logs",
    icon: FileText,
    superAdminOnly: true,
  },
  {
    title: "Configurações",
    href: "/settings",
    icon: Settings,
    adminOnly: true,
  },
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const { user, logout, isSuperAdmin, isAdmin } = useAuth()

  const filteredItems = sidebarItems.filter(item => {
    if (item.superAdminOnly && !isSuperAdmin) return false
    if (item.adminOnly && !isSuperAdmin && !isAdmin) return false
    return true
  })

  const toggleCollapsed = () => setCollapsed(!collapsed)

  return (
    <div
      className={cn(
        "relative flex flex-col border-r bg-background transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center border-b px-4">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <div className="h-4 w-4 rounded-full bg-primary-foreground/80" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Caleidoscópio</h2>
              <p className="text-xs text-muted-foreground">Manager</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapsed}
          className={cn("ml-auto", collapsed && "mx-auto")}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* User Info */}
      <div className="border-b p-4">
        {!collapsed ? (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                <User className="h-4 w-4" />
              </div>
              <div className="flex-1 truncate">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-xs">
                {user?.role === "SUPER_ADMIN" && "Super Admin"}
                {user?.role === "ADMIN" && "Administrador"}
                {user?.role === "USER" && "Usuário"}
              </Badge>
              {user?.tenant && (
                <Badge variant="outline" className="text-xs">
                  {user.tenant.name}
                </Badge>
              )}
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
              <User className="h-4 w-4" />
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2">
        {filteredItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  collapsed && "justify-center px-2"
                )}
                size={collapsed ? "icon" : "default"}
              >
                <Icon className="h-4 w-4" />
                {!collapsed && (
                  <>
                    <span className="ml-2">{item.title}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </Button>
            </Link>
          )
        })}
      </nav>

      <Separator />

      {/* Footer Actions */}
      <div className="p-2 space-y-1">
        {/* Acesso ao Caleidoscópio Educacional */}
        {user?.tenant && (
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start",
              collapsed && "justify-center px-2"
            )}
            size={collapsed ? "icon" : "default"}
          >
            <ExternalLink className="h-4 w-4" />
            {!collapsed && (
              <span className="ml-2">Caleidoscópio</span>
            )}
          </Button>
        )}

        {/* Super Admin Panel */}
        {isSuperAdmin && pathname !== "/admin" && (
          <Link href="/admin">
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start",
                collapsed && "justify-center px-2"
              )}
              size={collapsed ? "icon" : "default"}
            >
              <Shield className="h-4 w-4" />
              {!collapsed && (
                <span className="ml-2">Admin</span>
              )}
            </Button>
          </Link>
        )}

        {/* Logout */}
        <Button
          variant="ghost"
          onClick={logout}
          className={cn(
            "w-full justify-start text-muted-foreground hover:text-foreground",
            collapsed && "justify-center px-2"
          )}
          size={collapsed ? "icon" : "default"}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && (
            <span className="ml-2">Sair</span>
          )}
        </Button>
      </div>
    </div>
  )
}