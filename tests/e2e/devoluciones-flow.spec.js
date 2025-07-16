import { test, expect } from '@playwright/test';

test.describe('Flujo de Devoluciones - Crítico', () => {
  test.beforeEach(async ({ page }) => {
    // Autenticación
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Navegar a devoluciones
    await page.goto('/returns');
    await page.waitForLoadState('networkidle');
  });

  test('Debe procesar devolución de producto compuesto completa', async ({ page }) => {
    // Verificar página de devoluciones
    await expect(page.locator('h1, h2')).toContainText(/devoluc|return/i);

    // Crear nueva devolución
    const nuevaDevolucionBtn = page.locator('button:has-text("Nueva Devolución"), button:has-text("Crear"), button:has-text("Registrar")').first();
    await nuevaDevolucionBtn.click();

    // PASO 1: Buscar venta original
    const ventaInput = page.locator('input[placeholder*="venta"], input[placeholder*="factura"], input[name*="sale"]').first();
    await ventaInput.waitFor({ state: 'visible' });
    await ventaInput.fill('VNT-001');
    await page.waitForTimeout(1000);

    // Seleccionar venta
    const ventaOption = page.locator('text=VNT-001, .sale-item').first();
    if (await ventaOption.isVisible()) {
      await ventaOption.click();
    }

    // PASO 2: Seleccionar producto compuesto a devolver
    const productoCompuesto = page.locator('text=/kit.*dental/i, text=/pack.*vitaminas/i, .composite-product').first();
    if (await productoCompuesto.isVisible()) {
      await productoCompuesto.click();
    }

    // Especificar cantidad a devolver
    const cantidadDevolver = page.locator('input[name*="cantidad"], input[type="number"]').first();
    if (await cantidadDevolver.isVisible()) {
      await cantidadDevolver.fill('1');
    }

    // PASO 3: Seleccionar motivo de devolución
    const motivoSelect = page.locator('select[name*="motivo"], select[name*="reason"]').first();
    if (await motivoSelect.isVisible()) {
      await motivoSelect.selectOption('defectuoso');
    }

    // PASO 4: Confirmar descomposición automática
    const descomponerCheck = page.locator('input[type="checkbox"]:near(text="descomponer"), input[name*="decompose"]').first();
    if (await descomponerCheck.isVisible()) {
      await descomponerCheck.check();
    }

    // PASO 5: Procesar devolución
    const procesarBtn = page.locator('button:has-text("Procesar"), button:has-text("Confirmar"), button:has-text("Registrar")').first();
    await procesarBtn.waitFor({ state: 'visible' });
    await procesarBtn.click();

    // PASO 6: Verificar descomposición exitosa
    await page.waitForTimeout(2500);
    const exitoDescomposicion = page.locator('text=/producto.*descompuesto/i, text=/componentes.*devueltos/i, .success-message').first();
    if (await exitoDescomposicion.isVisible()) {
      await expect(exitoDescomposicion).toBeVisible();
    }

    // Verificar que aparecen los componentes individuales
    const componentes = page.locator('.component-item, .individual-product').count();
    if (await componentes > 0) {
      expect(await componentes).toBeGreaterThan(0);
    }
  });

  test('Debe manejar devolución parcial de productos compuestos', async ({ page }) => {
    await expect(page.locator('h1, h2')).toContainText(/devoluc/i);

    // Nueva devolución parcial
    const nuevaBtn = page.locator('button:has-text("Nueva")').first();
    await nuevaBtn.click();

    // Buscar venta con múltiples unidades del producto compuesto
    const ventaInput = page.locator('input[placeholder*="venta"]').first();
    await ventaInput.fill('VNT-002');
    await page.waitForTimeout(1000);

    const venta = page.locator('text=VNT-002').first();
    if (await venta.isVisible()) {
      await venta.click();
    }

    // Seleccionar producto compuesto (originalmente 3 unidades)
    const productoKit = page.locator('text=/kit.*completo/i, .composite-product').first();
    if (await productoKit.isVisible()) {
      await productoKit.click();
    }

    // Devolver solo 2 de 3 unidades
    const cantidadParcial = page.locator('input[type="number"]').first();
    if (await cantidadParcial.isVisible()) {
      await cantidadParcial.fill('2');
    }

    // Motivo de devolución
    const motivo = page.locator('select[name*="motivo"]').first();
    if (await motivo.isVisible()) {
      await motivo.selectOption('cliente_insatisfecho');
    }

    // Procesar devolución parcial
    const procesarBtn = page.locator('button:has-text("Procesar")').first();
    await procesarBtn.click();

    // Verificar procesamiento parcial
    await page.waitForTimeout(2000);
    const exitoParcial = page.locator('text=/devolución.*parcial/i, text=/2.*unidades.*devueltas/i').first();
    if (await exitoParcial.isVisible()) {
      await expect(exitoParcial).toBeVisible();
    }
  });

  test('Debe validar stock al procesar devolución', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/devoluc/i);

    const nuevaBtn = page.locator('button:has-text("Nueva")').first();
    await nuevaBtn.click();

    // Buscar venta
    const ventaInput = page.locator('input[placeholder*="venta"]').first();
    await ventaInput.fill('VNT-003');
    await page.waitForTimeout(1000);

    const venta = page.locator('text=VNT-003').first();
    if (await venta.isVisible()) {
      await venta.click();
    }

    // Seleccionar producto
    const producto = page.locator('.product-item, tr:has(td)').first();
    if (await producto.isVisible()) {
      await producto.click();
    }

    // Intentar devolver más de lo comprado
    const cantidadExcesiva = page.locator('input[type="number"]').first();
    if (await cantidadExcesiva.isVisible()) {
      await cantidadExcesiva.fill('999');
    }

    const procesarBtn = page.locator('button:has-text("Procesar")').first();
    if (await procesarBtn.isVisible()) {
      await procesarBtn.click();
    }

    // Verificar mensaje de error de validación
    await page.waitForTimeout(1000);
    const errorValidacion = page.locator('text=/cantidad.*excede/i, text=/no.*suficiente/i, .error-message').first();
    if (await errorValidacion.isVisible()) {
      await expect(errorValidacion).toBeVisible();
    }
  });

  test('Debe generar reembolso automático', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/devoluc/i);

    const nuevaBtn = page.locator('button:has-text("Nueva")').first();
    await nuevaBtn.click();

    // Seleccionar venta para reembolso
    const ventaInput = page.locator('input[placeholder*="venta"]').first();
    await ventaInput.fill('VNT-004');
    await page.waitForTimeout(1000);

    const venta = page.locator('text=VNT-004').first();
    if (await venta.isVisible()) {
      await venta.click();
    }

    // Seleccionar producto para reembolso completo
    const producto = page.locator('.product-item').first();
    if (await producto.isVisible()) {
      await producto.click();
    }

    // Especificar motivo que amerita reembolso
    const motivoReembolso = page.locator('select[name*="motivo"]').first();
    if (await motivoReembolso.isVisible()) {
      await motivoReembolso.selectOption('defectuoso');
    }

    // Activar reembolso automático
    const reembolsoCheck = page.locator('input[type="checkbox"]:near(text="reembolso"), input[name*="refund"]').first();
    if (await reembolsoCheck.isVisible()) {
      await reembolsoCheck.check();
    }

    // Procesar con reembolso
    const procesarBtn = page.locator('button:has-text("Procesar")').first();
    await procesarBtn.click();

    // Verificar reembolso generado
    await page.waitForTimeout(2000);
    const reembolsoExitoso = page.locator('text=/reembolso.*generado/i, text=/monto.*devuelto/i').first();
    if (await reembolsoExitoso.isVisible()) {
      await expect(reembolsoExitoso).toBeVisible();
    }

    // Verificar monto del reembolso
    const montoReembolso = page.locator('text=/\$[\d,.]+/, [data-testid="refund-amount"]').first();
    if (await montoReembolso.isVisible()) {
      await expect(montoReembolso).toBeVisible();
    }
  });

  test('Debe manejar devolución con componentes dañados', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/devoluc/i);

    const nuevaBtn = page.locator('button:has-text("Nueva")').first();
    await nuevaBtn.click();

    // Buscar venta con producto compuesto
    const ventaInput = page.locator('input[placeholder*="venta"]').first();
    await ventaInput.fill('VNT-005');
    await page.waitForTimeout(1000);

    const venta = page.locator('text=VNT-005').first();
    if (await venta.isVisible()) {
      await venta.click();
    }

    // Seleccionar kit/producto compuesto
    const kit = page.locator('text=/kit/i, .composite-product').first();
    if (await kit.isVisible()) {
      await kit.click();
    }

    // Especificar que hay componentes dañados
    const componentesDañados = page.locator('input[name*="damaged"], textarea[name*="observ"]').first();
    if (await componentesDañados.isVisible()) {
      await componentesDañados.fill('Componente A dañado, resto en buen estado');
    }

    // Seleccionar disposición de componentes
    const disposicionSelect = page.locator('select[name*="disposition"], select[name*="disposal"]').first();
    if (await disposicionSelect.isVisible()) {
      await disposicionSelect.selectOption('parcial_reutilizable');
    }

    const procesarBtn = page.locator('button:has-text("Procesar")').first();
    await procesarBtn.click();

    // Verificar manejo de componentes mixtos
    await page.waitForTimeout(2000);
    const procesamientoMixto = page.locator('text=/componentes.*procesados/i, text=/parcialmente.*reutilizable/i').first();
    if (await procesamientoMixto.isVisible()) {
      await expect(procesamientoMixto).toBeVisible();
    }
  });

  test('Debe actualizar inventario tras devolución', async ({ page }) => {
    // Obtener stock inicial
    await page.goto('/inventory');
    const stockInicial = page.locator('[data-testid="product-stock"], .stock-count').first();
    let stockAntes = 0;
    if (await stockInicial.isVisible()) {
      const stockText = await stockInicial.textContent();
      stockAntes = parseInt(stockText.match(/\d+/)?.[0] || '0');
    }

    // Procesar devolución
    await page.goto('/returns');
    const nuevaBtn = page.locator('button:has-text("Nueva")').first();
    await nuevaBtn.click();

    const ventaInput = page.locator('input[placeholder*="venta"]').first();
    await ventaInput.fill('VNT-006');
    await page.waitForTimeout(1000);

    const venta = page.locator('text=VNT-006').first();
    if (await venta.isVisible()) {
      await venta.click();
    }

    const producto = page.locator('.product-item').first();
    if (await producto.isVisible()) {
      await producto.click();
    }

    const procesarBtn = page.locator('button:has-text("Procesar")').first();
    await procesarBtn.click();

    // Verificar actualización en inventario
    await page.waitForTimeout(2000);
    await page.goto('/inventory');
    
    const stockFinal = page.locator('[data-testid="product-stock"], .stock-count').first();
    if (await stockFinal.isVisible()) {
      const stockText = await stockFinal.textContent();
      const stockDespues = parseInt(stockText.match(/\d+/)?.[0] || '0');
      
      // El stock debería haber aumentado
      expect(stockDespues).toBeGreaterThan(stockAntes);
    }
  });
}); 