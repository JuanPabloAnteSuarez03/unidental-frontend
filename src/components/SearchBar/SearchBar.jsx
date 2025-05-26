// src/components/SearchBar/SearchBar.jsx
const SearchBar = ({
  searchText,
  searchCode,
  searchCategory,
  onSearchTextChange,
  onSearchCodeChange,
  onSearchCategoryChange,
  onClearFilters,
  filteredCount,
  totalProducts,
}) => {
  return (
    <div
      style={{
        backgroundColor: "#f8f9fa",
        padding: "20px",
        borderRadius: "8px",
        marginBottom: "20px",
        border: "1px solid #dee2e6",
      }}
    >
      {/* Título y contador */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "15px",
        }}
      >
        <h3
          style={{
            margin: 0,
            color: "#2c3e50",
            fontSize: "18px",
            fontWeight: "600",
          }}
        >
          Buscar Productos
        </h3>
        <span
          style={{
            color: "#6c757d",
            fontSize: "14px",
            fontWeight: "500",
          }}
        >
          {filteredCount} de {totalProducts} productos
        </span>
      </div>

      {/* Campos de búsqueda */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "15px",
          marginBottom: "15px",
        }}
      >
        {/* Campo de búsqueda por texto (nombre/marca) */}
        <div>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontSize: "14px",
              fontWeight: "500",
              color: "#495057",
            }}
          >
            Nombre o Marca
          </label>
          <input
            type="text"
            placeholder="Buscar por nombre o marca..."
            value={searchText}
            onChange={(e) => onSearchTextChange(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #ced4da",
              borderRadius: "6px",
              fontSize: "14px",
              transition: "border-color 0.2s ease",
              outline: "none",
              boxSizing: "border-box",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#007bff")}
            onBlur={(e) => (e.target.style.borderColor = "#ced4da")}
          />
        </div>

        {/* Campo de búsqueda por código */}
        <div>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontSize: "14px",
              fontWeight: "500",
              color: "#495057",
            }}
          >
            Código de Producto
          </label>
          <input
            type="text"
            placeholder="Buscar por código..."
            value={searchCode}
            onChange={(e) => onSearchCodeChange(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #ced4da",
              borderRadius: "6px",
              fontSize: "14px",
              transition: "border-color 0.2s ease",
              outline: "none",
              boxSizing: "border-box",
              fontFamily: "monospace",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#007bff")}
            onBlur={(e) => (e.target.style.borderColor = "#ced4da")}
          />
        </div>

        {/* Campo de búsqueda por categoría */}
        <div>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontSize: "14px",
              fontWeight: "500",
              color: "#495057",
            }}
          >
            Categoría
          </label>
          <input
            type="text"
            placeholder="Buscar por categoría..."
            value={searchCategory}
            onChange={(e) => onSearchCategoryChange(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #ced4da",
              borderRadius: "6px",
              fontSize: "14px",
              transition: "border-color 0.2s ease",
              outline: "none",
              boxSizing: "border-box",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#007bff")}
            onBlur={(e) => (e.target.style.borderColor = "#ced4da")}
          />
        </div>
      </div>

      {/* Botón para limpiar filtros */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={onClearFilters}
          disabled={!searchText && !searchCode && !searchCategory}
          style={{
            padding: "8px 16px",
            backgroundColor:
              searchText || searchCode || searchCategory
                ? "#6c757d"
                : "#e9ecef",
            color:
              searchText || searchCode || searchCategory
                ? "#ffffff"
                : "#6c757d",
            border: "none",
            borderRadius: "6px",
            fontSize: "14px",
            fontWeight: "500",
            cursor:
              searchText || searchCode || searchCategory
                ? "pointer"
                : "not-allowed",
            transition: "all 0.2s ease",
          }}
          onMouseOver={(e) => {
            if (searchText || searchCode || searchCategory) {
              e.target.style.backgroundColor = "#5a6268";
            }
          }}
          onMouseOut={(e) => {
            if (searchText || searchCode || searchCategory) {
              e.target.style.backgroundColor = "#6c757d";
            }
          }}
        >
          Limpiar Filtros
        </button>
      </div>
    </div>
  );
};

export default SearchBar;
