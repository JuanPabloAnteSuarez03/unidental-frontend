// src/__tests__/InventoryPage.test.jsx

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom"; // Para matchers como .toBeInTheDocument()

// Mock todos los componentes y hooks antes de importar InventoryPage
jest.mock("../hooks/useInventory", () => ({
    __esModule: true,
    default: jest.fn(),
}));

jest.mock("../components/SearchBar/SearchBar", () => {
    return {
        __esModule: true,
        default: jest.fn().mockImplementation((props) => (
            <div data-testid="search-bar">
                <button
                    data-testid="clear-filters-button"
                    onClick={props.onClearFilters}
                >
                    Limpiar filtros
                </button>
                <input
                    data-testid="search-text-input"
                    value={props.searchText}
                    onChange={(e) => props.onSearchTextChange(e.target.value)}
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
import SearchBar from "../components/SearchBar/SearchBar";
import InventoryTable from "../components/Table/InventoryTable";
import Pagination from "../components/Pagination/Pagination";

// --- Estado base para el mock de useInventory ---
const mockUseInventoryDefaultState = {
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
        // Verifica el contador de productos en la descripción (0 por defecto)
        expect(
            screen.getByText(
                "Administra y consulta el inventario de productos (0 en total)"
            )
        ).toBeInTheDocument();
    });

    test("renders page title and description with totalGeneralProducts when no filters active", () => {
        useInventory.mockReturnValue({
            ...mockUseInventoryDefaultState,
            totalGeneralProducts: 150,
        });
        render(<InventoryPage />);
        expect(
            screen.getByText(
                "Administra y consulta el inventario de productos (150 en total)"
            )
        ).toBeInTheDocument();
    });

    test("renders page title and description with totalProducts when a filter is active", () => {
        useInventory.mockReturnValue({
            ...mockUseInventoryDefaultState,
            searchText: "some filter", // Un filtro está activo
            totalProducts: 25,
            totalGeneralProducts: 150,
        });
        render(<InventoryPage />);
        expect(
            screen.getByText(
                "Administra y consulta el inventario de productos (25 en total)"
            )
        ).toBeInTheDocument();
    });

    test("displays loading message when isLoading is true", () => {
        useInventory.mockReturnValue({
            ...mockUseInventoryDefaultState,
            isLoading: true,
        });
        render(<InventoryPage />);
        expect(screen.getByText("Cargando productos...")).toBeInTheDocument();
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
            screen.getByText(`Error al cargar productos: ${errorMessage}`)
        ).toBeInTheDocument();

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
                stock: 20,
                price: 200,
            },
        ];

        test("renders InventoryTable and Pagination when products exist", () => {
            useInventory.mockReturnValue({
                ...mockUseInventoryDefaultState,
                isLoading: false,
                error: null,
                filteredProducts: mockProducts,
                totalProducts: mockProducts.length,
                totalGeneralProducts: 10, // Podría haber más productos en total
                currentPage: 1,
                totalPages: 2,
                hasNextPage: true,
            });
            render(<InventoryPage />);

            expect(screen.getByTestId("inventory-table")).toBeInTheDocument();
            expect(screen.getByTestId("pagination")).toBeInTheDocument();

            // Verifica que no haya mensajes de carga o error
            expect(
                screen.queryByText("Cargando productos...")
            ).not.toBeInTheDocument();
            expect(
                screen.queryByText(/Error al cargar productos/)
            ).not.toBeInTheDocument();
            // Y que no se muestre el mensaje de "no productos encontrados"
            expect(
                screen.queryByText(/No se encontraron productos que coincidan/)
            ).not.toBeInTheDocument();
        });

        test("does not render Pagination if totalProducts is 0, even if data loaded", () => {
            useInventory.mockReturnValue({
                ...mockUseInventoryDefaultState,
                isLoading: false,
                error: null,
                filteredProducts: [],
                totalProducts: 0,
                totalGeneralProducts: 10, // Aún hay productos en general, pero ninguno con el filtro
            });
            render(<InventoryPage />);

            expect(screen.getByTestId("inventory-table")).toBeInTheDocument();
            expect(screen.queryByTestId("pagination")).not.toBeInTheDocument();
        });

        test('displays "No se encontraron productos" message when totalProducts is 0 and not loading/error', () => {
            useInventory.mockReturnValue({
                ...mockUseInventoryDefaultState,
                isLoading: false,
                error: null,
                filteredProducts: [],
                totalProducts: 0,
            });
            render(<InventoryPage />);
            expect(
                screen.getByText(
                    "No se encontraron productos que coincidan con los filtros de búsqueda."
                )
            ).toBeInTheDocument();

            expect(screen.getByTestId("inventory-table")).toBeInTheDocument();
            expect(screen.queryByTestId("pagination")).not.toBeInTheDocument();
        });
    });

    test("passes correct props to SearchBar", () => {
        const searchState = {
            ...mockUseInventoryDefaultState,
            searchText: "Laptop",
            searchCode: "LP123",
            searchCategory: "Electrónicos",
            totalProducts: 5, // Productos que coinciden con el filtro para SearchBar
            totalGeneralProducts: 50, // Total general para SearchBar
        };
        useInventory.mockReturnValue(searchState);
        render(<InventoryPage />);

        // Verificar que SearchBar fue llamado con los props correctos
        const searchBarProps = SearchBar.mock.calls[0][0];
        expect(searchBarProps.searchText).toBe(searchState.searchText);
        expect(searchBarProps.searchCode).toBe(searchState.searchCode);
        expect(searchBarProps.searchCategory).toBe(searchState.searchCategory);
        expect(searchBarProps.onSearchTextChange).toBe(
            searchState.updateSearchText
        );
        expect(searchBarProps.onSearchCodeChange).toBe(
            searchState.updateSearchCode
        );
        expect(searchBarProps.onSearchCategoryChange).toBe(
            searchState.updateSearchCategory
        );
        expect(searchBarProps.onClearFilters).toBe(searchState.clearFilters);
        expect(searchBarProps.filteredCount).toBe(searchState.totalProducts);
        expect(searchBarProps.totalProducts).toBe(
            searchState.totalGeneralProducts
        );
    });

    test("passes correct props to InventoryTable", () => {
        const mockProducts = [
            { id: 1, name: "Product A" },
            { id: 2, name: "Product B" },
        ];
        const tableState = {
            ...mockUseInventoryDefaultState,
            filteredProducts: mockProducts,
        };
        useInventory.mockReturnValue(tableState);
        render(<InventoryPage />);

        // Verificar que InventoryTable fue llamado con los props correctos
        const tableProps = InventoryTable.mock.calls[0][0];
        expect(tableProps.products).toEqual(mockProducts);
    });

    test("passes correct props to Pagination when visible", () => {
        const paginationState = {
            ...mockUseInventoryDefaultState,
            filteredProducts: [{ id: 1, name: "Product" }], // Al menos un producto
            totalProducts: 50, // Más de 0 para que se muestre Pagination
            currentPage: 3,
            totalPages: 10,
            hasNextPage: true,
            hasPrevPage: true,
        };
        useInventory.mockReturnValue(paginationState);
        render(<InventoryPage />);

        // Verificar que Pagination fue llamado con los props correctos
        const paginationProps = Pagination.mock.calls[0][0];
        expect(paginationProps.currentPage).toBe(paginationState.currentPage);
        expect(paginationProps.totalPages).toBe(paginationState.totalPages);
        expect(paginationProps.goToPage).toBe(paginationState.goToPage);
        expect(paginationProps.goToNextPage).toBe(paginationState.goToNextPage);
        expect(paginationProps.goToPrevPage).toBe(paginationState.goToPrevPage);
        expect(paginationProps.hasNextPage).toBe(paginationState.hasNextPage);
        expect(paginationProps.hasPrevPage).toBe(paginationState.hasPrevPage);
        expect(paginationProps.isLoading).toBe(paginationState.isLoading);
    });

    // Tests de interacción con los componentes

    test("clicking on the clear filters button calls clearFilters", () => {
        const mockClearFilters = jest.fn();
        useInventory.mockReturnValue({
            ...mockUseInventoryDefaultState,
            clearFilters: mockClearFilters,
            searchText: "algo", // Para que se muestre el botón de limpiar
        });

        render(<InventoryPage />);
        fireEvent.click(screen.getByTestId("clear-filters-button"));

        expect(mockClearFilters).toHaveBeenCalledTimes(1);
    });

    test("changing search text input calls updateSearchText", () => {
        const mockUpdateSearchText = jest.fn();
        useInventory.mockReturnValue({
            ...mockUseInventoryDefaultState,
            updateSearchText: mockUpdateSearchText,
        });

        render(<InventoryPage />);
        fireEvent.change(screen.getByTestId("search-text-input"), {
            target: { value: "nuevo texto" },
        });

        expect(mockUpdateSearchText).toHaveBeenCalledWith("nuevo texto");
    });

    test("clicking on pagination buttons calls correct functions", () => {
        const mockGoToNextPage = jest.fn();
        const mockGoToPrevPage = jest.fn();
        const mockGoToPage = jest.fn();

        useInventory.mockReturnValue({
            ...mockUseInventoryDefaultState,
            goToNextPage: mockGoToNextPage,
            goToPrevPage: mockGoToPrevPage,
            goToPage: mockGoToPage,
            filteredProducts: [{ id: 1, name: "Producto" }],
            totalProducts: 50, // Para que se muestre la paginación
            hasNextPage: true,
            hasPrevPage: true,
        });

        render(<InventoryPage />);

        fireEvent.click(screen.getByTestId("next-page-button"));
        expect(mockGoToNextPage).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByTestId("prev-page-button"));
        expect(mockGoToPrevPage).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByTestId("goto-page-button"));
        expect(mockGoToPage).toHaveBeenCalledWith(2);
    });

    test("displays correct products in the table", () => {
        const mockProducts = [
            { id: 1, name: "Producto 1" },
            { id: 2, name: "Producto 2" },
            { id: 3, name: "Producto 3" },
        ];

        useInventory.mockReturnValue({
            ...mockUseInventoryDefaultState,
            filteredProducts: mockProducts,
            totalProducts: mockProducts.length,
        });

        render(<InventoryPage />);

        // Verificar que cada producto se renderiza en la tabla
        mockProducts.forEach((product) => {
            expect(
                screen.getByTestId(`product-${product.id}`)
            ).toBeInTheDocument();
            expect(
                screen.getByTestId(`product-${product.id}`)
            ).toHaveTextContent(product.name);
        });

        // Verificar el atributo data-products-count en la tabla
        expect(screen.getByTestId("inventory-table")).toHaveAttribute(
            "data-products-count",
            String(mockProducts.length)
        );
    });
});
