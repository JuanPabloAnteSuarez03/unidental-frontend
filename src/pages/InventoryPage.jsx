// src/pages/InventoryPage.jsx
import useInventory from "../hooks/useInventory";
import SearchBar from "../components/SearchBar/SearchBar";
import InventoryTable from "../components/Table/InventoryTable";

const InventoryPage = () => {
  // Utilizamos el hook personalizado para obtener toda la lógica de inventario
  const {
    // Estados de búsqueda
    searchText,
    searchCode,
    searchCategory,

    // Estado de ordenamiento
    sortConfig,

    // Funciones para actualizar estados
    updateSearchText,
    updateSearchCode,
    updateSearchCategory,
    handleSort,
    clearFilters,

    // Datos procesados
    filteredProducts,
    totalProducts,
    filteredCount,
  } = useInventory();

  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "1400px",
        margin: "0 auto",
      }}
    >
      {/* Título de la página */}
      <div style={{ marginBottom: "30px" }}>
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
          Administra y consulta el inventario de productos
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
        filteredCount={filteredCount}
        totalProducts={totalProducts}
      />

      {/* Tabla de inventario con productos filtrados y ordenados */}
      <InventoryTable
        products={filteredProducts}
        sortConfig={sortConfig}
        onSort={handleSort}
      />
    </div>
  );
};

export default InventoryPage;
