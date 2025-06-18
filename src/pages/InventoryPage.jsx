// src/pages/InventoryPage.jsx
import React from "react";
import useInventory from "../hooks/useInventory";
import InventoryHeader from "../components/Inventory/InventoryHeader";
import ErrorMessage from "../components/Inventory/ErrorMessage";
import InventoryFilters from "../components/Inventory/InventoryFilters";
import InventoryContent from "../components/Inventory/InventoryContent";
import InventoryStyles from "../components/Inventory/InventoryStyles";

const InventoryPage = () => {
    // Utilizamos el hook personalizado para obtener toda la lógica de inventario
    const {
        // Datos procesados y de estado de la API
        filteredProducts, // Productos de la página actual, ya filtrados por API
        totalGeneralProducts, // Total general de productos sin filtros

        // Paginación
        isLoading,
        isStockLoading, // ✨ Nuevo estado para carga de stock separado
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

        // ✨ NUEVO: Filtro por SKU
        searchBySku,
        skuFilter,

        // Filtro de categorías
        selectedCategories,
        availableCategories,
        updateSelectedCategories,

        // Reseteo de filtros
        resetAllFilters,
    } = useInventory(); // [cite: src/hooks/useInventory.js]

    // Manejador para la búsqueda global
    const handleSearch = (filters) => {
        // Filtro de nombre
        searchByName(filters.name);

        // ✨ NUEVO: Filtro de SKU
        searchBySku(filters.sku);

        // Filtro de categorías
        updateSelectedCategories(filters.categories);
    };

    return (
        <>
            {/* CSS para animación del spinner y responsive design */}
            <InventoryStyles />

            <div
                className="inventory-container"
                style={{
                    padding: "20px",
                    maxWidth: "1400px",
                    margin: "0 auto",
                    fontFamily:
                        "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                    backgroundColor: "#f8f9fa",
                    minHeight: "calc(100vh - 140px)",
                }}
            >
                {/* Título de la página */}
                <InventoryHeader totalGeneralProducts={totalGeneralProducts} />

                {/* Estado de Error */}
                <ErrorMessage error={error} />

                {/* Componente de búsqueda y filtros */}
                <InventoryFilters
                    onSearch={handleSearch}
                    onReset={resetAllFilters}
                    nameFilter={nameFilter}
                    skuFilter={skuFilter} // ✨ NUEVO: Pasar skuFilter
                    selectedCategories={selectedCategories}
                    availableCategories={availableCategories}
                />

                {/* Tabla de inventario y paginación */}
                <InventoryContent
                    filteredProducts={filteredProducts}
                    isLoading={isLoading}
                    isStockLoading={isStockLoading}
                    totalGeneralProducts={totalGeneralProducts}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    goToPage={goToPage}
                    goToNextPage={goToNextPage}
                    goToPrevPage={goToPrevPage}
                    hasNextPage={hasNextPage}
                    hasPrevPage={hasPrevPage}
                    error={error}
                />
            </div>
        </>
    );
};

export default InventoryPage;
