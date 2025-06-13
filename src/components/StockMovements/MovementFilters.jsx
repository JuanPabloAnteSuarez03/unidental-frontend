import React from "react";

const MovementFilters = ({
  filters,
  handleFilterChange,
  locations,
  isLoadingLocations,
  movementTypes,
  clearFilters,
  applyFilters,
}) => {
  return (
    <div
      style={{
        backgroundColor: "#fff",
        borderRadius: "12px",
        padding: "24px",
        marginBottom: "24px",
        border: "1px solid #e9ecef",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            backgroundColor: "#f8f9fa",
            borderRadius: "8px",
            padding: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: "20px" }}>🔍</span>
        </div>
        <h3
          style={{
            fontSize: "20px",
            fontWeight: "600",
            margin: "0",
            color: "#2c3e50",
          }}
        >
          Filtros de Búsqueda
        </h3>
      </div>

      {/* Filtros de fecha */}
      <div style={{ marginBottom: "20px" }}>
        <h4
          style={{
            fontSize: "16px",
            fontWeight: "600",
            color: "#495057",
            marginBottom: "12px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          📅 Rango de Fechas
        </h4>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
          }}
        >
          <div>
            <label
              htmlFor="dateFrom"
              style={{
                display: "block",
                marginBottom: "6px",
                fontWeight: "500",
                fontSize: "14px",
                color: "#495057",
              }}
            >
              Desde:
            </label>
            <input
              type="date"
              id="dateFrom"
              name="dateFrom"
              value={filters.dateFrom}
              onChange={handleFilterChange}
              style={{
                width: "180px",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "2px solid #e9ecef",
                fontSize: "14px",
                fontWeight: "500",
                transition: "all 0.2s ease",
                outline: "none",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#2c3e50";
                e.target.style.boxShadow = "0 0 0 3px rgba(44, 62, 80, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e9ecef";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          <div>
            <label
              htmlFor="dateTo"
              style={{
                display: "block",
                marginBottom: "6px",
                fontWeight: "500",
                fontSize: "14px",
                color: "#495057",
              }}
            >
              Hasta:
            </label>
            <input
              type="date"
              id="dateTo"
              name="dateTo"
              value={filters.dateTo}
              onChange={handleFilterChange}
              style={{
                width: "180px",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "2px solid #e9ecef",
                fontSize: "14px",
                fontWeight: "500",
                transition: "all 0.2s ease",
                outline: "none",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#2c3e50";
                e.target.style.boxShadow = "0 0 0 3px rgba(44, 62, 80, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e9ecef";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>
        </div>
      </div>

      {/* Filtros de ubicación y tipo */}
      <div style={{ marginBottom: "20px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
          }}
        >
          {/* Filtro de Ubicación */}
          <div>
            <label
              htmlFor="locationFilter"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                marginBottom: "6px",
                fontWeight: "500",
                fontSize: "14px",
                color: "#495057",
              }}
            >
              📍 Ubicación:
            </label>
            <select
              id="locationFilter"
              name="locationFilter"
              value={filters.locationFilter}
              onChange={handleFilterChange}
              disabled={isLoadingLocations}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "8px",
                border: "2px solid #e9ecef",
                fontSize: "14px",
                fontWeight: "500",
                backgroundColor: isLoadingLocations ? "#f8f9fa" : "#fff",
                cursor: isLoadingLocations ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
                outline: "none",
              }}
              onFocus={(e) => {
                if (!isLoadingLocations) {
                  e.target.style.borderColor = "#2c3e50";
                  e.target.style.boxShadow = "0 0 0 3px rgba(44, 62, 80, 0.1)";
                }
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e9ecef";
                e.target.style.boxShadow = "none";
              }}
            >
              <option value="">
                {isLoadingLocations
                  ? "Cargando ubicaciones..."
                  : "Todas las ubicaciones"}
              </option>
              {locations.map((location) => (
                <option
                  key={location.id || location.name}
                  value={location.id || location.name}
                >
                  {location.name || location}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro de Tipo de Movimiento */}
          <div>
            <label
              htmlFor="movementTypeFilter"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                marginBottom: "6px",
                fontWeight: "500",
                fontSize: "14px",
                color: "#495057",
              }}
            >
              🔄 Tipo de Movimiento:
            </label>
            <select
              id="movementTypeFilter"
              name="movementTypeFilter"
              value={filters.movementTypeFilter}
              onChange={handleFilterChange}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "8px",
                border: "2px solid #e9ecef",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                transition: "all 0.2s ease",
                outline: "none",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#2c3e50";
                e.target.style.boxShadow = "0 0 0 3px rgba(44, 62, 80, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e9ecef";
                e.target.style.boxShadow = "none";
              }}
            >
              <option value="">Todos los tipos</option>
              {movementTypes.map((type, index) => (
                <option key={index} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Barra de búsqueda general */}
      <div style={{ marginBottom: "24px" }}>
        <label
          htmlFor="searchQuery"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            marginBottom: "6px",
            fontWeight: "500",
            fontSize: "14px",
            color: "#495057",
          }}
        >
          🔎 Búsqueda general:
        </label>
        <input
          type="text"
          id="searchQuery"
          name="searchQuery"
          value={filters.searchQuery}
          onChange={handleFilterChange}
          style={{
            width: "100%",
            maxWidth: "100%",
            boxSizing: "border-box",
            padding: "12px 16px",
            borderRadius: "8px",
            border: "2px solid #e9ecef",
            fontSize: "14px",
            fontWeight: "400",
            transition: "all 0.2s ease",
            outline: "none",
          }}
          placeholder="Buscar por SKU, nombre de producto, notas..."
          onFocus={(e) => {
            e.target.style.borderColor = "#2c3e50";
            e.target.style.boxShadow = "0 0 0 3px rgba(44, 62, 80, 0.1)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "#e9ecef";
            e.target.style.boxShadow = "none";
          }}
        />
      </div>

      {/* Botones de acción para filtros */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          justifyContent: "flex-end",
          paddingTop: "16px",
          borderTop: "1px solid #e9ecef",
        }}
      >
        <button
          onClick={clearFilters}
          style={{
            backgroundColor: "#f8f9fa",
            color: "#6c757d",
            border: "2px solid #e9ecef",
            borderRadius: "8px",
            padding: "10px 20px",
            fontSize: "14px",
            cursor: "pointer",
            fontWeight: "500",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "#e9ecef";
            e.target.style.borderColor = "#ced4da";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "#f8f9fa";
            e.target.style.borderColor = "#e9ecef";
          }}
        >
          🗑️ Limpiar Filtros
        </button>
        <button
          onClick={applyFilters}
          style={{
            backgroundColor: "#2c3e50",
            color: "white",
            border: "2px solid #2c3e50",
            borderRadius: "8px",
            padding: "10px 20px",
            fontSize: "14px",
            cursor: "pointer",
            fontWeight: "500",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "#34495e";
            e.target.style.borderColor = "#34495e";
            e.target.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "#2c3e50";
            e.target.style.borderColor = "#2c3e50";
            e.target.style.transform = "translateY(0)";
          }}
        >
          ✅ Aplicar Filtros
        </button>
      </div>
    </div>
  );
};

export default MovementFilters;
