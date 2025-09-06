/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth/server";

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação e se é super admin
    const auth = await verifyAuth(request);
    if (!auth || auth.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "7");

    // Data de início baseada nos dias solicitados
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Data de hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Data de ontem
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Super admin vê todos os logs - sem filtro de tenant
    const baseWhere: any = {};

    // Total de logs no período
    const totalLogs = await prisma.auditLog.count({
      where: {
        ...baseWhere,
        createdAt: {
          gte: startDate,
        },
      },
    });

    // Logs de hoje
    const logsToday = await prisma.auditLog.count({
      where: {
        ...baseWhere,
        createdAt: {
          gte: today,
        },
      },
    });

    // Logs de ontem
    const logsYesterday = await prisma.auditLog.count({
      where: {
        ...baseWhere,
        createdAt: {
          gte: yesterday,
          lt: today,
        },
      },
    });

    // Top ações mais frequentes
    const topActions = await prisma.auditLog.groupBy({
      by: ["action"],
      where: {
        ...baseWhere,
        createdAt: {
          gte: startDate,
        },
      },
      _count: {
        action: true,
      },
      orderBy: {
        _count: {
          action: "desc",
        },
      },
      take: 10,
    });

    // Usuários mais ativos
    const topUsers = await prisma.auditLog.groupBy({
      by: ["userId"],
      where: {
        ...baseWhere,
        userId: {
          not: null,
        },
        createdAt: {
          gte: startDate,
        },
      },
      _count: {
        userId: true,
      },
      orderBy: {
        _count: {
          userId: "desc",
        },
      },
      take: 5,
    });

    // Buscar informações dos usuários mais ativos
    const userIds = topUsers.map((u) => u.userId).filter(Boolean) as string[];
    const users =
      userIds.length > 0
        ? await prisma.user.findMany({
            where: {
              id: { in: userIds },
            },
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          })
        : [];

    // Atividade por dia (últimos 7 dias)
    const dailyActivity = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = await prisma.auditLog.count({
        where: {
          ...baseWhere,
          createdAt: {
            gte: date,
            lt: nextDate,
          },
        },
      });

      dailyActivity.push({
        date: date.toISOString().split("T")[0],
        count,
      });
    }

    // Logs por hora (hoje)
    const hourlyActivity = [];
    for (let hour = 0; hour < 24; hour++) {
      const hourStart = new Date(today);
      hourStart.setHours(hour, 0, 0, 0);

      const hourEnd = new Date(hourStart);
      hourEnd.setHours(hour + 1, 0, 0, 0);

      const count = await prisma.auditLog.count({
        where: {
          ...baseWhere,
          createdAt: {
            gte: hourStart,
            lt: hourEnd,
          },
        },
      });

      hourlyActivity.push({
        hour,
        count,
      });
    }

    // Eventos de segurança (tentativas de login falhadas, etc)
    const securityEvents = await prisma.auditLog.count({
      where: {
        ...baseWhere,
        action: {
          in: [
            "LOGIN_FAILED",
            "PERMISSION_DENIED",
            "SUSPICIOUS_ACTIVITY",
            "BRUTE_FORCE",
          ],
        },
        createdAt: {
          gte: startDate,
        },
      },
    });

    // Alertas críticos (últimas 24h)
    const last24h = new Date();
    last24h.setHours(last24h.getHours() - 24);

    const criticalAlerts = await prisma.auditLog.findMany({
      where: {
        ...baseWhere,
        action: {
          in: [
            "DELETE_TENANT",
            "DELETE_USER",
            "BRUTE_FORCE",
            "SUSPICIOUS_ACTIVITY",
          ],
        },
        createdAt: {
          gte: last24h,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });

    const enrichedTopUsers = topUsers.map((userStat) => {
      const user = users.find((u) => u.id === userStat.userId);
      return {
        userId: userStat.userId,
        count: userStat._count.userId,
        user: user || { name: "Usuário Deletado", email: "N/A" },
      };
    });

    const stats = {
      overview: {
        totalLogs,
        logsToday,
        logsYesterday,
        changeFromYesterday:
          logsYesterday === 0
            ? 100
            : ((logsToday - logsYesterday) / logsYesterday) * 100,
        securityEvents,
      },
      topActions: topActions.map((action) => ({
        action: action.action,
        count: action._count.action,
      })),
      topUsers: enrichedTopUsers,
      dailyActivity,
      hourlyActivity,
      criticalAlerts,
      period: {
        days,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString(),
      },
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Erro ao buscar estatísticas de auditoria:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
