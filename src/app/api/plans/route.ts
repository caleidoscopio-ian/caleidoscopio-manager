import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const plans = await prisma.plan.findMany({
      where: {
        isActive: true
      },
      include: {
        _count: {
          select: {
            tenants: true,
          }
        }
      },
      orderBy: {
        price: 'asc'
      }
    })

    const plansWithStats = plans.map(plan => ({
      ...plan,
      stats: {
        totalTenants: plan._count.tenants
      }
    }))

    return NextResponse.json({
      plans: plansWithStats,
      total: plans.length
    })
  } catch (error) {
    console.error('Erro ao buscar planos:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}