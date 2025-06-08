// src/pages/InventoryPage.jsx
import React from "react"; // Importa React
import useInventory from "../hooks/useInventory"; // [cite: src/hooks/useInventory.js]
import InventoryTable from "../components/Table/InventoryTable"; // [cite: src/components/Table/InventoryTable.jsx]
import Pagination from "../components/Pagination/Pagination"; // [cite: src/components/Pagination/Pagination.jsx]
import SearchFiltersContainer from "../components/SearchFilters/SearchFiltersContainer";

const InventoryPage = () => {
    // Utilizamos el hook personalizado para obtener toda la lógica de inventario
    const {
        // Datos procesados y de estado de la API
        filteredProducts, // Productos de la página actual, ya filtrados por API
        totalGeneralProducts, // Total general de productos sin filtros

        // Paginación
        isLoading,
        error,
        goToNextPage,
        goToPrevPage,
        goToPage, // Nueva función para ir a una página específica
        hasNextPage,
        hasPrevPage,
        currentPage,
        totalPages, // Total de páginas disponibles

        // Filtros
        searchByName,
        nameFilter,

        // Filtro de categorías
        selectedCategories,
        availableCategories,
        updateSelectedCategories,

        // Reseteo de filtros
        resetAllFilters,
    } = useInventory(); // [cite: src/hooks/useInventory.js]

    // Manejador para la búsqueda global
    const handleSearch = (filters) => {
        console.log("Aplicando filtros:", filters);

        // Filtro de nombre
        searchByName(filters.name);

        // Filtro de categorías
        updateSelectedCategories(filters.categories);

        console.log(
            "Filtros aplicados - Nombre:",
            filters.name,
            "Categorías:",
            filters.categories
        );
    };

    return (
        <div
            style={{
                padding: "20px",
                maxWidth: "1400px",
                margin: "0 auto",
                fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", // Fuente más moderna
            }}
        >
            {/* Título de la página */}
            <div
                style={{
                    marginBottom: "30px",
                    borderBottom: "2px solid #eee",
                    paddingBottom: "15px",
                }}
            >
                <h1
                    style={{
                        color: "#2c3e50",
                        fontSize: "28px",
                        fontWeight: "700",
                        margin: "0 0 8px 0",
                    }}
                >
                    Gestión de Inventario
                </h1>
                <p
                    style={{
                        color: "#6c757d",
                        fontSize: "16px",
                        margin: 0,
                    }}
                >
                    Administra y consulta el inventario de productos (
                    {totalGeneralProducts !== undefined
                        ? totalGeneralProducts
                        : 0}{" "}
                    en total)
                </p>
            </div>

            {/* Estado de Error */}
            {error && (
                <div
                    style={{
                        textAlign: "center",
                        padding: "20px",
                        fontSize: "18px",
                        color: "red",
                        border: "1px solid red",
                        borderRadius: "4px",
                        backgroundColor: "#ffebee",
                        marginBottom: "20px",
                    }}
                >
                    Error al cargar productos: {error}
                </div>
            )}

            {/* Componente de búsqueda y filtros */}
            <SearchFiltersContainer
                onSearch={handleSearch}
                onReset={resetAllFilters}
                nameFilter={nameFilter}
                selectedCategories={selectedCategories}
                availableCategories={availableCategories}
                isCategoriesLoading={
                    isLoading && availableCategories.length === 0
                }
            />

            {/* Tabla de inventario y Controles de Paginación (solo si no hay error o si hay productos) */}
            {!error && (
                <>
                    <InventoryTable
                        products={filteredProducts}
                        isLoading={isLoading}
                    />
                    {/* Nuevo componente de paginación */}
                    {totalGeneralProducts > 0 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            goToPage={goToPage}
                            goToNextPage={goToNextPage}
                            goToPrevPage={goToPrevPage}
                            hasNextPage={hasNextPage}
                            hasPrevPage={hasPrevPage}
                            isLoading={isLoading}
                            totalItems={totalGeneralProducts}
                        />
                    )}
                </>
            )}
            {/* Mensaje si no hay productos en total después de aplicar filtros y no hay error */}
            {!isLoading && !error && totalGeneralProducts === 0 && (
                <div
                    style={{
                        textAlign: "center",
                        padding: "40px 20px",
                        backgroundColor: "#f8f9fa",
                        borderRadius: "8px",
                        border: "1px solid #dee2e6",
                        marginTop: "20px",
                    }}
                >
                    <p
                        style={{
                            color: "#6c757d",
                            fontSize: "16px",
                            margin: 0,
                        }}
                    >
                        No se encontraron productos.
                    </p>
                </div>
            )}
        </div>
    );
};

export default InventoryPage;
