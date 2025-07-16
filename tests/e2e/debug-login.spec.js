import { test, expect } from '@playwright/test';

test.describe('Debug Login Component', () => {
  test('analizar paso a paso la carga del login', async ({ page }) => {
    console.log('🔍 Iniciando análisis detallado del login...');
    
    // Capturar todos los errores
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`❌ Console Error: ${msg.text()}`);
      }
    });

    page.on('pageerror', error => {
      console.log(`💥 Page Error: ${error.message}`);
    });

    console.log('🚀 Navegando a la página...');
    await page.goto('/', { waitUntil: 'networkidle' });

    // Esperar un momento para que React se monte
    await page.waitForTimeout(1000);

    console.log('📄 Analizando estructura DOM...');
    
    // Verificar el elemento root
    const rootElement = await page.locator('#root');
    const rootExists = await rootElement.count();
    console.log('⚛️ Elemento #root:', rootExists > 0 ? 'EXISTE' : 'NO EXISTE');

    if (rootExists > 0) {
      const rootContent = await rootElement.innerHTML();
      console.log('📄 Contenido del #root (primeros 500 chars):');
      console.log(rootContent.substring(0, 500));
    }

    // Verificar si hay el título "Bienvenido"
    const welcomeTitle = await page.locator('h2:has-text("Bienvenido")');
    const titleExists = await welcomeTitle.count();
    console.log('👋 Título "Bienvenido":', titleExists > 0 ? 'EXISTE' : 'NO EXISTE');

    // Verificar si hay el subtítulo
    const subtitle = await page.locator('p:has-text("Ingresa tus credenciales")');
    const subtitleExists = await subtitle.count();
    console.log('📝 Subtítulo:', subtitleExists > 0 ? 'EXISTE' : 'NO EXISTE');

    // Verificar campos de formulario específicos
    const emailInput = await page.locator('input[type="email"], input[name="username"], input[placeholder*="usuario"], input[placeholder*="email"]');
    const emailExists = await emailInput.count();
    console.log('📧 Campo de email/usuario:', emailExists > 0 ? 'EXISTE' : 'NO EXISTE');

    const passwordInput = await page.locator('input[type="password"]');
    const passwordExists = await passwordInput.count();
    console.log('🔒 Campo de contraseña:', passwordExists > 0 ? 'EXISTE' : 'NO EXISTE');

    const submitButton = await page.locator('button[type="submit"], button:has-text("Ingresar"), button:has-text("Login")');
    const buttonExists = await submitButton.count();
    console.log('🔘 Botón de envío:', buttonExists > 0 ? 'EXISTE' : 'NO EXISTE');

    // Verificar estructura específica del MainLayout
    const header = await page.locator('header');
    const headerExists = await header.count();
    console.log('📤 Header:', headerExists > 0 ? 'EXISTE' : 'NO EXISTE');

    // Verificar si hay loading states
    const loadingElements = await page.locator('[data-testid*="loading"], .loading, :has-text("Cargando"), :has-text("Loading")');
    const loadingExists = await loadingElements.count();
    console.log('⏳ Elementos de loading:', loadingExists);

    // Verificar si hay errores visibles
    const errorElements = await page.locator('.error, [data-testid*="error"], :has-text("Error")');
    const errorsCount = await errorElements.count();
    console.log('🚨 Elementos de error:', errorsCount);

    // Verificar AuthContext
    const authElements = await page.locator('[data-testid*="auth"]');
    const authCount = await authElements.count();
    console.log('🔐 Elementos de auth:', authCount);

    // Tomar screenshot detallado
    await page.screenshot({ 
      path: 'test-results/debug-login-full.png',
      fullPage: true 
    });

    // Verificar el texto completo del body
    const bodyText = await page.locator('body').textContent();
    console.log('\n📄 TEXTO COMPLETO EN BODY:');
    console.log('=====================================');
    console.log(bodyText);
    console.log('=====================================');

    // Verificar HTML completo del formulario
    const formElements = await page.locator('form, div[role="form"]');
    const formsCount = await formElements.count();
    console.log('📋 Formularios encontrados:', formsCount);

    if (formsCount > 0) {
      for (let i = 0; i < formsCount; i++) {
        const formHtml = await formElements.nth(i).innerHTML();
        console.log(`📋 HTML del formulario ${i + 1}:`);
        console.log(formHtml);
      }
    }

    // Test de interacción básica
    if (emailExists > 0 && passwordExists > 0) {
      console.log('🧪 Probando interacción básica...');
      
      await emailInput.first().fill('test@example.com');
      await passwordInput.first().fill('password123');
      
      console.log('✅ Campos llenados correctamente');
      
      // Tomar screenshot después de llenar
      await page.screenshot({ 
        path: 'test-results/debug-login-filled.png',
        fullPage: true 
      });
    }

    // Verificar elementos por clases CSS comunes
    const commonElements = [
      '.login-form',
      '.auth-form', 
      '.form-container',
      '.login-container',
      '.auth-container'
    ];

    for (const selector of commonElements) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log(`🎯 Elemento encontrado: ${selector} (${count})`);
      }
    }

    // Verificar estado final
    console.log('\n📊 RESUMEN FINAL:');
    console.log('- React montado:', rootExists > 0);
    console.log('- Título presente:', titleExists > 0);
    console.log('- Campos de formulario:', emailExists > 0 && passwordExists > 0);
    console.log('- Formulario funcional:', emailExists > 0 && passwordExists > 0 && buttonExists > 0);

    // El test debe pasar si al menos tenemos el elemento root
    expect(rootExists).toBeGreaterThan(0);
  });

  test('verificar AuthContext inicialización', async ({ page }) => {
    console.log('🔐 Verificando inicialización del AuthContext...');

    // Inyectar script para verificar el estado de React
    await page.goto('/');

    const reactState = await page.evaluate(() => {
      // Verificar si React está cargado
      const reactExists = window.React !== undefined;
      
      // Verificar el estado del DOM
      const rootElement = document.getElementById('root');
      const rootHasContent = rootElement && rootElement.innerHTML.length > 100;
      
      return {
        reactExists,
        rootHasContent,
        rootInnerHTML: rootElement ? rootElement.innerHTML.substring(0, 200) : 'NO ROOT',
        documentReady: document.readyState,
        hasAuthProvider: document.querySelector('[data-testid*="auth"]') !== null
      };
    });

    console.log('⚛️ Estado de React:', reactState);

    expect(reactState.rootHasContent).toBe(true);
  });
}); 