// src/config/api.js

// Configuración centralizada para endpoints API
const API_CONFIG = {
  // En desarrollo, usar el proxy de Vite (/api)
  // En producción, usar la URL completa
  BASE_URL: import.meta.env.DEV
    ? "/api"
    : import.meta.env.VITE_API_URL ||
      "https://unidental-backend-production.up.railway.app/api",

  // Endpoints específicos
  ENDPOINTS: {
    // Autenticación
    LOGIN: "/auth/token/login/",
    LOGOUT: "/auth/token/logout/",
    USER_PROFILE: "/auth/users/me/",
    RESET_PASSWORD: "/auth/users/reset_password/",
    RESET_PASSWORD_CONFIRM: "/auth/users/reset_password_confirm/",

    // Inventario
    INVENTORY: "/catalogs/products/",
    STOCK_SUMMARY: "/inventory/stock/summary/",
    STOCK: "/inventory/stock/",
    CATEGORIES: "/catalogs/categories/",
    INVENTORY_MOVEMENTS: "/inventory/movements/",
    LOCATIONS: "/inventory/locations/",

    // Endpoints para SKU
    SKU_GENERATE: "/catalogs/sku/generate/",
    SKU_VALIDATE: "/catalogs/sku/validate/",
    SKU_SYSTEM_INFO: "/catalogs/sku/info/",

    // Ventas - Clientes
    CUSTOMERS: "/sales/customers/",
    CUSTOMER_BY_ID: "/sales/customers/{id}/",
    CUSTOMER_SALES_HISTORY: "/sales/customers/{id}/sales_history/",

    // Ventas - Ventas
    SALES: "/sales/sales/",
    SALES_BY_ID: "/sales/sales/{id}/",
    SALES_STATISTICS: "/sales/sales/statistics/",
    SALES_TODAY: "/sales/sales/today/",

    // Ventas - Items
    SALE_ITEMS: "/sales/sale-items/",
    SALE_ITEMS_BY_ID: "/sales/sale-items/{id}/",
    SALE_ITEMS_TOP_PRODUCTS: "/sales/sale-items/top_products/",
  },
};

export default API_CONFIG;
