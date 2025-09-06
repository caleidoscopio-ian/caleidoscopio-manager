"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth/hooks"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { Loader2, CreditCard, Plus, Building2, DollarSign, Users } from "lucide-react"
import { CreatePlanModal } from "@/components/plans/create-plan-modal"
import { EditPlanModal } from "@/components/plans/edit-plan-modal"
import { DeletePlanModal } from "@/components/plans/delete-plan-modal"
import { ViewPlanModal } from "@/components/plans/view-plan-modal"
import { createColumns, type Plan } from "@/components/plans/columns"
import { useRouter } from "next/navigation"

interface PlansResponse {
  plans: Plan[]
  total: number
}

export default function PlansPage() {
  const { isAuthenticated, isSuperAdmin, loading: authLoading } = useAuth()
  const router = useRouter()
  
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isSuperAdmin)) {
      router.push("/dashboard")
      return
    }

    if (isAuthenticated && isSuperAdmin) {
      fetchPlans()
    }
  }, [authLoading, isAuthenticated, isSuperAdmin, router])

  const fetchPlans = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/plans?includeInactive=true")
      
      if (!response.ok) {
        throw new Error("Erro ao carregar planos")
      }

      const data: PlansResponse = await response.json()
      setPlans(data.plans)
    } catch (error) {
      console.error("Erro ao buscar planos:", error)
      setError("Erro ao carregar planos")
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

  const handleViewPlan = (plan: Plan) => {
    setSelectedPlan(plan)
    setShowViewModal(true)
  }

  const handleEditPlan = (plan: Plan) => {
    setSelectedPlan(plan)
    setShowEditModal(true)
  }

  const handleDeletePlan = (plan: Plan) => {
    setSelectedPlan(plan)
    setShowDeleteModal(true)
  }

  const columns = createColumns({
    onView: handleViewPlan,
    onEdit: handleEditPlan,
    onDelete: handleDeletePlan,
  })

  if (authLoading || !isAuthenticated || !isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const activePlans = plans.filter(p => p.isActive)
  const totalRevenue = activePlans.reduce((acc, plan) => acc + (Number(plan.price) || 0), 0)
  const totalTenants = plans.reduce((acc, plan) => acc + plan.stats.totalTenants, 0)

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-6 p-8 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Planos & Assinaturas</h2>
            <p className="text-muted-foreground">
              Gerencie planos de assinatura e preços
            </p>
          </div>
          <Button className="gap-2" onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4" />
            Novo Plano
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Planos
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{plans.length}</div>
              <p className="text-xs text-muted-foreground">
                {activePlans.length} ativos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Planos Ativos
              </CardTitle>
              <CreditCard className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {activePlans.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Disponíveis para venda
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Clínicas Usando
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalTenants}
              </div>
              <p className="text-xs text-muted-foreground">
                Total de assinantes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Receita Potencial
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatPrice(totalRevenue)}
              </div>
              <p className="text-xs text-muted-foreground">
                Valor dos planos ativos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Plans Data Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Planos</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <p className="text-destructive mb-4">{error}</p>
                <Button onClick={fetchPlans} variant="outline">
                  Tentar Novamente
                </Button>
              </div>
            ) : (
              <div className="px-6 pb-6">
                <DataTable
                  columns={columns}
                  data={plans}
                  searchKey="name"
                  searchPlaceholder="Buscar planos..."
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modals */}
        <CreatePlanModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          onSuccess={fetchPlans}
        />

        <ViewPlanModal
          open={showViewModal}
          onOpenChange={setShowViewModal}
          plan={selectedPlan}
        />

        <EditPlanModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          plan={selectedPlan}
          onSuccess={fetchPlans}
        />

        <DeletePlanModal
          open={showDeleteModal}
          onOpenChange={setShowDeleteModal}
          plan={selectedPlan}
          onSuccess={fetchPlans}
        />
      </div>
    </DashboardLayout>
  )
}