// Mock para import.meta.env de Vite
global.import = {};
global.import.meta = {
    env: {
        DEV: false,
        VITE_API_URL: "http://test-api-url.com/api",
    },
};

// Polyfills para TextEncoder/TextDecoder en Node.js
if (typeof global.TextEncoder === "undefined") {
    global.TextEncoder = require("util").TextEncoder;
}

if (typeof global.TextDecoder === "undefined") {
    global.TextDecoder = require("util").TextDecoder;
}

// Mock específico para el archivo api.js
jest.mock(
    "./src/config/api.js",
    () => {
        return {
            __esModule: true,
            default: {
                BASE_URL: "http://test-api-url.com/api",
                ENDPOINTS: {
                    LOGIN: "/auth/token/login/",
                    LOGOUT: "/auth/token/logout/",
                    USER_PROFILE: "/auth/users/me/",
                    RESET_PASSWORD: "/auth/users/reset_password/",
                    RESET_PASSWORD_CONFIRM:
                        "/auth/users/reset_password_confirm/",
                    INVENTORY: "/catalogs/products/",
                },
            },
        };
    },
    { virtual: true }
);

// También hacemos un mock directo para cualquier componente que use import.meta
jest.mock(
    "./src/services/authService",
    () => {
        // Permitir que el módulo original exista pero con un mock para import.meta.env
        const originalModule = jest.requireActual("./src/services/authService");
        return {
            ...originalModule,
        };
    },
    { virtual: true }
);

jest.mock("./src/hooks/useInventory", () => {
    // Aquí puedes definir un comportamiento básico de useInventory que funcione para tus tests
    return {
        __esModule: true,
        default: jest.fn().mockImplementation(() => ({
            searchText: "",
            searchCode: "",
            searchCategory: "",
            sortConfig: { key: "name", direction: "ascending" },
            updateSearchText: jest.fn(),
            updateSearchCode: jest.fn(),
            updateSearchCategory: jest.fn(),
            handleSort: jest.fn(),
            clearFilters: jest.fn(),
            filteredProducts: [],
            totalProducts: 0,
            totalGeneralProducts: 0,
            isLoading: false,
            error: null,
            goToNextPage: jest.fn(),
            goToPrevPage: jest.fn(),
            goToPage: jest.fn(),
            hasNextPage: false,
            hasPrevPage: false,
            currentPage: 1,
            totalPages: 1,
        })),
    };
});
