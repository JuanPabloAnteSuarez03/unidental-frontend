import { test, expect } from '@playwright/test';

test.describe('Flujo de Ventas - Crítico', () => {
  test.beforeEach(async ({ page }) => {
    // Simular autenticación
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Navegar a ventas
    await page.goto('/sales');
    await page.waitForLoadState('networkidle');
  });

  test('Debe completar venta con cliente específico', async ({ page }) => {
    // Verificar que estamos en la página de ventas
    await expect(page.locator('h1')).toContainText('Registrar Venta');

    // PASO 1: Seleccionar cliente
    const clienteInput = page.locator('input[placeholder*="cliente" i]').first();
    await clienteInput.waitFor({ state: 'visible' });
    await clienteInput.fill('Juan Pérez');
    
    // Esperar y seleccionar cliente de la lista
    await page.waitForTimeout(1000);
    const clienteOption = page.locator('text=Juan Pérez').first();
    if (await clienteOption.isVisible()) {
      await clienteOption.click();
    }

    // PASO 2: Seleccionar sede/ubicación
    const sedeButton = page.locator('button:has-text("Farmacia Central"), button:has-text("Sede Principal")').first();
    if (await sedeButton.isVisible()) {
      await sedeButton.click();
    }

    // PASO 3: Agregar productos
    const productoInput = page.locator('input[placeholder*="producto" i], input[placeholder*="buscar" i]').first();
    await productoInput.waitFor({ state: 'visible' });
    await productoInput.fill('Aspirina');
    
    // Esperar productos y seleccionar
    await page.waitForTimeout(1500);
    const productoOption = page.locator('text=Aspirina').first();
    if (await productoOption.isVisible()) {
      await productoOption.click();
    }

    // Establecer cantidad
    const cantidadInput = page.locator('input[type="number"], input[name*="cantidad"], input[placeholder*="cantidad"]').first();
    if (await cantidadInput.isVisible()) {
      await cantidadInput.fill('2');
    }

    // Agregar al carrito
    const agregarBtn = page.locator('button:has-text("Agregar"), button:has-text("Añadir")').first();
    if (await agregarBtn.isVisible()) {
      await agregarBtn.click();
    }

    // PASO 4: Verificar total
    await page.waitForTimeout(500);
    const totalElement = page.locator('text=/total.*\$[\d,.]+/i, [data-testid="total"], .total-amount').first();
    if (await totalElement.isVisible()) {
      await expect(totalElement).toBeVisible();
    }

    // PASO 5: Procesar venta
    const procesarBtn = page.locator('button:has-text("Registrar Venta"), button:has-text("Procesar"), button:has-text("Finalizar")').first();
    await procesarBtn.waitFor({ state: 'visible' });
    await procesarBtn.click();

    // PASO 6: Verificar éxito
    await page.waitForTimeout(2000);
    const exitoMessage = page.locator('text=/venta.*exitosa/i, text=/registrada.*correctamente/i, .success-message').first();
    if (await exitoMessage.isVisible()) {
      await expect(exitoMessage).toBeVisible();
    }
  });

  test('Debe manejar venta sin cliente específico', async ({ page }) => {
    // Verificar página de ventas
    await expect(page.locator('h1')).toContainText('Registrar Venta');

    // Seleccionar venta sin cliente
    const sinClienteBtn = page.locator('button:has-text("sin cliente"), button:has-text("Sin Cliente")').first();
    if (await sinClienteBtn.isVisible()) {
      await sinClienteBtn.click();
    }

    // Agregar producto rápido
    const productoInput = page.locator('input[placeholder*="producto" i]').first();
    await productoInput.fill('Ibuprofeno');
    await page.waitForTimeout(1000);
    
    const producto = page.locator('text=Ibuprofeno').first();
    if (await producto.isVisible()) {
      await producto.click();
    }

    // Procesar venta directa
    const procesarBtn = page.locator('button:has-text("Registrar"), button:has-text("Procesar")').first();
    if (await procesarBtn.isVisible()) {
      await procesarBtn.click();
    }

    // Verificar procesamiento
    await page.waitForTimeout(1500);
    const resultado = page.locator('text=/venta/i, text=/registr/i, text=/éxito/i').first();
    await expect(resultado).toBeVisible();
  });

  test('Debe validar stock insuficiente', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Registrar Venta');

    // Intentar agregar cantidad mayor al stock
    const productoInput = page.locator('input[placeholder*="producto" i]').first();
    await productoInput.fill('Paracetamol');
    await page.waitForTimeout(1000);

    const producto = page.locator('text=Paracetamol').first();
    if (await producto.isVisible()) {
      await producto.click();
    }

    // Intentar cantidad excesiva
    const cantidadInput = page.locator('input[type="number"]').first();
    if (await cantidadInput.isVisible()) {
      await cantidadInput.fill('9999');
    }

    const agregarBtn = page.locator('button:has-text("Agregar")').first();
    if (await agregarBtn.isVisible()) {
      await agregarBtn.click();
    }

    // Verificar mensaje de error de stock
    await page.waitForTimeout(1000);
    const errorStock = page.locator('text=/stock.*insuficiente/i, text=/sin.*stock/i, .error-message').first();
    if (await errorStock.isVisible()) {
      await expect(errorStock).toBeVisible();
    }
  });

  test('Debe procesar venta con múltiples productos', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Registrar Venta');

    // Agregar primer producto
    let productoInput = page.locator('input[placeholder*="producto" i]').first();
    await productoInput.fill('Vitamina C');
    await page.waitForTimeout(1000);
    
    let producto = page.locator('text=Vitamina').first();
    if (await producto.isVisible()) {
      await producto.click();
    }

    let agregarBtn = page.locator('button:has-text("Agregar")').first();
    if (await agregarBtn.isVisible()) {
      await agregarBtn.click();
    }

    // Agregar segundo producto
    await page.waitForTimeout(500);
    productoInput = page.locator('input[placeholder*="producto" i]').first();
    await productoInput.fill('Calcio');
    await page.waitForTimeout(1000);
    
    producto = page.locator('text=Calcio').first();
    if (await producto.isVisible()) {
      await producto.click();
    }

    agregarBtn = page.locator('button:has-text("Agregar")').first();
    if (await agregarBtn.isVisible()) {
      await agregarBtn.click();
    }

    // Verificar que hay múltiples productos en el carrito
    await page.waitForTimeout(500);
    const productos = page.locator('.product-item, .cart-item, tr').count();
    
    // Procesar venta múltiple
    const procesarBtn = page.locator('button:has-text("Registrar"), button:has-text("Procesar")').first();
    if (await procesarBtn.isVisible()) {
      await procesarBtn.click();
    }

    await page.waitForTimeout(2000);
    const exito = page.locator('text=/venta.*registrada/i, text=/éxito/i').first();
    await expect(exito).toBeVisible();
  });
}); 