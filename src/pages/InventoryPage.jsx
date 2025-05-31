// src/pages/InventoryPage.jsx
import React from "react"; // Importa React
import useInventory from "../hooks/useInventory"; // [cite: src/hooks/useInventory.js]
import SearchBar from "../components/SearchBar/SearchBar"; // [cite: src/components/SearchBar/SearchBar.jsx]
import InventoryTable from "../components/Table/InventoryTable"; // [cite: src/components/Table/InventoryTable.jsx]
import Pagination from "../components/Pagination/Pagination"; // [cite: src/components/Pagination/Pagination.jsx]

const InventoryPage = () => {
    // Utilizamos el hook personalizado para obtener toda la lógica de inventario
    const {
        // Estados de búsqueda
        searchText,
        searchCode,
        searchCategory,

        // Estado de ordenamiento
        sortConfig,

        // Funciones para actualizar estados de búsqueda y ordenamiento
        updateSearchText,
        updateSearchCode,
        updateSearchCategory,
        handleSort,
        clearFilters,

        // Datos procesados y de estado de la API
        filteredProducts, // Productos de la página actual, ya filtrados por API y ordenados localmente
        totalProducts, // Total de productos que coinciden con los filtros (de la API)
        totalGeneralProducts, // Total general de productos sin filtros
        // filteredCount, // Este ahora representa los items en la página actual después del sort local

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
    } = useInventory(); // [cite: src/hooks/useInventory.js]

    // Determinar qué contador mostrar en la cabecera
    const displayCount =
        searchText || searchCode || searchCategory
            ? totalProducts
            : totalGeneralProducts;

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
                    {displayCount !== undefined ? displayCount : 0} en total)
                </p>
            </div>
            {/* Componente de búsqueda */}
            <SearchBar
                searchText={searchText}
                searchCode={searchCode}
                searchCategory={searchCategory}
                onSearchTextChange={updateSearchText}
                onSearchCodeChange={updateSearchCode}
                onSearchCategoryChange={updateSearchCategory}
                onClearFilters={clearFilters}
                // Actualizado para usar los contadores correctos
                filteredCount={totalProducts || 0} // Productos que coinciden con el filtro actual
                totalProducts={totalGeneralProducts || 0} // Total general de productos
            />{" "}
            {/* [cite: src/components/SearchBar/SearchBar.jsx] */}
            {/* Estado de Carga */}
            {isLoading && (
                <div
                    style={{
                        textAlign: "center",
                        padding: "20px",
                        fontSize: "18px",
                        color: "#007bff",
                    }}
                >
                    Cargando productos...
                </div>
            )}
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
                    }}
                >
                    Error al cargar productos: {error}
                </div>
            )}
            {/* Tabla de inventario y Controles de Paginación (solo si no hay error y no está cargando O si hay productos) */}
            {!error && (
                <>
                    <InventoryTable
                        products={filteredProducts} // Le pasas los productos de la página actual
                        sortConfig={sortConfig}
                        onSort={handleSort}
                    />{" "}
                    {/* [cite: src/components/Table/InventoryTable.jsx] */}
                    {/* Nuevo componente de paginación */}
                    {totalProducts > 0 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            goToPage={goToPage}
                            goToNextPage={goToNextPage}
                            goToPrevPage={goToPrevPage}
                            hasNextPage={hasNextPage}
                            hasPrevPage={hasPrevPage}
                            isLoading={isLoading}
                        />
                    )}
                </>
            )}
            {/* Mensaje si no hay productos en total después de aplicar filtros y no hay error */}
            {!isLoading && !error && totalProducts === 0 && (
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
                        No se encontraron productos que coincidan con los
                        filtros de búsqueda.
                    </p>
                </div>
            )}
        </div>
    );
};

export default InventoryPage;
