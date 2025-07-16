import { test, expect } from '@playwright/test';

test.describe('Diagnóstico de Conexión', () => {
  test('verificar que la aplicación se carga correctamente', async ({ page }) => {
    console.log('🔍 Iniciando test de diagnóstico...');
    
    // Capturar errores de consola
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
      console.log(`📝 Console ${msg.type()}: ${msg.text()}`);
    });

    // Capturar errores de red
    const networkErrors = [];
    page.on('requestfailed', request => {
      networkErrors.push(`❌ Failed: ${request.url()} - ${request.failure()?.errorText}`);
      console.log(`🌐 Network Error: ${request.url()} - ${request.failure()?.errorText}`);
    });

    try {
      console.log('🚀 Navegando a la aplicación...');
      
      // Intentar navegar a la página
      await page.goto('/', { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });

      console.log('✅ Navegación completada');

      // Tomar una captura de pantalla para ver qué se está renderizando
      await page.screenshot({ 
        path: 'test-results/diagnostico-screenshot.png',
        fullPage: true 
      });

      console.log('📸 Screenshot tomado');

      // Verificar si el HTML básico se está cargando
      const htmlContent = await page.content();
      console.log('📄 Longitud del HTML:', htmlContent.length);
      console.log('📄 Título de la página:', await page.title());

      // Verificar si hay elementos React
      const reactRoot = await page.locator('#root').count();
      console.log('⚛️ Elemento #root encontrado:', reactRoot > 0);

      // Esperar un poco a que React se monte
      await page.waitForTimeout(2000);

      // Verificar si hay texto visible en la página
      const bodyText = await page.locator('body').textContent();
      console.log('📝 Texto en body (primeros 200 chars):', bodyText?.substring(0, 200));

      // Intentar encontrar elementos comunes de la app
      const loginElements = await page.locator('input[type="email"], input[type="password"]').count();
      console.log('🔐 Elementos de login encontrados:', loginElements);

      // Verificar si hay mensajes de error de React
      const hasReactError = htmlContent.includes('Application error') || 
                           htmlContent.includes('react-error-boundary') ||
                           bodyText?.includes('Error');
      
      console.log('🚨 ¿Hay errores de React?:', hasReactError);

      // Log final de diagnóstico
      console.log('\n📊 RESUMEN DE DIAGNÓSTICO:');
      console.log('- Mensajes de consola:', consoleMessages.length);
      console.log('- Errores de red:', networkErrors.length);
      console.log('- HTML cargado correctamente:', htmlContent.length > 1000);
      console.log('- React root presente:', reactRoot > 0);
      console.log('- Texto visible:', bodyText && bodyText.length > 10);

      // Si llegamos aquí, al menos la página se cargó
      expect(reactRoot).toBeGreaterThan(0);
      expect(htmlContent.length).toBeGreaterThan(100);

    } catch (error) {
      console.error('💥 Error durante el diagnóstico:', error.message);
      
      // Intentar tomar screenshot del error
      try {
        await page.screenshot({ 
          path: 'test-results/diagnostico-error-screenshot.png',
          fullPage: true 
        });
      } catch (screenshotError) {
        console.error('📸 No se pudo tomar screenshot del error:', screenshotError.message);
      }
      
      throw error;
    }
  });

  test('verificar conectividad básica', async ({ page }) => {
    console.log('🌐 Verificando conectividad básica...');
    
    // Intentar hacer una petición simple
    const response = await page.request.get('/');
    console.log('📡 Status de respuesta:', response.status());
    console.log('📡 Headers de respuesta:', await response.headers());
    
    // Verificar que el servidor responde
    expect(response.status()).toBeLessThan(400);
  });
}); 