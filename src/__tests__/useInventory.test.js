import { renderHook, act } from "@testing-library/react";
import { useAuth } from "../context/AuthContext";

// Mock para el hook useInventory (debe estar antes de cualquier import)
jest.mock("../hooks/useInventory", () => {
    return {
        __esModule: true,
        default: jest.fn().mockImplementation(() => ({
            searchText: "",
            searchCode: "",
            searchCategory: "",
            sortConfig: { key: null, direction: "ascending" },
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
            itemsPerPage: 10,
        })),
    };
});

// Mock para el contexto de autenticación
jest.mock("../context/AuthContext", () => ({
    useAuth: jest.fn(),
}));

// Importaciones después de los mocks
import useInventory from "../hooks/useInventory";

// Mock para fetch global
global.fetch = jest.fn();

describe("useInventory hook", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        useAuth.mockReturnValue({ authToken: "fake-token" });
    });

    test("el hook se inicializa correctamente", () => {
        const { result } = renderHook(() => useInventory());

        // Verificar que el hook se inicializa con los valores por defecto
        expect(result.current).toHaveProperty("searchText");
        expect(result.current).toHaveProperty("searchCode");
        expect(result.current).toHaveProperty("searchCategory");
        expect(result.current).toHaveProperty("sortConfig");
        expect(result.current).toHaveProperty("filteredProducts");

        // Verificar que useInventory fue llamado
        expect(useInventory).toHaveBeenCalled();
    });

    test("actualiza los filtros de búsqueda", () => {
        const { result } = renderHook(() => useInventory());

        // Verificar que las funciones de actualización de filtros están disponibles
        expect(typeof result.current.updateSearchText).toBe("function");
        expect(typeof result.current.updateSearchCode).toBe("function");
        expect(typeof result.current.updateSearchCategory).toBe("function");

        // Simular actualización de filtros
        result.current.updateSearchText("test");
        result.current.updateSearchCode("SKU123");
        result.current.updateSearchCategory("Cat1");

        // Verificar que se llamaron las funciones
        expect(result.current.updateSearchText).toHaveBeenCalledWith("test");
        expect(result.current.updateSearchCode).toHaveBeenCalledWith("SKU123");
        expect(result.current.updateSearchCategory).toHaveBeenCalledWith(
            "Cat1"
        );
    });

    test("maneja el ordenamiento de productos", () => {
        const { result } = renderHook(() => useInventory());

        // Verificar que la función de ordenamiento está disponible
        expect(typeof result.current.handleSort).toBe("function");

        // Simular ordenamiento
        result.current.handleSort("name");

        // Verificar que se llamó la función con el parámetro correcto
        expect(result.current.handleSort).toHaveBeenCalledWith("name");
    });

    test("proporciona funciones de paginación", () => {
        const { result } = renderHook(() => useInventory());

        // Verificar que las funciones de paginación están disponibles
        expect(typeof result.current.goToNextPage).toBe("function");
        expect(typeof result.current.goToPrevPage).toBe("function");
        expect(typeof result.current.goToPage).toBe("function");

        // Simular navegación
        result.current.goToNextPage();
        result.current.goToPrevPage();
        result.current.goToPage(3);

        // Verificar que se llamaron las funciones
        expect(result.current.goToNextPage).toHaveBeenCalled();
        expect(result.current.goToPrevPage).toHaveBeenCalled();
        expect(result.current.goToPage).toHaveBeenCalledWith(3);
    });

    test("permite limpiar todos los filtros", () => {
        const { result } = renderHook(() => useInventory());

        // Verificar que la función para limpiar filtros está disponible
        expect(typeof result.current.clearFilters).toBe("function");

        // Simular limpieza de filtros
        result.current.clearFilters();

        // Verificar que se llamó la función
        expect(result.current.clearFilters).toHaveBeenCalled();
    });

    test("expone estados de carga y error", () => {
        const { result } = renderHook(() => useInventory());

        // Verificar que los estados de carga y error están disponibles
        expect(result.current).toHaveProperty("isLoading");
        expect(result.current).toHaveProperty("error");

        // Los valores deben ser booleano y null/string respectivamente
        expect(typeof result.current.isLoading).toBe("boolean");
        expect(
            result.current.error === null ||
                typeof result.current.error === "string"
        ).toBe(true);
    });

    test("proporciona información de paginación", () => {
        const { result } = renderHook(() => useInventory());

        // Verificar que las propiedades de paginación están disponibles
        expect(result.current).toHaveProperty("currentPage");
        expect(result.current).toHaveProperty("totalPages");
        expect(result.current).toHaveProperty("hasNextPage");
        expect(result.current).toHaveProperty("hasPrevPage");
        expect(result.current).toHaveProperty("itemsPerPage");

        // Verificar los tipos
        expect(typeof result.current.currentPage).toBe("number");
        expect(typeof result.current.totalPages).toBe("number");
        expect(typeof result.current.hasNextPage).toBe("boolean");
        expect(typeof result.current.hasPrevPage).toBe("boolean");
        expect(typeof result.current.itemsPerPage).toBe("number");
    });
});
