import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Directorio donde están los tests E2E
  testDir: './tests/e2e',
  
  // Configuración de paralelización
  fullyParallel: true,
  
  // Fallar si se dejan tests marcados como only
  forbidOnly: !!process.env.CI,
  
  // Reintentos en CI
  retries: process.env.CI ? 2 : 0,
  
  // Número de workers en paralelo
  workers: process.env.CI ? 1 : undefined,
  
  // Configuración de reportes
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list']
  ],
  
  // Configuración global para todos los tests
  use: {
    // URL base de la aplicación
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    
    // Configuración de trazado para debugging
    trace: 'on-first-retry',
    
    // Screenshots solo en fallos
    screenshot: 'only-on-failure',
    
    // Videos solo en fallos
    video: 'retain-on-failure',
    
    // Configuración de timeout
    actionTimeout: 10000,
    
    // Configuración de navegador
    headless: true,
    
    // Configuración de viewport
    viewport: { width: 1280, height: 720 },
    
    // Ignorar errores de HTTPS
    ignoreHTTPSErrors: true,
    
    // Configuración de accesibilidad
    colorScheme: 'light',
  },

  // Configuración de proyectos (diferentes navegadores/dispositivos)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Solo en CI ejecutamos todos los navegadores
    ...(process.env.CI ? [
      {
        name: 'firefox',
        use: { ...devices['Desktop Firefox'] },
      },
      {
        name: 'webkit',
        use: { ...devices['Desktop Safari'] },
      },
      {
        name: 'mobile-chrome',
        use: { ...devices['Pixel 5'] },
      },
      {
        name: 'mobile-safari',
        use: { ...devices['iPhone 12'] },
      },
      {
        name: 'tablet',
        use: { ...devices['iPad Pro'] },
      },
    ] : []),
  ],

  // Configuración del servidor de desarrollo
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  // Configuración de timeouts globales
  globalTimeout: 60 * 60 * 1000, // 1 hora
  timeout: 30 * 1000, // 30 segundos por test
  
  // Configuración de espera
  expect: {
    timeout: 5000,
    toHaveScreenshot: { threshold: 0.3 },
    toMatchSnapshot: { threshold: 0.3 },
  },
}); 