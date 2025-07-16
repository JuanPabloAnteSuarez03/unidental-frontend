import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/visual',
  
  // Configuración específica para testing visual
  fullyParallel: false, // Evitar problemas de concurrencia en screenshots
  
  retries: process.env.CI ? 1 : 0,
  workers: 1, // Un solo worker para consistencia visual
  
  reporter: [
    ['html', { outputFolder: 'test-results/visual-report' }],
    ['json', { outputFile: 'test-results/visual-results.json' }],
  ],
  
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    
    // Configuración específica para screenshots
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Configuración de viewport consistente
    viewport: { width: 1280, height: 720 },
    
    // Configuración para consistencia visual
    headless: true,
    colorScheme: 'light',
    
    // Configuración de animaciones para testing visual
    reducedMotion: 'reduce',
    
    // Configuración de fuentes para consistencia
    fontFamily: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    
    // Configuración de timeout más alto para cargas de página
    actionTimeout: 15000,
  },

  projects: [
    {
      name: 'visual-desktop',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    {
      name: 'visual-mobile',
      use: { 
        ...devices['iPhone 12'],
        viewport: { width: 390, height: 844 }
      },
    },
    {
      name: 'visual-tablet',
      use: { 
        ...devices['iPad Pro'],
        viewport: { width: 1024, height: 768 }
      },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  // Configuración específica para screenshots
  expect: {
    toHaveScreenshot: { 
      threshold: 0.2,
      mode: 'strict',
      animations: 'disabled',
      caret: 'hide'
    },
    toMatchSnapshot: { 
      threshold: 0.2,
      mode: 'strict'
    },
  },
}); 