// Mock para import.meta.env de Vite
global.import = {};
global.import.meta = { env: { DEV: false } };

// Polyfills para TextEncoder/TextDecoder en Node.js
if (typeof global.TextEncoder === "undefined") {
    global.TextEncoder = require("util").TextEncoder;
}

if (typeof global.TextDecoder === "undefined") {
    global.TextDecoder = require("util").TextDecoder;
}

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
