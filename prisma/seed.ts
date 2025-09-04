import { PrismaClient, UserRole, TenantStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

  // 1. Criar planos básicos
  console.log('📋 Criando planos...')
  
  const basicPlan = await prisma.plan.upsert({
    where: { slug: 'basic' },
    update: {},
    create: {
      name: 'Plano Básico',
      slug: 'basic',
      description: 'Plano básico para pequenas clínicas',
      maxUsers: 10,
      features: ['gestao_pacientes', 'agenda_basica', 'prontuario'],
      price: 199.99,
      isActive: true,
    },
  })

  const premiumPlan = await prisma.plan.upsert({
    where: { slug: 'premium' },
    update: {},
    create: {
      name: 'Plano Premium',
      slug: 'premium',
      description: 'Plano premium com recursos avançados',
      maxUsers: 50,
      features: ['gestao_pacientes', 'agenda_avancada', 'prontuario', 'relatorios', 'integracao_caleidoscopio'],
      price: 499.99,
      isActive: true,
    },
  })

  const enterprisePlan = await prisma.plan.upsert({
    where: { slug: 'enterprise' },
    update: {},
    create: {
      name: 'Plano Enterprise',
      slug: 'enterprise',
      description: 'Plano enterprise para grandes clínicas',
      maxUsers: 200,
      features: ['gestao_pacientes', 'agenda_avancada', 'prontuario', 'relatorios', 'integracao_caleidoscopio', 'api_acesso', 'suporte_prioritario'],
      price: 999.99,
      isActive: true,
    },
  })

  console.log(`✅ Planos criados: ${basicPlan.name}, ${premiumPlan.name}, ${enterprisePlan.name}`)

  // 2. Criar Super Admin
  console.log('👤 Criando Super Admin...')
  
  const superAdminEmail = 'admin@caleidoscopio.com'
  const superAdminPassword = await bcrypt.hash('admin123!@#', 12)

  const superAdmin = await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: {},
    create: {
      email: superAdminEmail,
      name: 'Super Administrador',
      password: superAdminPassword,
      role: UserRole.SUPER_ADMIN,
      isActive: true,
    },
  })

  console.log(`✅ Super Admin criado: ${superAdmin.email}`)

  // 3. Criar tenant de exemplo
  console.log('🏢 Criando tenant de exemplo...')
  
  const exampleTenant = await prisma.tenant.upsert({
    where: { slug: 'clinica-exemplo' },
    update: {},
    create: {
      name: 'Clínica Exemplo',
      slug: 'clinica-exemplo',
      status: TenantStatus.ACTIVE,
      planId: premiumPlan.id,
      maxUsers: 50,
    },
  })

  console.log(`✅ Tenant criado: ${exampleTenant.name}`)

  // 4. Criar admin do tenant de exemplo
  console.log('👨‍💼 Criando admin do tenant...')
  
  const tenantAdminEmail = 'admin@clinica-exemplo.com'
  const tenantAdminPassword = await bcrypt.hash('clinica123!@#', 12)

  const tenantAdmin = await prisma.user.upsert({
    where: { email: tenantAdminEmail },
    update: {},
    create: {
      email: tenantAdminEmail,
      name: 'Admin da Clínica',
      password: tenantAdminPassword,
      role: UserRole.ADMIN,
      tenantId: exampleTenant.id,
      isActive: true,
    },
  })

  console.log(`✅ Admin do tenant criado: ${tenantAdmin.email}`)

  // 5. Criar usuários de exemplo
  console.log('👥 Criando usuários de exemplo...')
  
  const user1Password = await bcrypt.hash('user123!@#', 12)
  const user2Password = await bcrypt.hash('user456!@#', 12)

  const user1 = await prisma.user.upsert({
    where: { email: 'terapeuta1@clinica-exemplo.com' },
    update: {},
    create: {
      email: 'terapeuta1@clinica-exemplo.com',
      name: 'Dr. João Terapeuta',
      password: user1Password,
      role: UserRole.USER,
      tenantId: exampleTenant.id,
      isActive: true,
    },
  })

  const user2 = await prisma.user.upsert({
    where: { email: 'terapeuta2@clinica-exemplo.com' },
    update: {},
    create: {
      email: 'terapeuta2@clinica-exemplo.com',
      name: 'Dra. Maria Especialista',
      password: user2Password,
      role: UserRole.USER,
      tenantId: exampleTenant.id,
      isActive: true,
    },
  })

  console.log(`✅ Usuários criados: ${user1.name}, ${user2.name}`)

  console.log('🎉 Seed concluído com sucesso!')
  console.log('\n📝 Credenciais criadas:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🔧 SUPER ADMIN:')
  console.log(`   Email: ${superAdminEmail}`)
  console.log('   Senha: admin123!@#')
  console.log('   Acesso: Controle total do sistema')
  console.log('')
  console.log('🏢 ADMIN DO TENANT (Clínica Exemplo):')
  console.log(`   Email: ${tenantAdminEmail}`)
  console.log('   Senha: clinica123!@#')
  console.log('   Slug do tenant: clinica-exemplo')
  console.log('')
  console.log('👤 USUÁRIOS REGULARES:')
  console.log('   Email: terapeuta1@clinica-exemplo.com | Senha: user123!@#')
  console.log('   Email: terapeuta2@clinica-exemplo.com | Senha: user456!@#')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Erro no seed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })