# UNIDENTAL — Frontend

[English](README.md) · **Español**

Aplicación web de gestión de UNIDENTAL, distribuidora de insumos dentales que opera desde dos sedes en Cali, Colombia. Inventario, ventas, órdenes de compra, traslados entre sedes, devoluciones, créditos y reportería — construida con React 19 y Vite, desplegada en Vercel contra un backend Django en Render.

🔗 **En vivo:** https://unidental-frontend.vercel.app
🔗 **Backend:** [unidental-backend](https://github.com/JuanPabloAnteSuarez03/unidental-backend) · [Documentación de la API](https://unidental-backend.onrender.com/swagger/)

---

## Funcionalidades

- **Inventario** con filtros, búsqueda, paginación y vista dedicada por sede (Sur / Norte) con tabla y paginación propias
- **Ventas** con selector de productos, jerarquía de precios y control de lotes — FIFO automático o distribución manual por lote
- **Alertas de vencimiento** con umbral configurable por producto
- **Órdenes de compra** de punta a punta: opciones de compra por proveedor, pagos, lista de items y comparador de proveedores
- **Devoluciones, movimientos de stock y traslados entre sedes**
- **Créditos de ventas** y gestión de cobranza
- **Reportería** de compras y ventas, con detalle por transacción
- **Autenticación**, perfiles y creación de usuarios
- **SKU**: generación y validación
- **Estrategia de caché** persistente e in-memory, con controles de refresco donde importa

---

## Stack

| Aspecto | Tecnología |
|---|---|
| Framework | React 19, Vite |
| Ruteo | React Router DOM 7, con `ProtectedRoute` |
| Estilos | TailwindCSS |
| HTTP | Axios |
| Iconos | react-icons |
| Estado | React Context (`AuthContext`, `ProductsContext`, `CustomersContext`, `ReportesContext`) |
| Pruebas unitarias / integración | Jest, Testing Library, MSW |
| E2E | Playwright |
| Accesibilidad | axe |
| Hosting | Vercel |

La arquitectura está orientada a módulos: componentes autocontenidos en `src/components`, páginas en `src/pages`, lógica de datos en `src/hooks` y acceso a datos en `src/services`. `src/config/api.js` centraliza `BASE_URL` y `ENDPOINTS`.

---

## Puesta en marcha

**Requisitos:** Node.js 18+ y npm.

```bash
npm install
npm run dev            # http://localhost:5173
```

Por defecto la app apunta al backend desplegado (`https://unidental-backend.onrender.com/api`, ver `src/config/api.js`). Para apuntar a un backend local hay que definir `VITE_API_URL` — Vite hace proxy de `/api` hacia ahí en desarrollo (ver `vite.config.js`).

```bash
# .env
VITE_API_URL=http://127.0.0.1:8000
```

### Scripts

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo de Vite |
| `npm run build` | Bundle de producción en `dist/` |
| `npm run preview` | Sirve el build en local |
| `npm run lint` | ESLint |
| `npm test` | Jest |
| `npm run test:coverage` | Jest con cobertura |
| `npm run test:unit` · `test:integration` | Suites específicas de Jest |
| `npm run test:e2e` · `test:e2e:ui` | Playwright (headless / modo UI) |
| `npm run test:critical` | Los tres flujos críticos: ventas, compras, devoluciones |
| `npm run test:accessibility` | axe + Jest |
| `npm run test:visual` | Regresión visual con Playwright |
| `npm run test:api` · `test:manual` · `test:monitor` | Scripts propios en `scripts/` |
| `npm run test:quick` · `test:practical` · `test:all` | Atajos combinados |

Ver `README-TESTING.md` para la guía completa de testing.

---

## Flujos clave

**Inventario y paginación.** `useInventory` coordina carga, filtros y paginación. `usePagination` normaliza `currentPage`/`totalPages` (mínimo 1) y evita el rebote a la página 1 después de un salto directo. Al filtrar por sede, `InventoryContentByLocation` renderiza una tabla alternativa con su propia paginación contra un endpoint dedicado.

**Control de lotes en ventas.** El modo automático (FIFO) descuenta lotes por orden de vencimiento. En modo manual el usuario distribuye cantidades por lote; el campo de cantidad global se bloquea y el total pasa a ser la suma de lo ingresado a mano.

**Jerarquía de precios.** Las ventas resuelven el precio en este orden:

1. Precio de venta sugerido (`sale_price`)
2. Último precio de venta
3. Último precio de compra
4. Costo

La fuente activa se le muestra al usuario en `src/components/Sales/PriceSourceLegend.jsx`.

**Alertas de vencimiento.** `AlertasPage` lista lo próximo a vencer y lo ya vencido, con un modal para configurar el umbral por producto y un botón *Limpiar Caché* para que una caché obsoleta nunca induzca a error al operar con lotes.

---

## Caché

Las listas pesadas (productos, inventario, precios de compra) se cachean en `localStorage`, con caché in-memory para respuestas intermedias y TTL configurable por módulo. Como una caché obsoleta es activamente dañina al operar con lotes, hay controles de refresco donde importa — un botón *Actualizar* en `ProductSearchSelector` y *Limpiar Caché* en la vista de alertas.

---

## Testing

El umbral de cobertura es **80% global** (`jest.coverageThreshold` en `package.json`). Los reportes se centralizan en `test-results/`. La configuración de Lighthouse está en `lighthouserc.js`.

---

## Despliegue

Vercel, configurado en `vercel.json`:

- `/api/(.*)` se reescribe hacia el backend en Render
- Fallback de SPA a `index.html`
- Build: `npm run build` → `dist/`

---

## Estructura del proyecto

```
src/
├─ components/           UI modular (Inventario, Ventas, Compras, Reportes, ...)
├─ pages/                Páginas de alto nivel
├─ services/             Integraciones con la API (inventory, sales, returns, purchases, transfers, ...)
├─ context/              Contextos globales (Auth, Products, Customers, Reportes)
├─ hooks/                Lógica reutilizable (useInventory, usePagination, useProductSearch, ...)
├─ router/               Ruteo y rutas protegidas
├─ config/               Configuración central (API, compañía)
└─ utils/                Utilidades (fechas, etc.)
```

---

## Contribución

1. Crear branch: `git checkout -b feature/<nombre>`
2. Implementar y agregar las pruebas relevantes
3. Ejecutar `npm run test:quick` (o `npm run test:all`)
4. Mantener cobertura ≥ 80% y el linter limpio: `npm run lint`
5. Abrir un PR describiendo el cambio y sus riesgos

---

## Sobre el proyecto

Desarrollado por [Juan Pablo Ante Suárez](https://github.com/JuanPabloAnteSuarez03). Implementé gran parte de este frontend junto a un compañero, sobre la API del backend que ya había diseñado y construido.

📖 **Caso de estudio completo:** [juanpabloante.vercel.app/es/projects/unidental](https://juanpabloante.vercel.app/es/projects/unidental)

---

Privado · © UNIDENTAL. Todos los derechos reservados.
