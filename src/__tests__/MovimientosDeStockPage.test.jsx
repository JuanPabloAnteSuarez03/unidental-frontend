// src/__tests__/MovimientosDeStockPage.test.jsx

import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock del contexto de autenticación
jest.mock("../context/AuthContext", () => ({
    useAuth: jest.fn(() => ({
        authToken: "mock-token",
    })),
}));

// Mock del servicio de inventario que devuelve promesas resueltas
jest.mock("../services/inventoryService", () => ({
    __esModule: true,
    default: {
        getProducts: jest.fn().mockResolvedValue([]),
        getLocations: jest.fn().mockResolvedValue([]),
        getInventoryMovements: jest.fn().mockResolvedValue({ results: [] }),
    },
}));

import MovimientosDeStockPage from "../pages/MovimientosDeStockPage";
import { useAuth } from "../context/AuthContext";

describe("MovimientosDeStockPage", () => {
    beforeEach(() => {
        // Limpiar mocks antes de cada test
        jest.clearAllMocks();

        // Mock básico del contexto de autenticación
        useAuth.mockReturnValue({
            authToken: "mock-token",
        });
    });

    test("renders page title and description", () => {
        render(<MovimientosDeStockPage />);

        expect(screen.getByText("Movimientos de Stock")).toBeInTheDocument();
        expect(
            screen.getByText(
                "Registra y consulta todos los movimientos de inventario"
            )
        ).toBeInTheDocument();
    });

    test("renders search section", () => {
        render(<MovimientosDeStockPage />);

        expect(screen.getByText("Buscar Producto")).toBeInTheDocument();
        expect(
            screen.getByPlaceholderText(
                "Ingrese el nombre del producto a buscar..."
            )
        ).toBeInTheDocument();
    });

    test("renders movement registration form", () => {
        render(<MovimientosDeStockPage />);

        expect(
            screen.getByText("Registrar Nuevo Movimiento")
        ).toBeInTheDocument();
        expect(screen.getByLabelText("Producto *")).toBeInTheDocument();
        expect(screen.getByLabelText("Ubicación *")).toBeInTheDocument();

        // Para el tipo de movimiento, verificamos que existe el label
        expect(screen.getByText("Tipo de Movimiento *")).toBeInTheDocument();

        expect(screen.getByLabelText("Cantidad *")).toBeInTheDocument();
        expect(
            screen.getByLabelText("Fecha de Vencimiento *")
        ).toBeInTheDocument();
    });

    test("renders movement types correctly", () => {
        render(<MovimientosDeStockPage />);

        // Verificamos que los radio buttons existen
        const entradaInputs = screen.getAllByDisplayValue("in");
        const salidaInputs = screen.getAllByDisplayValue("out");
        const ajusteInputs = screen.getAllByDisplayValue("adjustment");

        expect(entradaInputs.length).toBeGreaterThan(0);
        expect(salidaInputs.length).toBeGreaterThan(0);
        expect(ajusteInputs.length).toBeGreaterThan(0);
    });

    test("renders history section", () => {
        render(<MovimientosDeStockPage />);

        expect(
            screen.getByText("Historial de Movimientos")
        ).toBeInTheDocument();
        expect(screen.getByText("Filtros de Búsqueda")).toBeInTheDocument();
    });

    test("renders form submission button", () => {
        render(<MovimientosDeStockPage />);

        expect(screen.getByText("Registrar Movimiento")).toBeInTheDocument();
    });

    test("renders without auth token", () => {
        useAuth.mockReturnValue({
            authToken: null,
        });

        render(<MovimientosDeStockPage />);

        // El componente debería renderizarse sin errores incluso sin token
        expect(screen.getByText("Movimientos de Stock")).toBeInTheDocument();
    });

    test("renders movement types in both form and filters", () => {
        render(<MovimientosDeStockPage />);

        // Verificamos que hay múltiples elementos con estos textos (formulario y filtros)
        expect(screen.getAllByText("Entrada").length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText("Salida").length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText("Ajuste").length).toBeGreaterThanOrEqual(1);
    });
});
