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
                {props.products?.map((product) => (
                    <div key={product.id} data-testid={`product-${product.id}`}>
                        {product.name}
                    </div>
                ))}
            </div>
        )),
    };
});

// Mock del componente InventoryContent para simular la paginación
jest.mock("../components/Inventory/InventoryContent", () => {
    return {
        __esModule: true,
        default: jest.fn().mockImplementation((props) => {
            // Si no hay productos y no hay error, mostrar mensaje de no productos
            if (
                !props.isLoading &&
                !props.error &&
                props.totalGeneralProducts === 0
            ) {
                return (
                    <div
                        style={{
                            backgroundColor: "white",
                            borderRadius: "12px",
                            padding: "40px 25px",
                            marginBottom: "20px",
                            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                            border: "1px solid #e9ecef",
                            textAlign: "center",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "12px",
                                marginBottom: "15px",
                            }}
                        >
                            <div
                                style={{
                                    width: "24px",
                                    height: "24px",
                                    borderRadius: "50%",
                                    backgroundColor: "#6c757d",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "white",
                                    fontSize: "14px",
                                    fontWeight: "bold",
                                }}
                            >
                                ?
                            </div>
                            <h3
                                style={{
                                    color: "#2c3e50",
                                    fontSize: "18px",
                                    fontWeight: "600",
                                    margin: 0,
                                }}
                            >
                                No se encontraron productos
                            </h3>
                        </div>
                        <p
                            style={{
                                color: "#6c757d",
                                fontSize: "16px",
                                margin: 0,
                                lineHeight: "1.5",
                            }}
                        >
                            No hay productos que coincidan con los criterios de
                            búsqueda actuales.
                            <br />
                            Intenta ajustar los filtros o agregar nuevos
                            productos al inventario.
                        </p>
                    </div>
                );
            }

            // Solo renderizar paginación si hay productos
            if (props.totalGeneralProducts > 0) {
                return (
                    <div
                        className="inventory-card inventory-table-container"
                        style={{
                            backgroundColor: "white",
                            borderRadius: "12px",
                            padding: "25px",
                            marginBottom: "20px",
                            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                            border: "1px solid #e9ecef",
                            position: "relative",
                            minHeight: "500px",
                        }}
                    >
                        <div
                            className="inventory-section-header"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                marginBottom: "20px",
                            }}
                        >
                            <div
                                style={{
                                    width: "3px",
                                    height: "24px",
                                    backgroundColor: "#17a2b8",
                                    borderRadius: "2px",
                                }}
                            />
                            <h3
                                className="inventory-section-title"
                                style={{
                                    color: "#2c3e50",
                                    fontSize: "18px",
                                    fontWeight: "600",
                                    margin: 0,
                                }}
                            >
                                Productos del Inventario
                            </h3>
                        </div>
                        <div
                            data-products-count={
                                props.filteredProducts?.length || 0
                            }
                            data-testid="inventory-table"
                        >
                            {props.filteredProducts?.map((product) => (
                                <div
                                    key={product.id}
                                    data-testid={`product-${product.id}`}
                                >
                                    {product.name}
                                </div>
                            ))}
                        </div>
                        <div style={{ flexGrow: 1, minHeight: "20px" }} />
                        <div
                            style={{
                                marginTop: "20px",
                                paddingTop: "20px",
                                borderTop: "1px solid #e9ecef",
                            }}
                        >
                            <div
                                aria-label="Paginación"
                                role="navigation"
                                data-testid="pagination"
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    margin: "20px 0",
                                    flexWrap: "wrap",
                                    gap: "15px",
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: "14px",
                                        color: "#495057",
                                        fontWeight: "500",
                                    }}
                                >
                                    Mostrando {(props.currentPage - 1) * 25 + 1}
                                    -
                                    {Math.min(
                                        props.currentPage * 25,
                                        props.totalGeneralProducts
                                    )}{" "}
                                    de {props.totalGeneralProducts} elementos
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "10px",
                                    }}
                                >
                                    <button
                                        data-testid="prev-page-button"
                                        onClick={props.goToPrevPage}
                                        disabled={
                                            !props.hasPrevPage ||
                                            props.isLoading
                                        }
                                        style={{
                                            padding: "8px 16px",
                                            backgroundColor:
                                                props.hasPrevPage &&
                                                !props.isLoading
                                                    ? "#2c3e50"
                                                    : "#e9ecef",
                                            color:
                                                props.hasPrevPage &&
                                                !props.isLoading
                                                    ? "#ffffff"
                                                    : "#adb5bd",
                                            border: "none",
                                            borderRadius: "4px",
                                            fontSize: "14px",
                                            fontWeight: "500",
                                            cursor:
                                                props.hasPrevPage &&
                                                !props.isLoading
                                                    ? "pointer"
                                                    : "not-allowed",
                                            transition: "all 0.2s ease",
                                        }}
                                        aria-label="Ir a la página anterior"
                                    >
                                        Anterior
                                    </button>
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "5px",
                                        }}
                                    >
                                        <button
                                            data-testid="current-page"
                                            aria-current="page"
                                            aria-label="Ir a la página 1"
                                            style={{
                                                padding: "6px 12px",
                                                backgroundColor: "#2c3e50",
                                                color: "#ffffff",
                                                border: "1px solid #dee2e6",
                                                borderRadius: "4px",
                                                fontSize: "14px",
                                                cursor: "pointer",
                                                transition: "all 0.2s ease",
                                            }}
                                        >
                                            {props.currentPage}
                                        </button>
                                        {props.totalPages > 1 && (
                                            <button
                                                data-testid="goto-page-button"
                                                onClick={() =>
                                                    props.goToPage(2)
                                                }
                                                style={{
                                                    padding: "6px 12px",
                                                    backgroundColor: "#ffffff",
                                                    color: "#495057",
                                                    border: "1px solid #dee2e6",
                                                    borderRadius: "4px",
                                                    fontSize: "14px",
                                                    cursor: "pointer",
                                                    transition: "all 0.2s ease",
                                                }}
                                                aria-label="Ir a la página 2"
                                            >
                                                2
                                            </button>
                                        )}
                                    </div>
                                    <button
                                        data-testid="next-page-button"
                                        onClick={props.goToNextPage}
                                        disabled={
                                            !props.hasNextPage ||
                                            props.isLoading
                                        }
                                        style={{
                                            padding: "8px 16px",
                                            backgroundColor:
                                                props.hasNextPage &&
                                                !props.isLoading
                                                    ? "#2c3e50"
                                                    : "#e9ecef",
                                            color:
                                                props.hasNextPage &&
                                                !props.isLoading
                                                    ? "#ffffff"
                                                    : "#adb5bd",
                                            border: "none",
                                            borderRadius: "4px",
                                            fontSize: "14px",
                                            fontWeight: "500",
                                            cursor:
                                                props.hasNextPage &&
                                                !props.isLoading
                                                    ? "pointer"
                                                    : "not-allowed",
                                            transition: "all 0.2s ease",
                                        }}
                                        aria-label="Ir a la página siguiente"
                                    >
                                        Siguiente
                                    </button>
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                    }}
                                >
                                    <label htmlFor="inventory-page-input">
                                        Ir a página:
                                    </label>
                                    <input
                                        aria-label="Número de página"
                                        id="inventory-page-input"
                                        max={props.totalPages}
                                        min="1"
                                        style={{
                                            width: "60px",
                                            padding: "6px 8px",
                                            border: "1px solid #ced4da",
                                            borderRadius: "4px",
                                            fontSize: "14px",
                                            textAlign: "center",
                                        }}
                                        type="number"
                                        defaultValue={props.currentPage}
                                        onChange={() => {}} // Add onChange to avoid warning
                                    />
                                    <button
                                        aria-label="Ir a la página especificada"
                                        style={{
                                            padding: "6px 12px",
                                            backgroundColor: "#2c3e50",
                                            color: "#ffffff",
                                            border: "none",
                                            borderRadius: "4px",
                                            fontSize: "14px",
                                            cursor: "pointer",
                                            transition:
                                                "background-color 0.2s ease",
                                        }}
                                    >
                                        Ir
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            }
            return null;
        }),
    };
});

// Ahora importamos los componentes después de haberlos mockeado
import InventoryPage from "../pages/InventoryPage";
import useInventory from "../hooks/useInventory";
import SearchFiltersContainer from "../components/SearchFilters/SearchFiltersContainer";
import InventoryTable from "../components/Table/InventoryTable";
import InventoryContent from "../components/Inventory/InventoryContent";

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
        // Use a more specific selector to avoid multiple matches
        expect(
            screen.getByText((content, element) => {
                return (
                    element.tagName.toLowerCase() === "span" &&
                    content === "150"
                );
            })
        ).toBeInTheDocument();
    });

    test("displays loading message when isLoading is true", () => {
        useInventory.mockReturnValue({
            ...mockUseInventoryDefaultState,
            isLoading: true,
        });
        render(<InventoryPage />);
        // When loading, the table should not be rendered
        expect(screen.queryByTestId("inventory-table")).not.toBeInTheDocument();
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
                totalPages: 2, // Need more than 1 page for goto-page-button to appear
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

        test("InventoryContent is rendered with correct props when products exist", () => {
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

            // Verificamos que InventoryContent fue llamado
            expect(InventoryContent).toHaveBeenCalled();

            // Verificamos las props
            const callArgs = InventoryContent.mock.calls[0][0];
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
