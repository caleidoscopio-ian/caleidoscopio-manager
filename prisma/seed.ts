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
      features: [], // Manter vazio, produtos serão gerenciados via relacionamentos
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
      features: [], // Manter vazio, produtos serão gerenciados via relacionamentos
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
      features: [], // Manter vazio, produtos serão gerenciados via relacionamentos
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

  // 6. Criar produtos do ecossistema
  console.log('📦 Criando produtos do ecossistema...')

  const ecommerceProduct = await prisma.product.upsert({
    where: { slug: 'ecommerce' },
    update: {},
    create: {
      name: 'E-commerce Caleidoscópio',
      slug: 'ecommerce',
      description: 'Plataforma de e-commerce integrada para venda de produtos e serviços',
      icon: 'shopping-cart',
      color: '#10b981',
      baseUrl: 'https://ecommerce.caleidoscopio.com',
      defaultConfig: {
        maxProducts: 100,
        paymentMethods: ['credit_card', 'pix'],
        enableInventory: true,
        enableCoupons: false
      },
      isActive: true
    }
  })

  const educationalProduct = await prisma.product.upsert({
    where: { slug: 'educational' },
    update: {},
    create: {
      name: 'Caleidoscópio Educacional',
      slug: 'educational',
      description: 'Plataforma educacional com cursos e treinamentos para profissionais de saúde',
      icon: 'graduation-cap',
      color: '#3b82f6',
      baseUrl: 'http://localhost:3001',
      defaultConfig: {
        maxStudents: 50,
        enableCertificates: true,
        enableLiveClasses: false,
        contentAccess: 'basic'
      },
      isActive: true
    }
  })

  const telemedicineProduct = await prisma.product.upsert({
    where: { slug: 'telemedicine' },
    update: {},
    create: {
      name: 'Telemedicina',
      slug: 'telemedicine',
      description: 'Plataforma de telemedicina para consultas online e acompanhamento remoto',
      icon: 'video',
      color: '#8b5cf6',
      baseUrl: 'https://telemedicina.caleidoscopio.com',
      defaultConfig: {
        maxConcurrentSessions: 5,
        recordingSessions: false,
        enablePrescriptions: true,
        supportedDevices: ['web', 'mobile']
      },
      isActive: true
    }
  })

  console.log(`✅ Produtos criados: ${ecommerceProduct.name}, ${educationalProduct.name}, ${telemedicineProduct.name}`)

  // 7. Associar produtos aos planos
  console.log('🔗 Associando produtos aos planos...')

  // Plano Básico - apenas Educacional
  await prisma.planProduct.upsert({
    where: {
      planId_productId: {
        planId: basicPlan.id,
        productId: educationalProduct.id
      }
    },
    update: {},
    create: {
      planId: basicPlan.id,
      productId: educationalProduct.id,
      config: {
        maxStudents: 20,
        enableCertificates: false,
        enableLiveClasses: false,
        contentAccess: 'basic'
      },
      isActive: true
    }
  })

  // Plano Premium - Educacional + E-commerce
  await prisma.planProduct.upsert({
    where: {
      planId_productId: {
        planId: premiumPlan.id,
        productId: educationalProduct.id
      }
    },
    update: {},
    create: {
      planId: premiumPlan.id,
      productId: educationalProduct.id,
      config: {
        maxStudents: 50,
        enableCertificates: true,
        enableLiveClasses: true,
        contentAccess: 'premium'
      },
      isActive: true
    }
  })

  await prisma.planProduct.upsert({
    where: {
      planId_productId: {
        planId: premiumPlan.id,
        productId: ecommerceProduct.id
      }
    },
    update: {},
    create: {
      planId: premiumPlan.id,
      productId: ecommerceProduct.id,
      config: {
        maxProducts: 100,
        paymentMethods: ['credit_card', 'pix', 'boleto'],
        enableInventory: true,
        enableCoupons: true
      },
      isActive: true
    }
  })

  // Plano Enterprise - Todos os produtos
  await prisma.planProduct.upsert({
    where: {
      planId_productId: {
        planId: enterprisePlan.id,
        productId: educationalProduct.id
      }
    },
    update: {},
    create: {
      planId: enterprisePlan.id,
      productId: educationalProduct.id,
      config: {
        maxStudents: 200,
        enableCertificates: true,
        enableLiveClasses: true,
        contentAccess: 'enterprise'
      },
      isActive: true
    }
  })

  await prisma.planProduct.upsert({
    where: {
      planId_productId: {
        planId: enterprisePlan.id,
        productId: ecommerceProduct.id
      }
    },
    update: {},
    create: {
      planId: enterprisePlan.id,
      productId: ecommerceProduct.id,
      config: {
        maxProducts: 500,
        paymentMethods: ['credit_card', 'pix', 'boleto', 'transfer'],
        enableInventory: true,
        enableCoupons: true,
        enableAdvancedAnalytics: true
      },
      isActive: true
    }
  })

  await prisma.planProduct.upsert({
    where: {
      planId_productId: {
        planId: enterprisePlan.id,
        productId: telemedicineProduct.id
      }
    },
    update: {},
    create: {
      planId: enterprisePlan.id,
      productId: telemedicineProduct.id,
      config: {
        maxConcurrentSessions: 20,
        recordingSessions: true,
        enablePrescriptions: true,
        supportedDevices: ['web', 'mobile', 'tablet'],
        enableAdvancedReports: true
      },
      isActive: true
    }
  })

  console.log('✅ Produtos associados aos planos')

  // 8. Ativar produtos para o tenant de exemplo (Premium)
  console.log('🔌 Ativando produtos para o tenant de exemplo...')

  await prisma.tenantProduct.upsert({
    where: {
      tenantId_productId: {
        tenantId: exampleTenant.id,
        productId: educationalProduct.id
      }
    },
    update: {},
    create: {
      tenantId: exampleTenant.id,
      productId: educationalProduct.id,
      config: {
        maxStudents: 50,
        enableCertificates: true,
        enableLiveClasses: true,
        contentAccess: 'premium'
      },
      isActive: true
    }
  })

  await prisma.tenantProduct.upsert({
    where: {
      tenantId_productId: {
        tenantId: exampleTenant.id,
        productId: ecommerceProduct.id
      }
    },
    update: {},
    create: {
      tenantId: exampleTenant.id,
      productId: ecommerceProduct.id,
      config: {
        maxProducts: 100,
        paymentMethods: ['credit_card', 'pix', 'boleto'],
        enableInventory: true,
        enableCoupons: true
      },
      isActive: true
    }
  })

  console.log('✅ Produtos ativados para Clínica Exemplo')

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
  console.log('')
  console.log('📦 PRODUTOS DO ECOSSISTEMA:')
  console.log('   🎓 Caleidoscópio Educacional (educational)')
  console.log('   🛒 E-commerce Caleidoscópio (ecommerce)')
  console.log('   📹 Telemedicina (telemedicine)')
  console.log('')
  console.log('💼 DISTRIBUIÇÃO POR PLANOS:')
  console.log('   • Básico: Apenas Educacional')
  console.log('   • Premium: Educacional + E-commerce')
  console.log('   • Enterprise: Todos os produtos')
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