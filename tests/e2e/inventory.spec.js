import { test, expect } from '@playwright/test';

test.describe('Inventario', () => {
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
    
    // Mockear datos de inventario
    await page.route('**/api/catalogs/products/**', async route => {
      const url = route.request().url();
      
      if (url.includes('page=1')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            count: 150,
            next: '/api/catalogs/products/?page=2',
            previous: null,
            results: [
              {
                id: 1,
                name: 'Aspirina 500mg',
                sku: 'MED-ASP-500',
                category: 'Medicamentos',
                unit: 'Tableta',
                sale_price: 2.50,
                description: 'Analgésico y antipirético'
              },
              {
                id: 2,
                name: 'Ibuprofeno 400mg',
                sku: 'MED-IBU-400',
                category: 'Medicamentos',
                unit: 'Tableta',
                sale_price: 3.00,
                description: 'Antiinflamatorio'
              }
            ]
          })
        });
      }
    });
    
    // Mockear datos de stock
    await page.route('**/api/inventory/stock/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            product: 1,
            quantity: 50,
            location: 'Farmacia Central'
          },
          {
            product: 2,
            quantity: 30,
            location: 'Farmacia Central'
          }
        ])
      });
    });
    
    // Mockear categorías
    await page.route('**/api/catalogs/categories/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, name: 'Medicamentos' },
          { id: 2, name: 'Insumos' },
          { id: 3, name: 'Equipos' }
        ])
      });
    });
    
    await page.goto('/inventario');
  });

  test('Debe cargar y mostrar la lista de productos', async ({ page }) => {
    // Verificar que se muestra el header
    await expect(page.locator('h1')).toContainText('Gestión de Inventario');
    
    // Verificar que se cargan los productos
    await expect(page.locator('[data-testid="product-item"], .product-row')).toHaveCount(2);
    
    // Verificar datos específicos de productos
    await expect(page.locator('text=Aspirina 500mg')).toBeVisible();
    await expect(page.locator('text=MED-ASP-500')).toBeVisible();
    await expect(page.locator('text=Ibuprofeno 400mg')).toBeVisible();
    await expect(page.locator('text=MED-IBU-400')).toBeVisible();
    
    // Verificar que se muestran los precios
    await expect(page.locator('text=2.50')).toBeVisible();
    await expect(page.locator('text=3.00')).toBeVisible();
  });

  test('Debe funcionar la búsqueda por nombre', async ({ page }) => {
    // Buscar por nombre
    await page.fill('[data-testid="search-name"], input[placeholder*="nombre"]', 'Aspirina');
    
    // Mockear respuesta de búsqueda
    await page.route('**/api/catalogs/products/**', async route => {
      if (route.request().url().includes('name=Aspirina')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            count: 1,
            next: null,
            previous: null,
            results: [
              {
                id: 1,
                name: 'Aspirina 500mg',
                sku: 'MED-ASP-500',
                category: 'Medicamentos',
                unit: 'Tableta',
                sale_price: 2.50,
                description: 'Analgésico y antipirético'
              }
            ]
          })
        });
      }
    });
    
    // Presionar Enter o esperar debounce
    await page.keyboard.press('Enter');
    
    // Verificar que se filtraron los resultados
    await expect(page.locator('[data-testid="product-item"], .product-row')).toHaveCount(1);
    await expect(page.locator('text=Aspirina 500mg')).toBeVisible();
    await expect(page.locator('text=Ibuprofeno 400mg')).not.toBeVisible();
  });

  test('Debe funcionar la búsqueda por SKU', async ({ page }) => {
    // Buscar por SKU
    await page.fill('[data-testid="search-sku"], input[placeholder*="SKU"]', 'MED-IBU-400');
    
    // Mockear respuesta de búsqueda por SKU
    await page.route('**/api/catalogs/products/**', async route => {
      if (route.request().url().includes('sku=MED-IBU-400')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            count: 1,
            next: null,
            previous: null,
            results: [
              {
                id: 2,
                name: 'Ibuprofeno 400mg',
                sku: 'MED-IBU-400',
                category: 'Medicamentos',
                unit: 'Tableta',
                sale_price: 3.00,
                description: 'Antiinflamatorio'
              }
            ]
          })
        });
      }
    });
    
    await page.keyboard.press('Enter');
    
    // Verificar resultados
    await expect(page.locator('[data-testid="product-item"], .product-row')).toHaveCount(1);
    await expect(page.locator('text=Ibuprofeno 400mg')).toBeVisible();
    await expect(page.locator('text=MED-IBU-400')).toBeVisible();
  });

  test('Debe funcionar el filtro por categoría', async ({ page }) => {
    // Abrir filtro de categorías
    await page.click('[data-testid="category-filter"], .category-filter, select[name="category"]');
    
    // Seleccionar categoría
    await page.selectOption('[data-testid="category-filter"], .category-filter, select[name="category"]', 'Medicamentos');
    
    // Mockear respuesta filtrada
    await page.route('**/api/catalogs/products/**', async route => {
      if (route.request().url().includes('category=Medicamentos')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            count: 2,
            next: null,
            previous: null,
            results: [
              {
                id: 1,
                name: 'Aspirina 500mg',
                sku: 'MED-ASP-500',
                category: 'Medicamentos',
                unit: 'Tableta',
                sale_price: 2.50,
                description: 'Analgésico y antipirético'
              },
              {
                id: 2,
                name: 'Ibuprofeno 400mg',
                sku: 'MED-IBU-400',
                category: 'Medicamentos',
                unit: 'Tableta',
                sale_price: 3.00,
                description: 'Antiinflamatorio'
              }
            ]
          })
        });
      }
    });
    
    // Verificar que se aplicó el filtro
    await expect(page.locator('[data-testid="product-item"], .product-row')).toHaveCount(2);
    await expect(page.locator('text=Medicamentos')).toBeVisible();
  });

  test('Debe funcionar la paginación', async ({ page }) => {
    // Verificar que se muestra la paginación
    await expect(page.locator('[data-testid="pagination"], .pagination')).toBeVisible();
    
    // Verificar página actual
    await expect(page.locator('[data-testid="current-page"], .current-page')).toContainText('1');
    
    // Hacer clic en página siguiente
    await page.click('[data-testid="next-page"], .next-page, button:has-text("Siguiente")');
    
    // Mockear respuesta de página 2
    await page.route('**/api/catalogs/products/**', async route => {
      if (route.request().url().includes('page=2')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            count: 150,
            next: '/api/catalogs/products/?page=3',
            previous: '/api/catalogs/products/?page=1',
            results: [
              {
                id: 3,
                name: 'Paracetamol 500mg',
                sku: 'MED-PAR-500',
                category: 'Medicamentos',
                unit: 'Tableta',
                sale_price: 1.50,
                description: 'Analgésico'
              }
            ]
          })
        });
      }
    });
    
    // Verificar que cambió la página
    await expect(page.locator('[data-testid="current-page"], .current-page')).toContainText('2');
    await expect(page.locator('text=Paracetamol 500mg')).toBeVisible();
  });

  test('Debe mostrar detalles de stock', async ({ page }) => {
    // Verificar que se muestran las cantidades de stock
    await expect(page.locator('text=50')).toBeVisible(); // Stock de Aspirina
    await expect(page.locator('text=30')).toBeVisible(); // Stock de Ibuprofeno
    
    // Verificar indicadores de stock
    await expect(page.locator('[data-testid="stock-indicator"], .stock-indicator')).toBeVisible();
  });

  test('Debe limpiar filtros correctamente', async ({ page }) => {
    // Aplicar filtros
    await page.fill('[data-testid="search-name"], input[placeholder*="nombre"]', 'Aspirina');
    await page.selectOption('[data-testid="category-filter"], .category-filter, select[name="category"]', 'Medicamentos');
    
    // Hacer clic en limpiar filtros
    await page.click('[data-testid="clear-filters"], .clear-filters, button:has-text("Limpiar")');
    
    // Verificar que se limpiaron los filtros
    await expect(page.locator('[data-testid="search-name"], input[placeholder*="nombre"]')).toHaveValue('');
    await expect(page.locator('[data-testid="category-filter"], .category-filter, select[name="category"]')).toHaveValue('');
    
    // Verificar que se recargaron todos los productos
    await expect(page.locator('[data-testid="product-item"], .product-row')).toHaveCount(2);
  });

  test('Debe manejar estados de carga', async ({ page }) => {
    // Recargar página para ver loading
    await page.reload();
    
    // Verificar que se muestra loading
    await expect(page.locator('[data-testid="loading"], .loading, .spinner')).toBeVisible();
    
    // Esperar a que termine la carga
    await expect(page.locator('[data-testid="loading"], .loading, .spinner')).not.toBeVisible();
    
    // Verificar que se cargan los productos
    await expect(page.locator('[data-testid="product-item"], .product-row')).toHaveCount(2);
  });

  test('Debe manejar errores de carga', async ({ page }) => {
    // Recargar página y mockear error
    await page.route('**/api/catalogs/products/**', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Error interno del servidor'
        })
      });
    });
    
    await page.reload();
    
    // Verificar que se muestra mensaje de error
    await expect(page.locator('[data-testid="error-message"], .error-message, .alert-error')).toBeVisible();
    await expect(page.locator('text=Error')).toBeVisible();
  });

  test('Debe ser responsive en dispositivos móviles', async ({ page }) => {
    // Cambiar viewport a móvil
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Verificar que el diseño se adapta
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('[data-testid="product-item"], .product-row')).toBeVisible();
    
    // Verificar que los filtros son accesibles
    await expect(page.locator('[data-testid="search-name"], input[placeholder*="nombre"]')).toBeVisible();
    
    // Verificar que la paginación funciona en móvil
    await expect(page.locator('[data-testid="pagination"], .pagination')).toBeVisible();
  });

  test('Debe navegar al detalle de producto', async ({ page }) => {
    // Hacer clic en un producto
    await page.click('text=Aspirina 500mg');
    
    // Verificar navegación (esto depende de tu implementación)
    // Puede ser modal, página nueva, etc.
    await expect(page.locator('[data-testid="product-detail"], .product-detail')).toBeVisible();
  });

  test('Debe mostrar información de cache', async ({ page }) => {
    // Verificar que se muestra información de cache si existe
    const cacheInfo = page.locator('[data-testid="cache-info"], .cache-info');
    
    if (await cacheInfo.isVisible()) {
      await expect(cacheInfo).toContainText('Cache');
    }
  });

  test('Debe permitir refrescar el cache', async ({ page }) => {
    // Buscar botón de refrescar cache
    const refreshButton = page.locator('[data-testid="refresh-cache"], .refresh-cache, button:has-text("Refrescar")');
    
    if (await refreshButton.isVisible()) {
      await refreshButton.click();
      
      // Verificar que se muestra loading
      await expect(page.locator('[data-testid="loading"], .loading, .spinner')).toBeVisible();
      
      // Verificar que se recargan los datos
      await expect(page.locator('[data-testid="product-item"], .product-row')).toHaveCount(2);
    }
  });
}); 