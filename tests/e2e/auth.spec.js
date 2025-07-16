import { test, expect } from '@playwright/test';

test.describe('Autenticación', () => {
  test.beforeEach(async ({ page }) => {
    // Configuración inicial para cada test
    await page.goto('/');
  });

  test('Debe redirigir a login cuando no está autenticado', async ({ page }) => {
    // Verificar que se redirige a la página de login
    await expect(page).toHaveURL('/login');
    
    // Verificar elementos clave de la página de login
    await expect(page.locator('h1')).toContainText('Iniciar Sesión');
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('Debe mostrar error con credenciales inválidas', async ({ page }) => {
    await page.goto('/login');
    
    // Intentar login con credenciales inválidas
    await page.fill('input[name="username"]', 'usuario_invalido');
    await page.fill('input[name="password"]', 'contraseña_invalida');
    await page.click('button[type="submit"]');
    
    // Verificar que se muestra mensaje de error
    await expect(page.locator('.error-message, .alert-error, [data-testid="error"]')).toBeVisible();
    
    // Verificar que sigue en la página de login
    await expect(page).toHaveURL('/login');
  });

  test('Debe autenticarse correctamente y redirigir a inventario', async ({ page }) => {
    await page.goto('/login');
    
    // Mockear la respuesta de login exitosa
    await page.route('**/api/auth/token/login/', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          auth_token: 'mock_token_123456'
        })
      });
    });
    
    // Mockear la respuesta del perfil de usuario
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
    
    // Realizar login
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    
    // Verificar redirección a inventario
    await expect(page).toHaveURL('/inventario');
    
    // Verificar que se muestra el header de la aplicación
    await expect(page.locator('h1')).toContainText('Sistema de Gestión');
  });

  test('Debe persistir la sesión después del refresh', async ({ page }) => {
    // Simular que ya hay un token en localStorage
    await page.goto('/login');
    
    await page.evaluate(() => {
      localStorage.setItem('authToken', 'mock_token_123456');
    });
    
    // Mockear la respuesta del perfil de usuario
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
    
    // Refrescar la página
    await page.reload();
    
    // Verificar que se mantiene la sesión
    await expect(page).toHaveURL('/inventario');
  });

  test('Debe cerrar sesión correctamente', async ({ page }) => {
    // Simular estado autenticado
    await page.goto('/login');
    
    await page.evaluate(() => {
      localStorage.setItem('authToken', 'mock_token_123456');
    });
    
    // Mockear respuestas
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
    
    await page.route('**/api/auth/token/logout/', async route => {
      await route.fulfill({
        status: 204
      });
    });
    
    await page.goto('/inventario');
    
    // Buscar y hacer clic en el botón de logout
    // Esto puede variar según tu implementación
    await page.click('[data-testid="logout-button"], .logout-button, button:has-text("Cerrar Sesión")');
    
    // Verificar redirección a login
    await expect(page).toHaveURL('/login');
    
    // Verificar que el token fue removido
    const token = await page.evaluate(() => localStorage.getItem('authToken'));
    expect(token).toBeNull();
  });

  test('Debe manejar token expirado', async ({ page }) => {
    // Simular token en localStorage
    await page.goto('/login');
    
    await page.evaluate(() => {
      localStorage.setItem('authToken', 'expired_token');
    });
    
    // Mockear respuesta de token expirado
    await page.route('**/api/auth/users/me/', async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          detail: 'Token expirado'
        })
      });
    });
    
    // Intentar acceder a página protegida
    await page.goto('/inventario');
    
    // Verificar que se redirige a login
    await expect(page).toHaveURL('/login');
    
    // Verificar que el token expirado fue removido
    const token = await page.evaluate(() => localStorage.getItem('authToken'));
    expect(token).toBeNull();
  });

  test('Debe mostrar loading durante el proceso de autenticación', async ({ page }) => {
    await page.goto('/login');
    
    // Mockear respuesta con delay
    await page.route('**/api/auth/token/login/', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          auth_token: 'mock_token_123456'
        })
      });
    });
    
    // Llenar formulario
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'testpass123');
    
    // Hacer clic en submit
    await page.click('button[type="submit"]');
    
    // Verificar que se muestra loading
    await expect(page.locator('.loading, .spinner, [data-testid="loading"]')).toBeVisible();
    
    // Verificar que el botón está deshabilitado
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
  });

  test('Debe validar campos requeridos', async ({ page }) => {
    await page.goto('/login');
    
    // Intentar enviar formulario vacío
    await page.click('button[type="submit"]');
    
    // Verificar validación HTML5 o mensajes de error
    const usernameInput = page.locator('input[name="username"]');
    const passwordInput = page.locator('input[name="password"]');
    
    await expect(usernameInput).toHaveAttribute('required');
    await expect(passwordInput).toHaveAttribute('required');
    
    // Verificar que no se envía la petición
    await expect(page).toHaveURL('/login');
  });

  test('Debe manejar errores de red', async ({ page }) => {
    await page.goto('/login');
    
    // Mockear error de red
    await page.route('**/api/auth/token/login/', async route => {
      await route.abort('failed');
    });
    
    // Llenar formulario
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    
    // Verificar que se muestra mensaje de error de red
    await expect(page.locator('.error-message, .alert-error, [data-testid="error"]')).toBeVisible();
  });

  test('Debe recordar la página a la que se intentó acceder', async ({ page }) => {
    // Intentar acceder directamente a una página protegida
    await page.goto('/ventas');
    
    // Verificar que se redirige a login
    await expect(page).toHaveURL('/login');
    
    // Simular login exitoso
    await page.route('**/api/auth/token/login/', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          auth_token: 'mock_token_123456'
        })
      });
    });
    
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
    
    // Realizar login
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    
    // Verificar que se redirige a la página original
    await expect(page).toHaveURL('/ventas');
  });
}); 