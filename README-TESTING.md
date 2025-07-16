# 🧪 Sistema de Testing Comprehensive - Unidental Frontend

## Descripción General

Este sistema de testing comprehensive está diseñado para detectar todos los tipos de fallos posibles en la aplicación Unidental Frontend. Incluye testing unitario, de integración, E2E, accesibilidad, performance, visual y de seguridad.

## 🚀 Inicio Rápido

```bash
# Instalar dependencias
npm install

# Ejecutar todas las pruebas
npm run test:all

# Ejecutar pruebas específicas
npm run test:unit
npm run test:e2e
npm run test:performance
```

## 📋 Tipos de Testing Implementados

### 1. **Testing Unitario** 🔧
- **Comando**: `npm run test:unit`
- **Herramienta**: Jest + Testing Library
- **Cobertura**: Componentes, servicios, hooks
- **Umbral**: 80% cobertura mínima

### 2. **Testing de Integración** 🔗
- **Comando**: `npm run test:integration`
- **Herramienta**: Jest + MSW
- **Cobertura**: Flujos entre componentes
- **Foco**: Interacciones complejas

### 3. **Testing E2E** 🌐
- **Comando**: `npm run test:e2e`
- **Herramienta**: Playwright
- **Cobertura**: Flujos críticos completos
- **Navegadores**: Chrome, Firefox, Safari

### 4. **Testing de Accesibilidad** ♿
- **Comando**: `npm run test:accessibility`
- **Herramienta**: axe-core + Playwright
- **Cobertura**: WCAG 2.1 AA compliance
- **Navegación**: Keyboard, screen readers

### 5. **Testing de Performance** ⚡
- **Comando**: `npm run test:performance`
- **Herramienta**: Lighthouse CI
- **Métricas**: LCP, FID, CLS, TTI
- **Umbral**: Score > 80

### 6. **Testing Visual** 👁️
- **Comando**: `npm run test:visual`
- **Herramienta**: Playwright Screenshots
- **Cobertura**: Regresión visual
- **Dispositivos**: Desktop, mobile, tablet

### 7. **Testing de Seguridad** 🔒
- **Comando**: `npm run test:security`
- **Herramienta**: npm audit + Snyk
- **Cobertura**: Vulnerabilidades conocidas
- **Dependencias**: Actualizaciones de seguridad

### 8. **Testing de Carga** 📈
- **Comando**: `npm run test:stress`
- **Herramienta**: Artillery
- **Cobertura**: Resistencia bajo carga
- **Escenarios**: 5-200 usuarios concurrentes

## 🎯 Ejecución de Pruebas

### Comandos Principales

```bash
# Ejecutar todas las pruebas con reporte
npm run test:all

# Ejecutar pruebas y generar reporte HTML
npm run test:monitor

# Ejecutar pruebas críticas únicamente
npm run test:unit && npm run test:integration && npm run test:e2e

# Ejecutar pruebas específicas
npm run test:unit                    # Pruebas unitarias
npm run test:integration             # Pruebas de integración
npm run test:e2e                     # Pruebas E2E
npm run test:accessibility           # Pruebas de accesibilidad
npm run test:performance            # Pruebas de performance
npm run test:visual                 # Pruebas visuales
npm run test:security               # Auditoría de seguridad
npm run test:stress                 # Pruebas de carga
npm run test:bundle                 # Verificar tamaño de bundle
```

### Opciones Avanzadas

```bash
# Ejecutar con cobertura detallada
npm run test:coverage

# Ejecutar en modo watch
npm run test:watch

# Ejecutar con interfaz gráfica (E2E)
npm run test:e2e:ui

# Ejecutar suite específica
node scripts/test-monitor.js --suite=unit

# Ejecutar sin pruebas críticas
node scripts/test-monitor.js --skip-critical
```

## 📊 Interpretación de Resultados

### Reporte HTML
- **Ubicación**: `./test-results/comprehensive-test-report.html`
- **Contenido**: Resumen visual, métricas, fallos detallados
- **Actualización**: Cada ejecución completa

### Reporte JSON
- **Ubicación**: `./test-results/test-results.json`
- **Contenido**: Datos estructurados para CI/CD
- **Uso**: Integración con herramientas externas

### Métricas Clave
- **Tasa de Éxito**: % de pruebas que pasan
- **Fallos Críticos**: Errores que bloquean deployment
- **Cobertura de Código**: % de código probado
- **Performance Score**: Puntuación de Lighthouse

## 🔍 Casos de Prueba Críticos

### Flujo de Autenticación
```javascript
// tests/e2e/auth.spec.js
- Login exitoso
- Credenciales inválidas
- Token expirado
- Persistencia de sesión
- Logout seguro
```

### Flujo de Inventario
```javascript
// tests/e2e/inventory.spec.js
- Carga de productos
- Búsqueda y filtros
- Paginación
- Gestión de stock
- Manejo de errores
```

### Flujo de Ventas
```javascript
// tests/integration/sales-flow.test.js
- Proceso completo de venta
- Cálculos de totales
- Métodos de pago
- Manejo de stock
- Generación de factura
```

### Accesibilidad
```javascript
// tests/accessibility/accessibility.spec.js
- Navegación por teclado
- Lectores de pantalla
- Contraste de colores
- Estructura semántica
- Manejo de errores accesible
```

## 🛠️ Configuración y Personalización

### Configuración de Jest
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### Configuración de Playwright
```javascript
// playwright.config.js
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  retries: 2,
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } }
  ]
});
```

### Configuración de Lighthouse
```javascript
// lighthouserc.js
module.exports = {
  ci: {
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }]
      }
    }
  }
};
```

## 🚦 Integración CI/CD

### GitHub Actions
```yaml
# .github/workflows/test.yml
name: Testing Comprehensive
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:all
      - uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: test-results/
```

### Pre-commit Hooks
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:unit && npm run test:integration",
      "pre-push": "npm run test:e2e"
    }
  }
}
```

## 📈 Métricas y Monitoreo

### Métricas de Calidad
- **Cobertura de Código**: >80% en todas las categorías
- **Tasa de Éxito**: >95% en pruebas críticas
- **Performance Score**: >80 en Lighthouse
- **Accesibilidad**: 100% WCAG AA compliance

### Alertas Automáticas
- **Fallos Críticos**: Bloquean deployment
- **Degradación Performance**: Score <80
- **Vulnerabilidades**: Nuevas dependencias inseguras
- **Cobertura Baja**: <80% en cualquier categoría

## 🐛 Debugging y Solución de Problemas

### Problemas Comunes

#### Tests E2E Fallan
```bash
# Ejecutar con UI para debugging
npm run test:e2e:ui

# Verificar que el servidor esté corriendo
npm run dev

# Revisar logs detallados
DEBUG=pw:api npm run test:e2e
```

#### Tests Unitarios Lentos
```bash
# Ejecutar con más workers
npm run test:unit -- --maxWorkers=4

# Ejecutar tests específicos
npm run test:unit -- --testNamePattern="AuthContext"
```

#### Fallos de Performance
```bash
# Analizar bundle
npm run test:bundle

# Revisar métricas detalladas
npm run test:lighthouse
```

### Logs y Debugging
```bash
# Logs detallados
DEBUG=* npm run test:monitor

# Logs de errores únicamente
npm run test:monitor 2> errors.log

# Reporte de cobertura detallado
npm run test:coverage -- --verbose
```

## 📝 Agregar Nuevas Pruebas

### Estructura de Archivos
```
tests/
├── unit/           # Pruebas unitarias
├── integration/    # Pruebas de integración
├── e2e/           # Pruebas end-to-end
├── accessibility/ # Pruebas de accesibilidad
├── visual/        # Pruebas visuales
└── load/          # Pruebas de carga
```

### Ejemplo de Test Unitario
```javascript
// tests/unit/components/Button.test.js
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from '../../../src/components/Button';

test('debe renderizar y manejar click', async () => {
  const handleClick = jest.fn();
  render(<Button onClick={handleClick}>Click me</Button>);
  
  const button = screen.getByRole('button');
  await userEvent.click(button);
  
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

### Ejemplo de Test E2E
```javascript
// tests/e2e/new-feature.spec.js
import { test, expect } from '@playwright/test';

test('debe funcionar nueva característica', async ({ page }) => {
  await page.goto('/nueva-feature');
  
  await expect(page.locator('h1')).toContainText('Nueva Feature');
  
  await page.click('button[data-testid="action-button"]');
  
  await expect(page.locator('.success-message')).toBeVisible();
});
```

## 🎭 Mocks y Fixtures

### Configuración de MSW
```javascript
// tests/__mocks__/handlers.js
import { rest } from 'msw';

export const handlers = [
  rest.get('/api/products', (req, res, ctx) => {
    return res(ctx.json({ products: [] }));
  })
];
```

### Fixtures de Datos
```javascript
// tests/__fixtures__/products.js
export const mockProducts = [
  { id: 1, name: 'Producto Test', price: 10.00 },
  { id: 2, name: 'Producto Test 2', price: 20.00 }
];
```

## 🔧 Mantenimiento

### Actualización de Dependencias
```bash
# Actualizar herramientas de testing
npm update @playwright/test jest @testing-library/react

# Verificar compatibilidad
npm run test:all

# Actualizar snapshots si es necesario
npm run test:unit -- --updateSnapshot
```

### Limpieza de Archivos
```bash
# Limpiar resultados anteriores
rm -rf test-results/

# Limpiar cache de Jest
npm run test:unit -- --clearCache

# Limpiar cache de Playwright
npx playwright cache clear
```

## 📞 Soporte y Contribución

### Reportar Problemas
- **GitHub Issues**: Para bugs del sistema de testing
- **Slack**: #testing-support para soporte rápido
- **Email**: testing@unidental.com

### Contribuir
1. Fork del repositorio
2. Crear branch: `git checkout -b feature/new-test`
3. Implementar pruebas siguiendo las convenciones
4. Ejecutar `npm run test:all`
5. Crear Pull Request

## 📚 Recursos Adicionales

### Documentación
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Testing Library](https://testing-library.com/docs/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)

### Mejores Prácticas
- Escribir tests antes del código (TDD)
- Mantener tests simples y legibles
- Usar mocks apropiadamente
- Revisar cobertura regularmente
- Actualizar tests con cambios de código

---

**Versión**: 1.0.0  
**Última actualización**: Enero 2025  
**Mantenido por**: Equipo de QA Unidental 