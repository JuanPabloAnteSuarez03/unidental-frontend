// src/__tests__/MovimientosDeStockPage.test.jsx

import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import MovimientosDeStockPage from "../pages/MovimientosDeStockPage";

// Mock de todos los componentes y hooks
jest.mock("../context/AuthContext", () => ({
    useAuth: jest.fn(() => ({
        authToken: "mock-token",
    })),
}));

jest.mock("../context/ProductsContext", () => ({
    useProducts: jest.fn(() => ({
        refreshCache: jest.fn(),
    })),
}));

jest.mock("../services/inventoryService", () => ({
    default: {
        getLocations: jest.fn().mockResolvedValue([]),
        getInventoryMovements: jest.fn().mockResolvedValue({ results: [] }),
    },
}));

jest.mock("../hooks/inventory/useProductSearch", () => ({
    __esModule: true,
    default: jest.fn(() => ({
        searchResults: [],
        isLoading: false,
        error: null,
    })),
}));

// Mock de todos los componentes hijos para evitar problemas de renderizado
jest.mock("../components/StockMovements/MovementsHeader", () => () => (
    <div>MovementsHeader</div>
));
jest.mock("../components/StockMovements/MovementNotification", () => () => (
    <div>MovementNotification</div>
));
jest.mock("../components/StockMovements/MovementForm", () => () => (
    <div>MovementForm</div>
));
jest.mock("../components/StockMovements/MovementFilters", () => () => (
    <div>MovementFilters</div>
));
jest.mock("../components/StockMovements/MovementsTable", () => () => (
    <div>MovementsTable</div>
));
jest.mock("../components/StockMovements/MovementsPagination", () => () => (
    <div>MovementsPagination</div>
));

describe("MovimientosDeStockPage", () => {
    test("renders without crashing", () => {
        // Silenciar console.error para evitar ruido en los tests
        const originalError = console.error;
        console.error = jest.fn();

        // Renderizar el componente
        render(<MovimientosDeStockPage />);

        // Restaurar console.error
        console.error = originalError;
    });
});
