# UNIDENTAL — Frontend

**English** · [Español](README.es.md)

Management web app for UNIDENTAL, a dental-supplies distributor operating from two locations in Cali, Colombia. Inventory, sales, purchase orders, inter-location transfers, returns, credit accounts and reporting — built with React 19 and Vite, deployed on Vercel against a Django backend on Render.

🔗 **Live:** https://unidental-frontend.vercel.app
🔗 **Backend:** [unidental-backend](https://github.com/JuanPabloAnteSuarez03/unidental-backend) · [API docs](https://unidental-backend.onrender.com/swagger/)

---

## Features

- **Inventory** with filters, search, pagination and a dedicated per-location view (Sur / Norte) with its own table and pagination
- **Sales** with a product selector, a price hierarchy and batch control — automatic FIFO or manual per-batch distribution
- **Expiry alerts** with a configurable threshold per product
- **Purchase orders** end to end: supplier purchase options, payments, item list and a supplier comparison
- **Returns, stock movements and inter-location transfers**
- **Sales credit accounts** and collections
- **Reporting** for purchases and sales, with per-transaction detail
- **Authentication**, profiles and user creation
- **SKU** generation and validation
- **Caching strategy** — persistent and in-memory, with explicit refresh controls where it matters

---

## Stack

| Concern | Technology |
|---|---|
| Framework | React 19, Vite |
| Routing | React Router DOM 7, with `ProtectedRoute` |
| Styling | TailwindCSS |
| HTTP | Axios |
| Icons | react-icons |
| State | React Context (`AuthContext`, `ProductsContext`, `CustomersContext`, `ReportesContext`) |
| Unit / integration tests | Jest, Testing Library, MSW |
| E2E | Playwright |
| Accessibility | axe |
| Hosting | Vercel |

The architecture is module-oriented: self-contained components in `src/components`, pages in `src/pages`, data logic in `src/hooks` and data access in `src/services`. `src/config/api.js` centralizes `BASE_URL` and `ENDPOINTS`.

---

## Getting started

**Requirements:** Node.js 18+ and npm.

```bash
npm install
npm run dev            # http://localhost:5173
```

By default the app talks to the deployed backend (`https://unidental-backend.onrender.com/api`, see `src/config/api.js`). To point at a local backend, set `VITE_API_URL` — Vite proxies `/api` to it in development (see `vite.config.js`).

```bash
# .env
VITE_API_URL=http://127.0.0.1:8000
```

### Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Production bundle in `dist/` |
| `npm run preview` | Serve the build locally |
| `npm run lint` | ESLint |
| `npm test` | Jest |
| `npm run test:coverage` | Jest with coverage |
| `npm run test:unit` · `test:integration` | Targeted Jest suites |
| `npm run test:e2e` · `test:e2e:ui` | Playwright (headless / UI mode) |
| `npm run test:critical` | The three critical flows: sales, purchases, returns |
| `npm run test:accessibility` | axe + Jest |
| `npm run test:visual` | Visual regression via Playwright |
| `npm run test:api` · `test:manual` · `test:monitor` | Custom scripts in `scripts/` |
| `npm run test:quick` · `test:practical` · `test:all` | Combined shortcuts |

See `README-TESTING.md` for the full testing guide.

---

## Key flows

**Inventory and pagination.** `useInventory` coordinates loading, filters and pagination. `usePagination` normalizes `currentPage`/`totalPages` (minimum 1) and prevents the bounce back to page 1 after a direct page jump. When filtering by location, `InventoryContentByLocation` renders an alternative table with its own pagination against a dedicated endpoint.

**Batch control in sales.** Automatic FIFO mode discounts batches by expiry order. In manual mode the user distributes quantities across batches; the global quantity field locks and the total becomes the sum of the manual entries.

**Price hierarchy.** Sales resolve the price in this order:

1. Suggested sale price (`sale_price`)
2. Last sale price
3. Last purchase price
4. Cost

The active source is surfaced to the user in `src/components/Sales/PriceSourceLegend.jsx`.

**Expiry alerts.** `AlertasPage` lists what is expiring and what already expired, with a modal to set the per-product threshold and a *Clear cache* button so stale cache never misleads batch operations.

---

## Caching

Heavy lists (products, inventory, purchase prices) are cached in `localStorage`, with an in-memory cache for intermediate responses and a configurable TTL per module. Because a stale cache is actively harmful when operating on batches, refresh controls are exposed where it matters — an *Update* button in `ProductSearchSelector`, and *Clear cache* in the alerts view.

---

## Testing

Coverage threshold is **80% global** (`jest.coverageThreshold` in `package.json`). Reports are centralized in `test-results/`. Lighthouse config lives in `lighthouserc.js`.

---

## Deployment

Vercel, configured in `vercel.json`:

- `/api/(.*)` rewrites to the Render backend
- SPA fallback to `index.html`
- Build: `npm run build` → `dist/`

---

## Project structure

```
src/
├─ components/           Modular UI (Inventory, Sales, Purchases, Reports, ...)
├─ pages/                Top-level pages
├─ services/             API integrations (inventory, sales, returns, purchases, transfers, ...)
├─ context/              Global contexts (Auth, Products, Customers, Reportes)
├─ hooks/                Reusable logic (useInventory, usePagination, useProductSearch, ...)
├─ router/               Routing and protected routes
├─ config/               Central configuration (API, company)
└─ utils/                Helpers (dates, etc.)
```

---

## Contributing

1. Branch: `git checkout -b feature/<name>`
2. Implement and add the relevant tests
3. Run `npm run test:quick` (or `npm run test:all`)
4. Keep coverage ≥ 80% and the linter clean: `npm run lint`
5. Open a PR describing the change and its risks

---

## About

Built by [Juan Pablo Ante Suárez](https://github.com/JuanPabloAnteSuarez03). I implemented much of this frontend together with a teammate, on top of the backend API I had already designed and built.

📖 **Full case study:** [juanpabloante.vercel.app/en/projects/unidental](https://juanpabloante.vercel.app/en/projects/unidental)

---

Private · © UNIDENTAL. All rights reserved.
