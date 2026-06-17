## UNIDENTAL Frontend

Aplicación web de gestión para UNIDENTAL. Incluye inventario, ventas, órdenes de compra, transferencias internas, devoluciones, créditos, reportes avanzados y un completo sistema de pruebas. Construido con React 19 + Vite 6 y desplegado en Vercel, consumiendo un backend en Render.

### Tabla de contenidos
- [Características principales](#características-principales)
- [Stack y arquitectura](#stack-y-arquitectura)
- [Configuración de entorno](#configuración-de-entorno)
- [Instalación y ejecución](#instalación-y-ejecución)
- [Scripts disponibles](#scripts-disponibles)
- [Dominios clave y flujos](#dominios-clave-y-flujos)
- [Pruebas y calidad](#pruebas-y-calidad)
- [Despliegue](#despliegue)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Solución de problemas](#solución-de-problemas)
- [Contribución](#contribución)

---

### Características principales
- Inventario con filtros, búsqueda, paginación y vista por sede (Sur/Norte) con tabla dedicada y paginación propia.
- Ventas con selector de productos, jerarquía inteligente de precios y control de lotes (FIFO automático y selección manual por lote).
- Alertas de vencimiento y configuración de umbrales por producto.
- Órdenes de compra completas (opciones de compra por proveedor, pagos, lista de items, comparador de proveedores).
- Devoluciones, movimientos de stock y transferencias internas entre sedes.
- Créditos de ventas y gestión de cobranza.
- Reportería avanzada de compras y ventas con detalles por transacción.
- Autenticación, perfiles y creación de usuarios (con toggle de visibilidad de contraseña).
- Generación y validación de SKU.
- Estrategia de caché persistente e in‑memory para rendimiento, con botones de refresco donde importa.

---

### Stack y arquitectura
- **Frontend**: React 19, Vite 6, React Router DOM 7, TailwindCSS.
- **Iconos**: `react-icons`.
- **Estado global**: React Context API (`AuthContext`, `ProductsContext`, `CustomersContext`, `ReportesContext`).
- **Ruteo**: `src/router` con `ProtectedRoute` para rutas autenticadas.
- **Servicios API**: `src/services/*` (e.g., `inventoryService.js`, `salesService.js`, `returnsService.js`, `purchasesService.js`, `transfersService.js`).
- **Hooks**: `useInventory`, `usePagination`, `useProductSearch`, `useKeepBackendAwake`, entre otros.
- **Configuración API**: `src/config/api.js` define `BASE_URL` y `ENDPOINTS` centrales.

Arquitectura orientada a módulos con componentes autocontenidos en `src/components`, páginas en `src/pages`, lógica de datos en `src/hooks` y acceso a datos en `src/services`.

---

### Configuración de entorno
- Backend por defecto: `https://unidental-backend.onrender.com/api` (ver `src/config/api.js`).
- Desarrollo: Vite expone un proxy para `/api` hacia `VITE_API_URL` (ver `vite.config.js`).

Variables de entorno soportadas:
- `VITE_API_URL` (opcional, solo desarrollo): URL base del backend para el proxy de Vite.

---

### Instalación y ejecución
1) Requisitos
- Node.js 18+ y npm

2) Instalación
```bash
npm install
```

3) Desarrollo (puerto 3000)
```bash
npm run dev
```

4) Build producción y preview
```bash
npm run build
npm run preview
```

5) Lint
```bash
npm run lint
```

---

### Scripts disponibles
Desde `package.json`:
- `dev`: Levanta el entorno de desarrollo con Vite.
- `build`: Genera el bundle de producción en `dist/`.
- `preview`: Sirve el build localmente.
- `lint`: Ejecuta ESLint.
- `test`, `test:watch`, `test:coverage`, `test:ci`: Pruebas con Jest.
- `test:unit`, `test:integration`: Suites específicas de Jest.
- `test:e2e`, `test:e2e:dev`, `test:e2e:ui`: Pruebas E2E con Playwright.
- `test:accessibility`: Accesibilidad con axe + Jest.
- `test:visual`: Regresión visual con Playwright.
- `test:api`: Pruebas de API (scripts personalizados).
- `test:manual`: Guía de pruebas manuales (scripts personalizados).
- `test:quick`, `test:practical`: Atajos combinados.
- `test:monitor`: Ejecuta pruebas y genera reportes consolidados.

Ver también `README-TESTING.md` para detalles extensos de testing y CI.

---

### Dominios clave y flujos

1) Inventario y paginación
- Hook `useInventory` coordina carga, filtros y paginación.
- Hook `usePagination` normaliza `currentPage`/`totalPages` (mínimo 1) y previene “rebotes” a página 1 tras saltos directos.
- El componente `InventoryContentByLocation` renderiza una tabla alternativa cuando se filtra por sede, con su propia paginación conectada a un endpoint dedicado.

2) Filtro por ubicación (Sur/Norte)
- Vista dedicada que consume `inventoryService.getProductsByLocation` (`/api/catalogs/products/by-location/`).
- Carga en paralelo de stock por producto y mapeo de precio de compra desde el caché global para mantener paridad con la tabla estándar.

3) Control de lotes en ventas
- Modo automático (FIFO) para descontar lotes, priorizando el más reciente.
- Modo manual: el usuario distribuye cantidades por lote; el campo de cantidad global se bloquea y la cantidad total es la suma manual.

4) Jerarquía de precios en ventas
Orden de prioridad:
1. Precio de venta sugerido (`sale_price` del producto)
2. Último precio de venta
3. Último precio de compra
4. Costo
La leyenda se muestra en `src/components/Sales/PriceSourceLegend.jsx`.

5) Alertas de vencimiento y umbrales
- Página `AlertasPage` para listar próximos a vencer y vencidos.
- Modal para configurar umbral por producto.
- Botón “Limpiar Caché” para evitar efectos de caché obsoleta al operar con lotes.

6) Compras y proveedores
- Órdenes de compra con flujo completo: selección de proveedores, opciones de compra, detalle de items y pagos.

7) Movimientos, devoluciones y transferencias
- Módulos para entradas/salidas múltiples, devoluciones por venta y transferencias entre sedes con sus tablas y filtros.

8) Reportes
- Panel de reportes de compras y ventas con desgloses, totales y modales de detalle.

9) Autenticación y usuarios
- Inicio de sesión, perfiles y creación de usuarios.
- Toggle de visibilidad de contraseña en formularios de login y creación de usuario.

10) SKUs
- Generación, validación y utilidades para sistemas de SKU.

---

### Estrategia de caché
- Caché persistente en `localStorage` para listas pesadas (productos, inventario, precios de compra) y caché in‑memory para respuestas intermedias.
- Botones de refresco donde impacta al usuario:
  - En selectores de producto (`ProductSearchSelector`), botón “Actualizar” para limpiar caché y recargar.
  - En alertas, “Limpiar Caché” para forzar relectura.
- Invalidación controlada al navegar o forzar refresh; TTL configurable por módulo.

---

### Pruebas y calidad
- Unitarias e integración (Jest + Testing Library, MSW).
- E2E (Playwright) con UI opcional.
- Accesibilidad con axe.
- Visual regression (Playwright).
- Umbrales de cobertura: 80% global (ver `package.json` → `jest.coverageThreshold`).
- Reportes centralizados en `test-results/` y guía en `README-TESTING.md`.

---

### Despliegue
- Objetivo: Vercel.
- Rewrites en `vercel.json`:
  - `/api/(.*)` → backend en Render (`https://unidental-backend.onrender.com/api/$1`).
  - SPA fallback a `index.html`.
- Build command: `npm run build`
- Output: `dist/`
- Variables recomendadas en Vercel: `VITE_API_URL` si se requiere proxy diferenciado.

---

### Estructura del proyecto
```
src/
├─ components/           # UI modular (Inventario, Ventas, Compras, Reportes, etc.)
├─ pages/                # Páginas de alto nivel
├─ services/             # Integraciones API (inventory, sales, returns, purchases, transfers, ...)
├─ context/              # Contextos globales (Auth, Products, Customers, Reportes)
├─ hooks/                # Lógica reutilizable (useInventory, usePagination, useProductSearch, ...)
├─ router/               # Configuración de ruteo y rutas protegidas
├─ config/               # Configuración central (API, compañía)
└─ utils/                # Utilidades varias (fechas, etc.)
```

---

### Solución de problemas
- La paginación vuelve a página 1 al saltar a la última página
  - Asegúrate de estar en la vista correcta (por sede vs general). `usePagination` y `useInventory` previenen rebotes; limpia caché y reintenta.
- No aparecen productos recién creados en buscadores
  - Usa el botón “Actualizar” del `ProductSearchSelector` o limpia el caché desde la sección correspondiente.
- El “Precio compra” no se ve en vista por sede
  - Verifica que `InventoryContentByLocation` reciba `purchasePricesMap` desde la página de inventario (esto ya está integrado por defecto).
- Inconsistencias de stock
  - La celda `StockCell` prioriza `product.stock` cuando está presente (vistas por sede), o calcula desde `stockByLocation` como fallback.

---

### Contribución
1) Crear branch: `git checkout -b feature/nombre-feature`
2) Implementar y agregar pruebas relevantes.
3) Ejecutar suites: `npm run test:quick` o `npm run test:all`.
4) Asegurar cobertura ≥ 80% y linter sin errores: `npm run lint`.
5) Abrir Pull Request con descripción clara de cambios y riesgos.

---

Privado · © UNIDENTAL. Todos los derechos reservados.
