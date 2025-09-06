"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
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
  LogOut,
  User,
  ExternalLink,
  Menu
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

export function MobileSidebar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { user, logout, isSuperAdmin, isAdmin } = useAuth()

  const filteredItems = sidebarItems.filter(item => {
    if (item.superAdminOnly && !isSuperAdmin) return false
    if (item.adminOnly && !isSuperAdmin && !isAdmin) return false
    return true
  })

  return (
    <>
      {/* Fixed mobile header */}
      <div className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b bg-background px-4 md:hidden">
        <div className="flex items-center space-x-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary">
            <div className="h-3 w-3 rounded-full bg-primary-foreground/80" />
          </div>
          <h2 className="text-sm font-semibold">Caleidoscópio</h2>
        </div>
        
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0">
            <div className="flex h-full flex-col">
              <SheetHeader className="border-b p-4">
                <SheetTitle className="flex items-center space-x-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
                    <div className="h-4 w-4 rounded-full bg-primary-foreground/80" />
                  </div>
                  <div>
                    <span className="text-lg font-semibold">Caleidoscópio</span>
                    <p className="text-xs text-muted-foreground">Manager</p>
                  </div>
                </SheetTitle>
              </SheetHeader>

              {/* User Info */}
              <div className="border-b p-4">
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
              </div>

              {/* Navigation */}
              <nav className="flex-1 space-y-1 p-2">
                {filteredItems.map((item) => {
                  const isActive = pathname === item.href
                  const Icon = item.icon

                  return (
                    <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
                      <Button
                        variant={isActive ? "secondary" : "ghost"}
                        className="w-full justify-start"
                        size="default"
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        <span>{item.title}</span>
                        {item.badge && (
                          <Badge variant="secondary" className="ml-auto text-xs">
                            {item.badge}
                          </Badge>
                        )}
                      </Button>
                    </Link>
                  )
                })}
              </nav>

              {/* Footer Actions */}
              <div className="border-t p-2 space-y-1">
                {/* Acesso ao Caleidoscópio Educacional */}
                {user?.tenant && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    size="default"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    <span>Caleidoscópio</span>
                  </Button>
                )}

                {/* Super Admin Panel */}
                {isSuperAdmin && pathname !== "/admin" && (
                  <Link href="/admin" onClick={() => setOpen(false)}>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      size="default"
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      <span>Admin</span>
                    </Button>
                  </Link>
                )}

                {/* Logout */}
                <Button
                  variant="ghost"
                  onClick={() => {
                    logout()
                    setOpen(false)
                  }}
                  className="w-full justify-start text-muted-foreground hover:text-foreground"
                  size="default"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}