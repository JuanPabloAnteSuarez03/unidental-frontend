import React from "react";

const SkuConfigForm = ({
  formData,
  handleInputChange,
  getAvailableSkuCategorias,
  getAvailableSubcategorias,
  getAvailableTipos,
  isLoadingCategories,
  isLoadingSkuData,
  onCreateSkuCategory,
  onCreateSkuSubcategory,
  onCreateSkuType,
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
      <h3
        style={{
          margin: "0 0 20px 0",
          color: "#495057",
          fontSize: "18px",
          fontWeight: "600",
        }}
      >
        Configuración SKU
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "20px",
        }}
      >
        {/* Categoría SKU */}
        <div>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "500",
              color: "#495057",
            }}
          >
            Categoría SKU *
          </label>
          <div style={{ display: "flex", gap: "8px" }}>
            <select
              name="sku_categoria"
              value={formData.sku_categoria || ""}
              onChange={handleInputChange}
              required
              disabled={isLoadingCategories}
              style={{
                flex: 1,
                padding: "10px",
                border: "1px solid #ced4da",
                borderRadius: "4px",
                fontSize: "14px",
                backgroundColor: isLoadingCategories ? "#f8f9fa" : "white",
              }}
            >
              <option value="">
                {isLoadingCategories ? "Cargando..." : "Seleccionar categoría"}
              </option>
              {getAvailableSkuCategorias().map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.code} - {categoria.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={onCreateSkuCategory}
              disabled={isLoadingCategories}
              style={{
                padding: "10px 12px",
                border: "1px solid #007bff",
                borderRadius: "4px",
                backgroundColor: "#007bff",
                color: "white",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "bold",
              }}
              title="Crear nueva categoría"
            >
              +
            </button>
          </div>
        </div>

        {/* Subcategoría SKU */}
        <div>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "500",
              color: "#495057",
            }}
          >
            Subcategoría SKU *
          </label>
          <div style={{ display: "flex", gap: "8px" }}>
            <select
              name="sku_subcategoria"
              value={formData.sku_subcategoria || ""}
              onChange={handleInputChange}
              required
              disabled={isLoadingSkuData || !formData.sku_categoria}
              style={{
                flex: 1,
                padding: "10px",
                border: "1px solid #ced4da",
                borderRadius: "4px",
                fontSize: "14px",
                backgroundColor:
                  isLoadingSkuData || !formData.sku_categoria
                    ? "#f8f9fa"
                    : "white",
              }}
            >
              <option value="">
                {!formData.sku_categoria
                  ? "Selecciona categoría primero"
                  : isLoadingSkuData
                  ? "Cargando..."
                  : "Seleccionar subcategoría"}
              </option>
              {getAvailableSubcategorias().map((subcategoria) => (
                <option key={subcategoria.id} value={subcategoria.id}>
                  {subcategoria.code} - {subcategoria.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={onCreateSkuSubcategory}
              disabled={isLoadingSkuData || !formData.sku_categoria}
              style={{
                padding: "10px 12px",
                border: "1px solid #007bff",
                borderRadius: "4px",
                backgroundColor: formData.sku_categoria ? "#007bff" : "#6c757d",
                color: "white",
                cursor: formData.sku_categoria ? "pointer" : "not-allowed",
                fontSize: "14px",
                fontWeight: "bold",
              }}
              title="Crear nueva subcategoría"
            >
              +
            </button>
          </div>
        </div>

        {/* Tipo SKU */}
        <div>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "500",
              color: "#495057",
            }}
          >
            Tipo SKU *
          </label>
          <div style={{ display: "flex", gap: "8px" }}>
            <select
              name="sku_tipo"
              value={formData.sku_tipo || ""}
              onChange={handleInputChange}
              required
              disabled={isLoadingSkuData || !formData.sku_subcategoria}
              style={{
                flex: 1,
                padding: "10px",
                border: "1px solid #ced4da",
                borderRadius: "4px",
                fontSize: "14px",
                backgroundColor:
                  isLoadingSkuData || !formData.sku_subcategoria
                    ? "#f8f9fa"
                    : "white",
              }}
            >
              <option value="">
                {!formData.sku_subcategoria
                  ? "Selecciona subcategoría primero"
                  : isLoadingSkuData
                  ? "Cargando..."
                  : "Seleccionar tipo"}
              </option>
              {getAvailableTipos().map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.code} - {tipo.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={onCreateSkuType}
              disabled={isLoadingSkuData || !formData.sku_subcategoria}
              style={{
                padding: "10px 12px",
                border: "1px solid #007bff",
                borderRadius: "4px",
                backgroundColor: formData.sku_subcategoria ? "#007bff" : "#6c757d",
                color: "white",
                cursor: formData.sku_subcategoria ? "pointer" : "not-allowed",
                fontSize: "14px",
                fontWeight: "bold",
              }}
              title="Crear nuevo tipo"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkuConfigForm; 