import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth/session";

// API para validar se um usuário tem acesso a um produto específico
// Para ser chamada pelos sistemas externos (educacional, e-commerce, etc.)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productSlug, userEmail, tenantSlug } = body;

    console.log("🔍 Validando acesso:", { productSlug, userEmail, tenantSlug });

    // Validar parâmetros obrigatórios
    if (!productSlug || (!userEmail && !tenantSlug)) {
      return NextResponse.json(
        {
          hasAccess: false,
          error:
            "Parâmetros obrigatórios: productSlug e (userEmail ou tenantSlug)",
        },
        { status: 400 }
      );
    }

    // Buscar produto
    const product = await prisma.product.findUnique({
      where: { slug: productSlug },
    });

    if (!product || !product.isActive) {
      return NextResponse.json(
        {
          hasAccess: false,
          error: "Produto não encontrado ou inativo",
        },
        { status: 404 }
      );
    }

    let user = null;
    let tenant = null;

    // Se foi fornecido email do usuário
    if (userEmail) {
      user = await prisma.user.findUnique({
        where: { email: userEmail },
        include: {
          tenant: {
            include: {
              plan: {
                include: {
                  planProducts: {
                    include: {
                      product: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!user || !user.isActive) {
        return NextResponse.json({
          hasAccess: false,
          error: "Usuário não encontrado ou inativo",
        });
      }

      tenant = user.tenant;
    }

    // Se foi fornecido slug do tenant
    if (tenantSlug && !tenant) {
      tenant = await prisma.tenant.findUnique({
        where: { slug: tenantSlug },
        include: {
          plan: {
            include: {
              planProducts: {
                include: {
                  product: true,
                },
              },
            },
          },
        },
      });

      if (!tenant) {
        return NextResponse.json({
          hasAccess: false,
          error: "Clínica não encontrada",
        });
      }
    }

    // Verificar se é super admin (acesso total)
    if (user && user.role === "SUPER_ADMIN") {
      return NextResponse.json({
        hasAccess: true,
        reason: "Super Admin - acesso total",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    }

    // Verificar se o tenant tem acesso ao produto
    if (!tenant) {
      return NextResponse.json({
        hasAccess: false,
        error: "Usuário não pertence a nenhuma clínica",
      });
    }

    // Verificar se o produto está no plano do tenant
    const productInPlan = tenant.plan.planProducts.find(
      (pp) => pp.productId === product.id && pp.isActive
    );

    if (!productInPlan) {
      return NextResponse.json({
        hasAccess: false,
        error: `Clínica "${tenant.name}" não tem acesso ao módulo ${product.name}`,
        tenant: {
          name: tenant.name,
          slug: tenant.slug,
          plan: tenant.plan.name,
        },
      });
    }

    // Verificar se o produto está ativo para o tenant
    const tenantProduct = await prisma.tenantProduct.findFirst({
      where: {
        tenantId: tenant.id,
        productId: product.id,
        isActive: true,
      },
    });

    if (!tenantProduct) {
      return NextResponse.json({
        hasAccess: false,
        error: `Produto ${product.name} não está ativo para a clínica "${tenant.name}"`,
        tenant: {
          name: tenant.name,
          slug: tenant.slug,
          plan: tenant.plan.name,
        },
      });
    }

    // Sucesso - usuário/clínica tem acesso
    const response = {
      hasAccess: true,
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        cnpj: tenant.cnpj,
        plan: {
          id: tenant.plan.id,
          name: tenant.plan.name,
          slug: tenant.plan.slug,
        },
      },
      config: {
        plan: productInPlan.config,
        tenant: tenantProduct.config,
      },
    };

    if (user) {
      response.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      };
    }

    // Atualizar estatísticas de acesso
    await prisma.tenantProduct.updateMany({
      where: {
        tenantId: tenant.id,
        productId: product.id,
      },
      data: {
        lastAccessed: new Date(),
        accessCount: { increment: 1 },
      },
    });

    console.log("✅ Acesso validado com sucesso:", {
      product: product.name,
      tenant: tenant.name,
      user: user?.email,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("❌ Erro ao validar acesso:", error);
    return NextResponse.json(
      {
        hasAccess: false,
        error: "Erro interno do servidor",
      },
      { status: 500 }
    );
  }
}

// Método GET para debug/teste
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const productSlug = searchParams.get("product");
  const userEmail = searchParams.get("email");
  const tenantSlug = searchParams.get("tenant");

  if (!productSlug) {
    return NextResponse.json(
      {
        error:
          "Uso: GET /api/auth/validate-access?product=educational&email=user@example.com",
      },
      { status: 400 }
    );
  }

  // Redirecionar para POST
  return POST(
    new NextRequest(request.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productSlug, userEmail, tenantSlug }),
    })
  );
}
