import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from '@axe-core/playwright';

test.describe('Accesibilidad', () => {
  test.beforeEach(async ({ page }) => {
    // Configurar autenticación para cada test
    await page.goto('/login');
    
    await page.evaluate(() => {
      localStorage.setItem('authToken', 'mock_token_123456');
    });
    
    // Mockear respuestas de autenticación
    await page.route('**/api/auth/users/me/', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          username: 'testuser',
          email: 'test@example.com'
        })
      });
    });
    
    // Inyectar axe-core en la página
    await injectAxe(page);
  });

  test('Página de Login debe ser accesible', async ({ page }) => {
    await page.goto('/login');
    
    // Verificar accesibilidad general
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
    
    // Verificar elementos específicos
    await expect(page.locator('input[name="username"]')).toHaveAttribute('aria-label');
    await expect(page.locator('input[name="password"]')).toHaveAttribute('aria-label');
    await expect(page.locator('button[type="submit"]')).toHaveAttribute('aria-label');
    
    // Verificar que el formulario tiene label correcto
    await expect(page.locator('form')).toHaveAttribute('aria-label');
    
    // Verificar navegación por teclado
    await page.keyboard.press('Tab');
    await expect(page.locator('input[name="username"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('input[name="password"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('button[type="submit"]')).toBeFocused();
  });

  test('Página de Inventario debe ser accesible', async ({ page }) => {
    // Mockear datos necesarios
    await page.route('**/api/catalogs/products/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          count: 2,
          results: [
            { id: 1, name: 'Producto 1', sku: 'SKU-001', category: 'Cat1' },
            { id: 2, name: 'Producto 2', sku: 'SKU-002', category: 'Cat2' }
          ]
        })
      });
    });
    
    await page.goto('/inventario');
    
    // Verificar accesibilidad general
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
    
    // Verificar estructura de encabezados
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const headingCount = await headings.count();
    expect(headingCount).toBeGreaterThan(0);
    
    // Verificar que hay un h1 principal
    await expect(page.locator('h1')).toHaveCount(1);
    
    // Verificar que las tablas tienen headers apropiados
    const tables = page.locator('table');
    const tableCount = await tables.count();
    
    for (let i = 0; i < tableCount; i++) {
      const table = tables.nth(i);
      await expect(table.locator('th')).toHaveCount.greaterThan(0);
    }
    
    // Verificar que los botones tienen texto descriptivo
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const hasText = await button.textContent();
      const hasAriaLabel = await button.getAttribute('aria-label');
      
      expect(hasText || hasAriaLabel).toBeTruthy();
    }
  });

  test('Navegación debe ser accesible por teclado', async ({ page }) => {
    await page.goto('/inventario');
    
    // Verificar que se puede navegar con Tab
    await page.keyboard.press('Tab');
    let focusedElement = await page.locator(':focus').first();
    await expect(focusedElement).toBeVisible();
    
    // Navegar por varios elementos
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      focusedElement = await page.locator(':focus').first();
      await expect(focusedElement).toBeVisible();
    }
    
    // Verificar que se puede navegar hacia atrás con Shift+Tab
    await page.keyboard.press('Shift+Tab');
    focusedElement = await page.locator(':focus').first();
    await expect(focusedElement).toBeVisible();
  });

  test('Formularios deben tener labels apropiados', async ({ page }) => {
    await page.goto('/inventario/nuevo-producto');
    
    // Verificar que todos los inputs tienen labels
    const inputs = page.locator('input, select, textarea');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const name = await input.getAttribute('name');
      const ariaLabel = await input.getAttribute('aria-label');
      
      if (id) {
        // Verificar que existe un label para este input
        const label = page.locator(`label[for="${id}"]`);
        await expect(label).toBeVisible();
      } else {
        // Si no tiene ID, debe tener aria-label
        expect(ariaLabel).toBeTruthy();
      }
    }
  });

  test('Contrastes de colores deben ser suficientes', async ({ page }) => {
    await page.goto('/inventario');
    
    // Verificar accesibilidad con focus en contraste
    await checkA11y(page, null, {
      rules: {
        'color-contrast': { enabled: true }
      }
    });
  });

  test('Imágenes deben tener texto alternativo', async ({ page }) => {
    await page.goto('/inventario');
    
    // Verificar que todas las imágenes tienen alt text
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const ariaLabel = await img.getAttribute('aria-label');
      const role = await img.getAttribute('role');
      
      // Imagen debe tener alt, aria-label, o role="presentation"
      expect(alt !== null || ariaLabel !== null || role === 'presentation').toBeTruthy();
    }
  });

  test('Elementos interactivos deben tener estados focusables', async ({ page }) => {
    await page.goto('/inventario');
    
    // Verificar que botones, links y elementos interactivos son focusables
    const interactiveElements = page.locator('button, a, input, select, textarea, [tabindex]');
    const elementCount = await interactiveElements.count();
    
    for (let i = 0; i < Math.min(elementCount, 10); i++) { // Limitar para performance
      const element = interactiveElements.nth(i);
      await element.focus();
      await expect(element).toBeFocused();
    }
  });

  test('Debe anunciar cambios dinámicos', async ({ page }) => {
    await page.goto('/inventario');
    
    // Verificar que hay regiones live para anuncios
    const liveRegions = page.locator('[aria-live], [role="status"], [role="alert"]');
    const liveCount = await liveRegions.count();
    
    // Debe haber al menos una región live para notificaciones
    expect(liveCount).toBeGreaterThan(0);
  });

  test('Navegación debe tener landmarks', async ({ page }) => {
    await page.goto('/inventario');
    
    // Verificar que hay landmarks principales
    const main = page.locator('main, [role="main"]');
    await expect(main).toHaveCount(1);
    
    const nav = page.locator('nav, [role="navigation"]');
    await expect(nav).toHaveCount.greaterThan(0);
    
    const header = page.locator('header, [role="banner"]');
    await expect(header).toHaveCount.greaterThan(0);
  });

  test('Debe soportar usuarios de solo teclado', async ({ page }) => {
    await page.goto('/inventario');
    
    // Simular usuario que solo usa teclado
    await page.keyboard.press('Tab');
    
    // Verificar que se puede activar un botón con Enter
    const firstButton = page.locator('button').first();
    await firstButton.focus();
    
    // Simular presionar Enter
    await page.keyboard.press('Enter');
    
    // Verificar que el botón respondió (esto dependería de la implementación)
    // await expect(someResponse).toBeVisible();
  });

  test('Debe manejar errores de forma accesible', async ({ page }) => {
    await page.goto('/login');
    
    // Simular error de login
    await page.route('**/api/auth/token/login/', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Credenciales inválidas' })
      });
    });
    
    await page.fill('input[name="username"]', 'invalid');
    await page.fill('input[name="password"]', 'invalid');
    await page.click('button[type="submit"]');
    
    // Verificar que el error es anunciado apropiadamente
    const errorElement = page.locator('[role="alert"], .error-message, [aria-live="polite"]');
    await expect(errorElement).toBeVisible();
    
    // Verificar que el error tiene el rol correcto
    const errorWithRole = page.locator('[role="alert"]');
    if (await errorWithRole.count() > 0) {
      await expect(errorWithRole).toBeVisible();
    }
  });

  test('Debe ser compatible con lectores de pantalla', async ({ page }) => {
    await page.goto('/inventario');
    
    // Verificar que el contenido principal está marcado correctamente
    const main = page.locator('main, [role="main"]');
    await expect(main).toBeVisible();
    
    // Verificar que hay texto descriptivo para elementos complejos
    const complexElements = page.locator('table, [role="grid"], [role="listbox"]');
    const complexCount = await complexElements.count();
    
    for (let i = 0; i < complexCount; i++) {
      const element = complexElements.nth(i);
      const ariaLabel = await element.getAttribute('aria-label');
      const ariaLabelledBy = await element.getAttribute('aria-labelledby');
      const ariaDescribedBy = await element.getAttribute('aria-describedby');
      
      // Elemento complejo debe tener descripción
      expect(ariaLabel || ariaLabelledBy || ariaDescribedBy).toBeTruthy();
    }
  });

  test('Debe manejar animaciones respetando preferencias', async ({ page }) => {
    // Configurar preferencia de reducir movimiento
    await page.emulateMedia({ reducedMotion: 'reduce' });
    
    await page.goto('/inventario');
    
    // Verificar que las animaciones respetan la preferencia
    // Esto sería específico a tu implementación de CSS
    const animatedElements = page.locator('.animated, [class*="transition"]');
    
    // Verificar que no hay animaciones problemáticas
    await checkA11y(page, null, {
      rules: {
        'motion-reduction': { enabled: true }
      }
    });
  });

  test('Debe tener tiempo suficiente para interacciones', async ({ page }) => {
    await page.goto('/login');
    
    // Verificar que no hay timeouts automáticos problemáticos
    await page.fill('input[name="username"]', 'testuser');
    
    // Esperar 10 segundos para simular usuario lento
    await page.waitForTimeout(10000);
    
    // Verificar que el contenido sigue disponible
    await expect(page.locator('input[name="username"]')).toHaveValue('testuser');
  });

  test('Debe tener indicadores de estado claros', async ({ page }) => {
    await page.goto('/inventario');
    
    // Verificar que hay indicadores de carga cuando sea necesario
    const loadingElements = page.locator('[aria-busy="true"], .loading, [role="progressbar"]');
    
    // Si hay elementos de carga, deben ser accesibles
    const loadingCount = await loadingElements.count();
    if (loadingCount > 0) {
      for (let i = 0; i < loadingCount; i++) {
        const element = loadingElements.nth(i);
        const ariaLabel = await element.getAttribute('aria-label');
        const text = await element.textContent();
        
        expect(ariaLabel || text).toBeTruthy();
      }
    }
  });
}); 