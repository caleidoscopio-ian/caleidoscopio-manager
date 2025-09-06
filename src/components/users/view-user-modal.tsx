"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { 
  User as UserIcon, 
  Mail, 
  Calendar, 
  Shield, 
  ShieldCheck,
  Crown,
  Building2,
  Activity,
  Clock,
  Globe
} from "lucide-react"
import { User } from "./columns"

interface ViewUserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
}

export function ViewUserModal({ open, onOpenChange, user }: ViewUserModalProps) {
  if (!user) return null

  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRoleConfig = (role: string) => {
    const configs = {
      SUPER_ADMIN: { 
        text: "Super Administrador", 
        icon: Crown,
        description: "Acesso total ao sistema, pode gerenciar todas as clínicas e usuários",
        color: "from-yellow-500 to-orange-500"
      },
      ADMIN: { 
        text: "Administrador", 
        icon: ShieldCheck,
        description: "Administra uma clínica específica e seus usuários",
        color: "from-blue-500 to-blue-600"
      },
      USER: { 
        text: "Usuário", 
        icon: Shield,
        description: "Usuário regular com acesso às funcionalidades básicas",
        color: "from-gray-500 to-gray-600"
      }
    }
    return configs[role as keyof typeof configs] || configs.USER
  }

  const roleConfig = getRoleConfig(user.role)
  const RoleIcon = roleConfig.icon

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            Detalhes do Usuário
          </DialogTitle>
          <DialogDescription>
            Informações completas sobre o usuário e suas permissões
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Avatar e Info Principal */}
          <div className="flex items-start space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-semibold">{user.name}</h3>
                <Badge variant={user.isActive ? "default" : "secondary"}>
                  {user.isActive ? "Ativo" : "Inativo"}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{user.email}</span>
              </div>

              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r ${roleConfig.color} text-white text-sm font-medium`}>
                <RoleIcon className="h-4 w-4" />
                {roleConfig.text}
              </div>
            </div>
          </div>

          <Separator />

          {/* Informações do Papel */}
          <div>
            <h4 className="text-sm font-medium mb-2">Permissões e Acesso</h4>
            <p className="text-sm text-muted-foreground mb-3">
              {roleConfig.description}
            </p>
          </div>

          <Separator />

          {/* Informações da Clínica */}
          <div>
            <h4 className="text-sm font-medium mb-3">Clínica</h4>
            {user.tenant ? (
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold">{user.tenant.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {user.tenant.slug} • Status: {user.tenant.status}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3 text-muted-foreground">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium">Usuário Global</div>
                  <div className="text-sm">
                    Não está vinculado a uma clínica específica
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Informações de Atividade */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="text-sm font-medium mb-3">Atividade</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>{user.stats.activeSessions}</strong> sessão(ões) ativa(s)
                  </span>
                </div>
                
                {user.lastLogin ? (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Último acesso: {formatDate(user.lastLogin)}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm italic text-muted-foreground">
                      Nunca fez login
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-3">Cadastro</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Criado em: {formatDate(user.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Atualizado: {formatDate(user.updatedAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ID do Usuário */}
          <div>
            <h4 className="text-sm font-medium mb-2">Identificador</h4>
            <div className="text-sm text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
              {user.id}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}