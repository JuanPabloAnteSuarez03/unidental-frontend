// src/__tests__/InventoryPage.test.jsx

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom"; // Para matchers como .toBeInTheDocument()

// Mock todos los componentes y hooks antes de importar InventoryPage
jest.mock("../hooks/useInventory", () => ({
    __esModule: true,
    default: jest.fn(),
}));

jest.mock("../components/SearchFilters/SearchFiltersContainer", () => {
    return {
        __esModule: true,
        default: jest.fn().mockImplementation((props) => (
            <div data-testid="search-filters">
                <button
                    data-testid="clear-filters-button"
                    onClick={props.onReset}
                >
                    Limpiar filtros
                </button>
                <input
                    data-testid="search-name-input"
                    value={props.nameFilter || ""}
                    onChange={(e) =>
                        props.onSearch({
                            name: e.target.value,
                            categories: props.selectedCategories || [],
                        })
                    }
                />
            </div>
        )),
    };
});

jest.mock("../components/Table/InventoryTable", () => {
    return {
        __esModule: true,
        default: jest.fn().mockImplementation((props) => (
            <div
                data-testid="inventory-table"
                data-products-count={props.products?.length || 0}
            >
                {/* Simplemente mostramos los productos, sin botón de ordenación */}
                {props.products.map((product) => (
                    <div key={product.id} data-testid={`product-${product.id}`}>
                        {product.name}
                    </div>
                ))}
            </div>
        )),
    };
});

jest.mock("../components/Pagination/Pagination", () => {
    return {
        __esModule: true,
        default: jest.fn().mockImplementation((props) => (
            <div data-testid="pagination">
                <button
                    data-testid="prev-page-button"
                    onClick={props.goToPrevPage}
                    disabled={!props.hasPrevPage}
                >
                    Anterior
                </button>
                <span data-testid="current-page">{props.currentPage}</span>
                <button
                    data-testid="next-page-button"
                    onClick={props.goToNextPage}
                    disabled={!props.hasNextPage}
                >
                    Siguiente
                </button>
                <button
                    data-testid="goto-page-button"
                    onClick={() => props.goToPage(2)}
                >
                    Ir a página 2
                </button>
            </div>
        )),
    };
});

// Ahora importamos los componentes después de haberlos mockeado
import InventoryPage from "../pages/InventoryPage";
import useInventory from "../hooks/useInventory";
import SearchFiltersContainer from "../components/SearchFilters/SearchFiltersContainer";
import InventoryTable from "../components/Table/InventoryTable";
import Pagination from "../components/Pagination/Pagination";

// --- Estado base para el mock de useInventory ---
const mockUseInventoryDefaultState = {
    filteredProducts: [],
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
    searchByName: jest.fn(),
    nameFilter: "",
    selectedCategories: [],
    availableCategories: [],
    updateSelectedCategories: jest.fn(),
    resetAllFilters: jest.fn(),
};

// --- Suite de Tests ---
describe("InventoryPage", () => {
    beforeEach(() => {
        // Limpiamos todos los mocks antes de cada test
        jest.clearAllMocks();
        // Establecemos un valor de retorno por defecto para useInventory
        useInventory.mockReturnValue(mockUseInventoryDefaultState);
    });

    test("renders page title and initial description (no filters, no products)", () => {
        render(<InventoryPage />);
        expect(screen.getByText("Gestión de Inventario")).toBeInTheDocument();
        // Usar una función para buscar texto que puede estar dividido en múltiples elementos
        expect(
            screen.getByText(/Administra y consulta el inventario de productos/)
        ).toBeInTheDocument();
        expect(screen.getByText("0", { exact: false })).toBeInTheDocument();
    });

    test("renders page title and description with totalGeneralProducts", () => {
        useInventory.mockReturnValue({
            ...mockUseInventoryDefaultState,
            totalGeneralProducts: 150,
        });
        render(<InventoryPage />);
        expect(
            screen.getByText(/Administra y consulta el inventario de productos/)
        ).toBeInTheDocument();
        expect(screen.getByText("150", { exact: false })).toBeInTheDocument();
    });

    test("displays loading message when isLoading is true", () => {
        useInventory.mockReturnValue({
            ...mockUseInventoryDefaultState,
            isLoading: true,
        });
        render(<InventoryPage />);
        // Verificamos que se renderizaron los componentes correctos
        expect(screen.getByTestId("inventory-table")).toBeInTheDocument();
        expect(screen.queryByTestId("pagination")).not.toBeInTheDocument();
    });

    test("displays error message when error is present", () => {
        const errorMessage = "Error de red al cargar";
        useInventory.mockReturnValue({
            ...mockUseInventoryDefaultState,
            error: errorMessage,
        });
        render(<InventoryPage />);
        expect(
            screen.getByText("Error al cargar productos")
        ).toBeInTheDocument();
        expect(screen.getByText(errorMessage)).toBeInTheDocument();

        // Cuando hay error, no se debe renderizar la tabla
        expect(screen.queryByTestId("inventory-table")).not.toBeInTheDocument();
        expect(screen.queryByTestId("pagination")).not.toBeInTheDocument();
    });

    describe("when data is loaded successfully", () => {
        const mockProducts = [
            {
                id: 1,
                name: "Producto A",
                code: "P001",
                category: "Cat1",
                stock: 10,
                price: 100,
            },
            {
                id: 2,
                name: "Producto B",
                code: "P002",
                category: "Cat2",
                stock: 5,
                price: 200,
            },
        ];

        beforeEach(() => {
            useInventory.mockReturnValue({
                ...mockUseInventoryDefaultState,
                filteredProducts: mockProducts,
                totalGeneralProducts: 25,
                currentPage: 1,
                totalPages: 3,
                hasNextPage: true,
                hasPrevPage: false,
            });
        });

        test("renders search filters component", () => {
            render(<InventoryPage />);
            expect(screen.getByTestId("search-filters")).toBeInTheDocument();
        });

        test("renders inventory table with products", () => {
            render(<InventoryPage />);
            const table = screen.getByTestId("inventory-table");
            expect(table).toBeInTheDocument();
            expect(table).toHaveAttribute("data-products-count", "2");
            expect(screen.getByTestId("product-1")).toBeInTheDocument();
            expect(screen.getByTestId("product-2")).toBeInTheDocument();
        });

        test("renders pagination when there are products", () => {
            render(<InventoryPage />);
            expect(screen.getByTestId("pagination")).toBeInTheDocument();
            expect(screen.getByTestId("current-page")).toHaveTextContent("1");
        });

        test("calls resetAllFilters when clear filters button is clicked", () => {
            const mockResetAllFilters = jest.fn();
            useInventory.mockReturnValue({
                ...mockUseInventoryDefaultState,
                filteredProducts: mockProducts,
                resetAllFilters: mockResetAllFilters,
            });

            render(<InventoryPage />);
            const clearButton = screen.getByTestId("clear-filters-button");
            fireEvent.click(clearButton);
            expect(mockResetAllFilters).toHaveBeenCalled();
        });

        test("calls goToNextPage when next page button is clicked", () => {
            const mockGoToNextPage = jest.fn();
            useInventory.mockReturnValue({
                ...mockUseInventoryDefaultState,
                filteredProducts: mockProducts,
                totalGeneralProducts: 50,
                hasNextPage: true,
                goToNextPage: mockGoToNextPage,
            });

            render(<InventoryPage />);
            fireEvent.click(screen.getByTestId("next-page-button"));
            expect(mockGoToNextPage).toHaveBeenCalled();
        });

        test("calls goToPrevPage when previous page button is clicked", () => {
            const mockGoToPrevPage = jest.fn();
            useInventory.mockReturnValue({
                ...mockUseInventoryDefaultState,
                filteredProducts: mockProducts,
                totalGeneralProducts: 50,
                hasPrevPage: true,
                goToPrevPage: mockGoToPrevPage,
            });

            render(<InventoryPage />);
            fireEvent.click(screen.getByTestId("prev-page-button"));
            expect(mockGoToPrevPage).toHaveBeenCalled();
        });

        test("calls goToPage when page number button is clicked", () => {
            const mockGoToPage = jest.fn();
            useInventory.mockReturnValue({
                ...mockUseInventoryDefaultState,
                filteredProducts: mockProducts,
                totalGeneralProducts: 50,
                goToPage: mockGoToPage,
            });

            render(<InventoryPage />);
            fireEvent.click(screen.getByTestId("goto-page-button"));
            expect(mockGoToPage).toHaveBeenCalledWith(2);
        });
    });

    describe("pagination visibility", () => {
        test("does not render pagination when totalGeneralProducts is 0", () => {
            useInventory.mockReturnValue({
                ...mockUseInventoryDefaultState,
                totalGeneralProducts: 0,
            });

            render(<InventoryPage />);
            expect(screen.queryByTestId("pagination")).not.toBeInTheDocument();
        });

        test("renders pagination when totalGeneralProducts is greater than 0", () => {
            useInventory.mockReturnValue({
                ...mockUseInventoryDefaultState,
                totalGeneralProducts: 10,
            });

            render(<InventoryPage />);
            expect(screen.getByTestId("pagination")).toBeInTheDocument();
        });
    });

    describe("empty state", () => {
        test("displays no products message when no products and no loading and no error", () => {
            useInventory.mockReturnValue({
                ...mockUseInventoryDefaultState,
                totalGeneralProducts: 0,
                isLoading: false,
                error: null,
            });

            render(<InventoryPage />);
            expect(
                screen.getByText("No se encontraron productos")
            ).toBeInTheDocument();
        });

        test("does not display no products message when loading", () => {
            useInventory.mockReturnValue({
                ...mockUseInventoryDefaultState,
                totalGeneralProducts: 0,
                isLoading: true,
                error: null,
            });

            render(<InventoryPage />);
            expect(
                screen.queryByText("No se encontraron productos")
            ).not.toBeInTheDocument();
        });

        test("does not display no products message when there is an error", () => {
            useInventory.mockReturnValue({
                ...mockUseInventoryDefaultState,
                totalGeneralProducts: 0,
                isLoading: false,
                error: "Some error",
            });

            render(<InventoryPage />);
            expect(
                screen.queryByText("No se encontraron productos")
            ).not.toBeInTheDocument();
        });
    });

    describe("component interaction", () => {
        test("SearchFiltersContainer is rendered with correct props", () => {
            const mockSearchByName = jest.fn();
            const mockUpdateSelectedCategories = jest.fn();
            const mockResetAllFilters = jest.fn();

            useInventory.mockReturnValue({
                ...mockUseInventoryDefaultState,
                searchByName: mockSearchByName,
                nameFilter: "test filter",
                selectedCategories: ["cat1"],
                availableCategories: ["cat1", "cat2"],
                updateSelectedCategories: mockUpdateSelectedCategories,
                resetAllFilters: mockResetAllFilters,
                isLoading: false,
            });

            render(<InventoryPage />);

            // Verificamos que SearchFiltersContainer fue llamado
            expect(SearchFiltersContainer).toHaveBeenCalled();

            // Verificamos que las props incluyen los valores esperados
            const callArgs = SearchFiltersContainer.mock.calls[0][0];
            expect(callArgs.nameFilter).toBe("test filter");
            expect(callArgs.selectedCategories).toEqual(["cat1"]);
            expect(callArgs.availableCategories).toEqual(["cat1", "cat2"]);
            expect(callArgs.isCategoriesLoading).toBe(false);
            expect(typeof callArgs.onSearch).toBe("function");
            expect(typeof callArgs.onReset).toBe("function");
        });

        test("InventoryTable is rendered with correct props", () => {
            const mockProducts = [{ id: 1, name: "Test Product" }];

            useInventory.mockReturnValue({
                ...mockUseInventoryDefaultState,
                filteredProducts: mockProducts,
                isLoading: true,
            });

            render(<InventoryPage />);

            // Verificamos que InventoryTable fue llamado
            expect(InventoryTable).toHaveBeenCalled();

            // Verificamos las props
            const callArgs = InventoryTable.mock.calls[0][0];
            expect(callArgs.products).toEqual(mockProducts);
            expect(callArgs.isLoading).toBe(true);
        });

        test("Pagination is rendered with correct props when products exist", () => {
            const mockGoToPage = jest.fn();
            const mockGoToNextPage = jest.fn();
            const mockGoToPrevPage = jest.fn();

            useInventory.mockReturnValue({
                ...mockUseInventoryDefaultState,
                totalGeneralProducts: 10,
                currentPage: 2,
                totalPages: 5,
                goToPage: mockGoToPage,
                goToNextPage: mockGoToNextPage,
                goToPrevPage: mockGoToPrevPage,
                hasNextPage: true,
                hasPrevPage: true,
                isLoading: false,
            });

            render(<InventoryPage />);

            // Verificamos que Pagination fue llamado
            expect(Pagination).toHaveBeenCalled();

            // Verificamos las props
            const callArgs = Pagination.mock.calls[0][0];
            expect(callArgs.currentPage).toBe(2);
            expect(callArgs.totalPages).toBe(5);
            expect(callArgs.goToPage).toBe(mockGoToPage);
            expect(callArgs.goToNextPage).toBe(mockGoToNextPage);
            expect(callArgs.goToPrevPage).toBe(mockGoToPrevPage);
            expect(callArgs.hasNextPage).toBe(true);
            expect(callArgs.hasPrevPage).toBe(true);
            expect(callArgs.isLoading).toBe(false);
        });
    });
});
