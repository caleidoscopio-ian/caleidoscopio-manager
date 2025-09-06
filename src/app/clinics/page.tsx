"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth/hooks"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { Loader2, Building2, Users, Plus, Crown } from "lucide-react"
import { CreateClinicModal } from "@/components/clinics/create-clinic-modal"
import { EditClinicModal } from "@/components/clinics/edit-clinic-modal"
import { DeleteClinicModal } from "@/components/clinics/delete-clinic-modal"
import { ViewClinicModal } from "@/components/clinics/view-clinic-modal"
import { createColumns, type Tenant } from "@/components/clinics/columns"
import { useRouter } from "next/navigation"

interface ClinicsResponse {
  tenants: Tenant[]
  total: number
}

export default function ClinicsPage() {
  const { isAuthenticated, isSuperAdmin, isAdmin, loading: authLoading } = useAuth()
  const router = useRouter()
  
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || (!isSuperAdmin && !isAdmin))) {
      router.push("/dashboard")
      return
    }

    if (isAuthenticated && (isSuperAdmin || isAdmin)) {
      fetchTenants()
    }
  }, [authLoading, isAuthenticated, isSuperAdmin, isAdmin, router])

  const fetchTenants = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/clinics")
      
      if (!response.ok) {
        throw new Error("Erro ao carregar clínicas")
      }

      const data: ClinicsResponse = await response.json()
      setTenants(data.tenants)
    } catch (error) {
      console.error("Erro ao buscar clínicas:", error)
      setError("Erro ao carregar clínicas")
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number | null) => {
    if (!price) return "Gratuito"
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(Number(price))
  }

  const handleViewTenant = (tenant: Tenant) => {
    setSelectedTenant(tenant)
    setShowViewModal(true)
  }

  const handleEditTenant = (tenant: Tenant) => {
    setSelectedTenant(tenant)
    setShowEditModal(true)
  }

  const handleDeleteTenant = (tenant: Tenant) => {
    setSelectedTenant(tenant)
    setShowDeleteModal(true)
  }

  const columns = createColumns({
    onView: handleViewTenant,
    onEdit: handleEditTenant,
    onDelete: handleDeleteTenant,
    isSuperAdmin, // Passar informação sobre permissões
  })

  if (authLoading || !isAuthenticated || (!isSuperAdmin && !isAdmin)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-6 p-8 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">
              {isSuperAdmin ? "Clínicas" : "Minha Clínica"}
            </h2>
            <p className="text-muted-foreground">
              {isSuperAdmin 
                ? "Gerencie todas as clínicas do sistema" 
                : "Visualize informações da sua clínica"
              }
            </p>
          </div>
          {isSuperAdmin && (
            <Button className="gap-2" onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4" />
              Nova Clínica
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        {isSuperAdmin ? (
          // Stats para Super Admin - visão geral do sistema
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total de Clínicas
                </CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tenants.length}</div>
                <p className="text-xs text-muted-foreground">
                  Todas as clínicas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Clínicas Ativas
                </CardTitle>
                <Building2 className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {tenants.filter(t => t.status === "ACTIVE").length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Em operação
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total de Usuários
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {tenants.reduce((acc, tenant) => acc + tenant.stats.totalUsers, 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Todos os usuários
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Receita Mensal
                </CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatPrice(
                    tenants
                      .filter(t => t.status === "ACTIVE")
                      .reduce((acc, tenant) => acc + (Number(tenant.plan.price) || 0), 0)
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Receita mensal
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Stats para Admin - visão da própria clínica
          tenants.length > 0 && (
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Status da Clínica
                  </CardTitle>
                  <Building2 className={`h-4 w-4 ${tenants[0].status === 'ACTIVE' ? 'text-green-600' : 'text-yellow-600'}`} />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${tenants[0].status === 'ACTIVE' ? 'text-green-600' : 'text-yellow-600'}`}>
                    {tenants[0].status === 'ACTIVE' ? 'Ativa' : tenants[0].status}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {tenants[0].name}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Usuários Ativos
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {tenants[0].stats.activeUsers}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    de {tenants[0].plan?.maxUsers || '∞'} possíveis
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Plano Atual
                  </CardTitle>
                  <Crown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {tenants[0].plan?.name || 'N/A'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    R$ {tenants[0].plan?.price || '0'}/mês
                  </p>
                </CardContent>
              </Card>
            </div>
          )
        )}

        {/* Clinics Data Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              {isSuperAdmin ? "Lista de Clínicas" : "Informações da Clínica"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <p className="text-destructive mb-4">{error}</p>
                <Button onClick={fetchTenants} variant="outline">
                  Tentar Novamente
                </Button>
              </div>
            ) : (
              <div className="px-6 pb-6">
                <DataTable
                  columns={columns}
                  data={tenants}
                  searchKey="name"
                  searchPlaceholder="Buscar clínicas..."
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modals */}
        {isSuperAdmin && (
          <>
            <CreateClinicModal
              open={showCreateModal}
              onOpenChange={setShowCreateModal}
              onSuccess={fetchTenants}
            />
            <EditClinicModal
              open={showEditModal}
              onOpenChange={setShowEditModal}
              tenant={selectedTenant}
              onSuccess={fetchTenants}
            />
            <DeleteClinicModal
              open={showDeleteModal}
              onOpenChange={setShowDeleteModal}
              tenant={selectedTenant}
              onSuccess={fetchTenants}
            />
          </>
        )}
        
        {/* Modal de visualização - disponível para todos */}
        <ViewClinicModal
          open={showViewModal}
          onOpenChange={setShowViewModal}
          tenant={selectedTenant}
        />
      </div>
    </DashboardLayout>
  )
}