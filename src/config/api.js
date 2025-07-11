// src/config/api.js

// Configuración centralizada para endpoints API
const API_CONFIG = {
    // En desarrollo, usar el proxy de Vite (/api)
    // En producción, usar la URL completa
    BASE_URL: import.meta.env.DEV
        ? "/api"
        : import.meta.env.VITE_API_URL ||
          "https://unidental-backend.onrender.com/api",

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
        STOCK_ALL: "/inventory/stock/all/",
        STOCK_BATCH_BY_LOCATIONS: "/inventory/stock/batch_stock_by_locations/",
        STOCK_PRODUCT_BATCHES: "/inventory/stock/product_batches_stock/",
        STOCK_LOCATION_BATCHES: "/inventory/stock/location_batch_stock/",
        CATEGORIES: "/catalogs/categories/",
        INVENTORY_MOVEMENTS: "/inventory/movements/",
        LOCATIONS: "/inventory/locations/",

        // Endpoints para SKU
        SKU_GENERATE: "/catalogs/sku/generate/",
        SKU_VALIDATE: "/catalogs/sku/validate/",
        SKU_SYSTEM_INFO: "/catalogs/sku/info/",

        // Lotes de productos
        PRODUCT_BATCHES: "/catalogs/product-batches/",
        PRODUCT_BATCHES_EXPIRED: "/catalogs/product-batches/expired/",
        PRODUCT_BATCHES_EXPIRING_SOON:
            "/catalogs/product-batches/expiring_soon/",

        // Productos compuestos
        PRODUCT_COMPONENTS: "/catalogs/product-components/",
        PRODUCT_COMPONENTS_BY_COMPOSITE:
            "/catalogs/product-components/by_composite/",
        PRODUCT_COMPONENTS_BY_COMPONENT:
            "/catalogs/product-components/by_component/",

        // Inventario avanzado
        INVENTORY_BY_BATCHES: "/inventory/movements/by_batches/",
        INVENTORY_EXPIRING_STOCK: "/inventory/movements/expiring_stock/",
        INVENTORY_EXPIRY_ALERTS: "/inventory/movements/expiry_alerts/",
        INVENTORY_BREAKDOWN_COMPOSITE:
            "/inventory/movements/breakdown_composite/",

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

        // Devoluciones
        RETURNS: "/sales/returns/",
        RETURNS_BY_ID: "/sales/returns/{id}/",
        RETURNS_STATISTICS: "/sales/returns/statistics/",
        RETURNS_TODAY: "/sales/returns/today/",
        RETURNS_BY_LOCATION: "/sales/returns/by_location/",
        RETURN_ITEMS: "/sales/return-items/",
        RETURN_ITEMS_TOP_PRODUCTS: "/sales/return-items/top_returned_products/",

        // Ventas - Créditos
        CREDITS_ACCOUNTS: "/credits/accounts/",

        // Compras - Órdenes de compra
        PURCHASE_ORDERS: "/purchases/orders/",
    },
};

export default API_CONFIG;

export const CACHE_EXPIRATION = 60 * 5;
