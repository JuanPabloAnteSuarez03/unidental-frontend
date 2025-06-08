// src/config/api.js

// Configuración centralizada para endpoints API
const API_CONFIG = {
    // En desarrollo, usar el proxy de Vite (/api)
    // En producción, usar la URL completa
    BASE_URL: import.meta.env.DEV 
        ? "/api" 
        : (import.meta.env.VITE_API_URL || "https://unidental-backend-production.up.railway.app/api"),

    // Endpoints específicos
    ENDPOINTS: {
        LOGIN: "/auth/token/login/",
        LOGOUT: "/auth/token/logout/",
        USER_PROFILE: "/auth/users/me/",
        RESET_PASSWORD: "/auth/users/reset_password/",
        RESET_PASSWORD_CONFIRM: "/auth/users/reset_password_confirm/",
        INVENTORY: "/catalogs/products/",
        STOCK_SUMMARY: "/inventory/stock/summary/",
        STOCK: "/inventory/stock/",
        CATEGORIES: "/catalogs/categories/",
        INVENTORY_MOVEMENTS: "/inventory/movements/",
        LOCATIONS: "/inventory/locations/",
    },
};

export default API_CONFIG;