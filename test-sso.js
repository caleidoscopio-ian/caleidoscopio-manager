// Script para testar integração SSO
// Usando fetch nativo do Node.js 18+

async function testSSO() {
  console.log('🧪 Testando integração SSO...\n');

  try {
    // 1. Fazer login
    console.log('1️⃣ Fazendo login...');
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@clinica-exemplo.com',
        password: 'clinica123!@#'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login falhou: ${loginResponse.status}`);
    }

    const cookies = loginResponse.headers.get('set-cookie');
    console.log('✅ Login realizado com sucesso');

    // 2. Buscar produtos do tenant
    console.log('\n2️⃣ Buscando produtos do tenant...');
    const tenantId = 'clinica-exemplo'; // Slug do tenant

    // Primeiro, vamos pegar o ID real do tenant
    const tenantsResponse = await fetch('http://localhost:3000/api/clinics', {
      headers: { 'Cookie': cookies }
    });

    const tenantsData = await tenantsResponse.json();
    const tenant = tenantsData.tenants?.find(t => t.slug === 'clinica-exemplo');

    if (!tenant) {
      throw new Error('Tenant não encontrado');
    }

    console.log(`✅ Tenant encontrado: ${tenant.name} (ID: ${tenant.id})`);

    // 3. Verificar produtos disponíveis
    const productsResponse = await fetch(`http://localhost:3000/api/tenants/${tenant.id}/products`, {
      headers: { 'Cookie': cookies }
    });

    if (!productsResponse.ok) {
      throw new Error(`Erro ao buscar produtos: ${productsResponse.status}`);
    }

    const productsData = await productsResponse.json();
    console.log('\n3️⃣ Produtos disponíveis:');
    console.log(JSON.stringify(productsData, null, 2));

    // 4. Tentar gerar token SSO para o produto educacional
    console.log('\n4️⃣ Gerando token SSO para produto educacional...');
    const ssoResponse = await fetch('http://localhost:3000/api/products/sso/educational', {
      method: 'POST',
      headers: { 'Cookie': cookies }
    });

    if (!ssoResponse.ok) {
      const errorData = await ssoResponse.json();
      throw new Error(`Erro SSO: ${ssoResponse.status} - ${errorData.error}`);
    }

    const ssoData = await ssoResponse.json();
    console.log('✅ Token SSO gerado com sucesso!');
    console.log(`🔗 URL de redirecionamento: ${ssoData.redirectUrl}`);
    console.log(`⏰ Token expira em: ${ssoData.expiresIn} segundos`);

    // 5. Testar validação do token
    console.log('\n5️⃣ Validando token...');
    const validateResponse = await fetch(`http://localhost:3000/api/products/sso/educational?token=${ssoData.token}`);

    if (!validateResponse.ok) {
      throw new Error(`Erro na validação: ${validateResponse.status}`);
    }

    const validateData = await validateResponse.json();
    console.log('✅ Token validado com sucesso!');
    console.log('👤 Dados do usuário:', JSON.stringify(validateData.user, null, 2));

    console.log('\n🎉 Teste completo! A integração SSO está funcionando.');

    // 6. Testar nova API de validação de acesso
    console.log('\n6️⃣ Testando API de validação de acesso...');

    // Teste por email
    const validateByEmailResponse = await fetch('http://localhost:3000/api/auth/validate-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productSlug: 'educational',
        userEmail: 'admin@clinica-exemplo.com'
      })
    });

    const validateByEmailData = await validateByEmailResponse.json();
    console.log('✅ Validação por email:', validateByEmailData.hasAccess ? '✅ ACESSO PERMITIDO' : '❌ ACESSO NEGADO');
    if (!validateByEmailData.hasAccess) {
      console.log('❌ Erro:', validateByEmailData.error);
    }

    // Teste por tenant slug
    const validateByTenantResponse = await fetch('http://localhost:3000/api/auth/validate-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productSlug: 'educational',
        tenantSlug: 'clinica-exemplo'
      })
    });

    const validateByTenantData = await validateByTenantResponse.json();
    console.log('✅ Validação por tenant:', validateByTenantData.hasAccess ? '✅ ACESSO PERMITIDO' : '❌ ACESSO NEGADO');
    if (!validateByTenantData.hasAccess) {
      console.log('❌ Erro:', validateByTenantData.error);
    }

    console.log('\n📋 INSTRUÇÕES PARA O SISTEMA EDUCACIONAL (localhost:3001):');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1. Antes de permitir login, faça uma requisição para:');
    console.log('   POST http://localhost:3000/api/auth/validate-access');
    console.log('   Body: { "productSlug": "educational", "userEmail": "email@usuario.com" }');
    console.log('');
    console.log('2. Se hasAccess = true, permita o acesso');
    console.log('3. Se hasAccess = false, mostre a mensagem de erro');
    console.log('');
    console.log('Exemplo de implementação no sistema educacional:');
    console.log(`
async function validateAccess(userEmail) {
  const response = await fetch('http://localhost:3000/api/auth/validate-access', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      productSlug: 'educational',
      userEmail: userEmail
    })
  });

  const data = await response.json();
  return data;
}
    `);

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

// Se for executado diretamente
if (require.main === module) {
  testSSO();
}

module.exports = { testSSO };