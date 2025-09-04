/* eslint-disable @typescript-eslint/no-explicit-any */
import { UserRole, TenantStatus } from "@prisma/client";
import { prisma } from "../prisma";
import { hashPassword, verifyPassword } from "./password";
import { createSession } from "./session";
import { LoginCredentials, CreateTenantData, AuthUser } from "./types";

// Login de usuário
export async function authenticateUser(
  credentials: LoginCredentials
): Promise<{ user: AuthUser; token: string } | null> {
  const { email, password, tenantSlug } = credentials;

  // Buscar usuário
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      tenant: true,
    },
  });

  if (!user || !user.isActive) {
    return null;
  }

  // Verificar senha
  const isPasswordValid = await verifyPassword(password, user.password);
  if (!isPasswordValid) {
    return null;
  }

  // Se for especificado um tenant, verificar se o usuário pertence a ele
  if (tenantSlug && user.tenant?.slug !== tenantSlug) {
    return null;
  }

  // Verificar se o tenant está ativo (se aplicável)
  if (user.tenant && user.tenant.status !== TenantStatus.ACTIVE) {
    return null;
  }

  // Criar sessão
  const token = await createSession(user.id);

  // Atualizar último login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  });

  const authUser: AuthUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    tenantId: user.tenantId,
    tenant: user.tenant
      ? {
          id: user.tenant.id,
          name: user.tenant.name,
          slug: user.tenant.slug,
          status: user.tenant.status,
        }
      : null,
  };

  return { user: authUser, token };
}

// Criar novo tenant com admin
export async function createTenant(
  data: CreateTenantData
): Promise<{ tenant: any; admin: any }> {
  const { name, slug, planId, adminEmail, adminName, adminPassword } = data;

  // Verificar se slug já existe
  const existingTenant = await prisma.tenant.findUnique({
    where: { slug },
  });

  if (existingTenant) {
    throw new Error("Slug já existe");
  }

  // Verificar se email já existe
  const existingUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingUser) {
    throw new Error("Email já existe");
  }

  // Hash da senha
  const hashedPassword = await hashPassword(adminPassword);

  // Transação para criar tenant e admin
  const result = await prisma.$transaction(async (tx) => {
    // Criar tenant
    const tenant = await tx.tenant.create({
      data: {
        name,
        slug,
        planId,
      },
      include: {
        plan: true,
      },
    });

    // Criar admin do tenant
    const admin = await tx.user.create({
      data: {
        email: adminEmail,
        name: adminName,
        password: hashedPassword,
        role: UserRole.ADMIN,
        tenantId: tenant.id,
      },
    });

    return { tenant, admin };
  });

  return result;
}

// Criar usuário regular em um tenant
export async function createTenantUser(
  tenantId: string,
  email: string,
  name: string,
  password: string,
  role: UserRole = UserRole.USER
): Promise<any> {
  // Verificar se tenant existe e está ativo
  const tenant = await prisma.tenant.findFirst({
    where: {
      id: tenantId,
      status: TenantStatus.ACTIVE,
    },
    include: {
      plan: true,
      users: true,
    },
  });

  if (!tenant) {
    throw new Error("Tenant não encontrado ou inativo");
  }

  // Verificar limite de usuários
  if (tenant.users.length >= tenant.maxUsers) {
    throw new Error("Limite de usuários atingido para este plano");
  }

  // Verificar se email já existe
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error("Email já existe");
  }

  // Hash da senha
  const hashedPassword = await hashPassword(password);

  // Criar usuário
  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
      role,
      tenantId,
    },
  });

  return user;
}
