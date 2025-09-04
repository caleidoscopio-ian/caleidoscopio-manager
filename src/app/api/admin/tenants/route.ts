/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { createTenant } from "@/lib/auth/service";
import { getAllTenants } from "@/lib/tenant/service";
import { validateSession } from "@/lib/auth/session";
import { CreateTenantData } from "@/lib/auth/types";

// Listar todos os tenants (Super Admin)
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("session")?.value;

    if (!token) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Validar sessão
    const sessionData = await validateSession(token);

    if (!sessionData || sessionData.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const tenants = await getAllTenants();

    return NextResponse.json({ tenants });
  } catch (error) {
    console.error("Erro ao listar tenants:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// Criar novo tenant (Super Admin)
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("session")?.value;

    if (!token) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Validar sessão
    const sessionData = await validateSession(token);

    if (!sessionData || sessionData.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body: CreateTenantData = await request.json();
    const { name, slug, planId, adminEmail, adminName, adminPassword } = body;

    // Validar dados de entrada
    if (
      !name ||
      !slug ||
      !planId ||
      !adminEmail ||
      !adminName ||
      !adminPassword
    ) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios" },
        { status: 400 }
      );
    }

    // Criar tenant
    const result = await createTenant(body);

    return NextResponse.json({
      message: "Tenant criado com sucesso",
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        slug: result.tenant.slug,
        status: result.tenant.status,
      },
      admin: {
        id: result.admin.id,
        email: result.admin.email,
        name: result.admin.name,
      },
    });
  } catch (error: any) {
    console.error("Erro ao criar tenant:", error);

    if (
      error.message === "Slug já existe" ||
      error.message === "Email já existe"
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
