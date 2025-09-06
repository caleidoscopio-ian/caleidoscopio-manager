"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth/hooks"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Users, UserPlus, Shield, Building2, UserCheck } from "lucide-react"
import { CreateUserModal } from "@/components/users/create-user-modal"
import { EditUserModal } from "@/components/users/edit-user-modal"
import { DeleteUserModal } from "@/components/users/delete-user-modal"
import { ViewUserModal } from "@/components/users/view-user-modal"
import { createColumns, type User } from "@/components/users/columns"
import { useRouter } from "next/navigation"

interface UsersResponse {
  users: User[]
  total: number
}

interface Tenant {
  id: string
  name: string
  slug: string
}

export default function UsersPage() {
  const { isAuthenticated, isAdmin, isSuperAdmin, user, loading: authLoading } = useAuth()
  const router = useRouter()
  
  const [users, setUsers] = useState<User[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedTenant, setSelectedTenant] = useState<string>("all")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isAdmin)) {
      router.push("/dashboard")
      return
    }

    if (isAuthenticated && isAdmin) {
      fetchUsers()
      if (isSuperAdmin) {
        fetchTenants()
      }
    }
  }, [authLoading, isAuthenticated, isAdmin, isSuperAdmin, router, selectedTenant])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        includeInactive: 'true'
      })
      
      if (selectedTenant !== "all") {
        params.append('tenantId', selectedTenant)
      }

      const response = await fetch(`/api/users?${params}`)
      
      if (!response.ok) {
        throw new Error("Erro ao carregar usuários")
      }

      const data: UsersResponse = await response.json()
      setUsers(data.users)
    } catch (error) {
      console.error("Erro ao buscar usuários:", error)
      setError("Erro ao carregar usuários")
    } finally {
      setLoading(false)
    }
  }

  const fetchTenants = async () => {
    try {
      const response = await fetch("/api/clinics")
      if (response.ok) {
        const data = await response.json()
        setTenants(data.tenants || [])
      }
    } catch (error) {
      console.error("Erro ao buscar tenants:", error)
    }
  }

  const handleViewUser = (user: User) => {
    setSelectedUser(user)
    setShowViewModal(true)
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setShowEditModal(true)
  }

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user)
    setShowDeleteModal(true)
  }

  const columns = createColumns({
    onView: handleViewUser,
    onEdit: handleEditUser,
    onDelete: handleDeleteUser,
    currentUser: user,
  })

  if (authLoading || !isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const activeUsers = users.filter(u => u.isActive)
  const adminUsers = users.filter(u => ['SUPER_ADMIN', 'ADMIN'].includes(u.role))
  const regularUsers = users.filter(u => u.role === 'USER')
  const myTenantUsers = users.filter(u => u.tenantId === user?.tenantId)

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-6 p-8 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Usuários</h2>
            <p className="text-muted-foreground">
              {isSuperAdmin ? "Gerencie usuários de todo o sistema" : "Gerencie usuários da sua clínica"}
            </p>
          </div>
          <div className="flex gap-2">
            {isSuperAdmin && (
              <Select value={selectedTenant} onValueChange={setSelectedTenant}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por clínica" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as clínicas</SelectItem>
                  <SelectItem value="null">Usuários globais</SelectItem>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button className="gap-2" onClick={() => setShowCreateModal(true)}>
              <UserPlus className="h-4 w-4" />
              Novo Usuário
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Usuários
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-xs text-muted-foreground">
                {activeUsers.length} ativos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Usuários Ativos
              </CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {activeUsers.length}
              </div>
              <p className="text-xs text-muted-foreground">
                {((activeUsers.length / users.length) * 100 || 0).toFixed(0)}% do total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Administradores
              </CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {adminUsers.length}
              </div>
              <p className="text-xs text-muted-foreground">
                {regularUsers.length} usuários regulares
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {isSuperAdmin ? "Usuários com Tenant" : "Minha Clínica"}
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isSuperAdmin ? users.filter(u => u.tenantId).length : myTenantUsers.length}
              </div>
              <p className="text-xs text-muted-foreground">
                {isSuperAdmin ? 
                  `${users.filter(u => !u.tenantId).length} globais` : 
                  `Da sua clínica`
                }
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Users Data Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Usuários</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <p className="text-destructive mb-4">{error}</p>
                <Button onClick={fetchUsers} variant="outline">
                  Tentar Novamente
                </Button>
              </div>
            ) : (
              <div className="px-6 pb-6">
                <DataTable
                  columns={columns}
                  data={users}
                  searchKey="name"
                  searchPlaceholder="Buscar usuários..."
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modals */}
        <CreateUserModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          onSuccess={fetchUsers}
          tenants={tenants}
        />

        <ViewUserModal
          open={showViewModal}
          onOpenChange={setShowViewModal}
          user={selectedUser}
        />

        <EditUserModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          user={selectedUser}
          onSuccess={fetchUsers}
          tenants={tenants}
        />

        <DeleteUserModal
          open={showDeleteModal}
          onOpenChange={setShowDeleteModal}
          user={selectedUser}
          onSuccess={fetchUsers}
        />
      </div>
    </DashboardLayout>
  )
}