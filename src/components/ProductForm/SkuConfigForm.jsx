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
  const buttonStyle = {
    marginLeft: "8px",
    padding: "8px 12px",
    backgroundColor: "#28a745",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "36px",
    height: "36px",
  };

  const containerStyle = {
    display: "flex",
    alignItems: "flex-end",
    gap: "8px",
  };

  const selectWrapperStyle = {
    flex: 1,
  };

  return (
    <div
      style={{
        backgroundColor: "#f8f9fa",
        padding: "20px",
        borderRadius: "8px",
        marginBottom: "20px",
        border: "1px solid #e9ecef",
      }}
    >
      <h3
        style={{
          marginTop: "0",
          marginBottom: "20px",
          color: "#2c3e50",
          fontSize: "18px",
          fontWeight: "600",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        🏷️ Configuración SKU
      </h3>

      {/* Categoría SKU */}
      <div style={{ marginBottom: "15px" }}>
        <label
          htmlFor="sku_categoria"
          style={{
            display: "block",
            marginBottom: "8px",
            fontWeight: "600",
            color: "#2c3e50",
            fontSize: "14px",
            letterSpacing: "0.3px",
            textTransform: "uppercase",
            position: "relative",
            paddingLeft: "12px",
          }}
        >
          <span
            style={{
              position: "absolute",
              left: "0",
              top: "50%",
              transform: "translateY(-50%)",
              width: "3px",
              height: "14px",
              backgroundColor: "#e74c3c",
              borderRadius: "2px",
            }}
          ></span>
          📂 Categoría SKU *
        </label>
        <div style={containerStyle}>
          <div style={selectWrapperStyle}>
            <select
              id="sku_categoria"
              name="sku_categoria"
              value={formData.sku_categoria}
              onChange={handleInputChange}
              required
              disabled={isLoadingCategories || isLoadingSkuData}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "4px",
                border: "1px solid #ced4da",
                fontSize: "16px",
                boxSizing: "border-box",
                backgroundColor: (isLoadingCategories || isLoadingSkuData) ? "#f8f9fa" : "#ffffff",
              }}
            >
              <option value="">
                {(isLoadingCategories || isLoadingSkuData)
                  ? "Cargando categorías..."
                  : "Seleccione una categoría"}
              </option>
              {getAvailableSkuCategorias().map((category) => (
                <option key={category.id} value={category.id}>
                  {category.code} - {category.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => onCreateSkuCategory()}
            disabled={isLoadingCategories}
            style={{
              ...buttonStyle,
              backgroundColor: isLoadingCategories ? "#6c757d" : "#28a745",
              cursor: isLoadingCategories ? "not-allowed" : "pointer",
            }}
            title="Crear nueva categoría SKU"
          >
            +
          </button>
        </div>
      </div>

      {/* Subcategoría SKU */}
      <div style={{ marginBottom: "15px" }}>
        <label
          htmlFor="sku_subcategoria"
          style={{
            display: "block",
            marginBottom: "8px",
            fontWeight: "600",
            color: "#2c3e50",
            fontSize: "14px",
            letterSpacing: "0.3px",
            textTransform: "uppercase",
            position: "relative",
            paddingLeft: "12px",
          }}
        >
          <span
            style={{
              position: "absolute",
              left: "0",
              top: "50%",
              transform: "translateY(-50%)",
              width: "3px",
              height: "14px",
              backgroundColor: "#e74c3c",
              borderRadius: "2px",
            }}
          ></span>
          📋 Subcategoría SKU *
        </label>
        <div style={containerStyle}>
          <div style={selectWrapperStyle}>
            <select
              id="sku_subcategoria"
              name="sku_subcategoria"
              value={formData.sku_subcategoria}
              onChange={handleInputChange}
              required
              disabled={!formData.sku_categoria || isLoadingSkuData}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "4px",
                border: "1px solid #ced4da",
                fontSize: "16px",
                boxSizing: "border-box",
                backgroundColor: (!formData.sku_categoria || isLoadingSkuData) ? "#f8f9fa" : "#ffffff",
              }}
            >
              <option value="">
                {!formData.sku_categoria
                  ? "Primero seleccione una categoría"
                  : isLoadingSkuData 
                  ? "Cargando subcategorías..."
                  : "Seleccione subcategoría SKU"}
              </option>
              {getAvailableSubcategorias().map((subcategory) => (
                <option key={subcategory.id} value={subcategory.id}>
                  {subcategory.code} - {subcategory.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => onCreateSkuSubcategory()}
            disabled={!formData.sku_categoria || isLoadingSkuData}
            style={{
              ...buttonStyle,
              backgroundColor: (!formData.sku_categoria || isLoadingSkuData) ? "#6c757d" : "#28a745",
              cursor: (!formData.sku_categoria || isLoadingSkuData) ? "not-allowed" : "pointer",
            }}
            title="Crear nueva subcategoría SKU"
          >
            +
          </button>
        </div>
      </div>

      {/* Tipo/Material SKU */}
      <div style={{ marginTop: "15px" }}>
        <label
          htmlFor="sku_tipo"
          style={{
            display: "block",
            marginBottom: "8px",
            fontWeight: "600",
            color: "#2c3e50",
            fontSize: "14px",
            letterSpacing: "0.3px",
            textTransform: "uppercase",
            position: "relative",
            paddingLeft: "12px",
          }}
        >
          <span
            style={{
              position: "absolute",
              left: "0",
              top: "50%",
              transform: "translateY(-50%)",
              width: "3px",
              height: "14px",
              backgroundColor: "#e74c3c",
              borderRadius: "2px",
            }}
          ></span>
          🧪 Tipo/Material SKU *
        </label>
        <div style={containerStyle}>
          <div style={selectWrapperStyle}>
            <select
              id="sku_tipo"
              name="sku_tipo"
              value={formData.sku_tipo}
              onChange={handleInputChange}
              required
              disabled={!formData.sku_subcategoria || isLoadingSkuData}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "4px",
                border: "1px solid #ced4da",
                fontSize: "16px",
                boxSizing: "border-box",
                backgroundColor: (!formData.sku_subcategoria || isLoadingSkuData) ? "#f8f9fa" : "#ffffff",
              }}
            >
              <option value="">
                {!formData.sku_subcategoria
                  ? "Primero seleccione una subcategoría"
                  : isLoadingSkuData
                  ? "Cargando tipos..."
                  : "Seleccione tipo/material SKU"}
              </option>
              {getAvailableTipos().map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.code} - {tipo.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => onCreateSkuType()}
            disabled={!formData.sku_subcategoria || isLoadingSkuData}
            style={{
              ...buttonStyle,
              backgroundColor: (!formData.sku_subcategoria || isLoadingSkuData) ? "#6c757d" : "#28a745",
              cursor: (!formData.sku_subcategoria || isLoadingSkuData) ? "not-allowed" : "pointer",
            }}
            title="Crear nuevo tipo/material SKU"
          >
            +
          </button>
        </div>
      </div>

      <div
        style={{
          marginTop: "15px",
          padding: "12px",
          backgroundColor: "#e8f4f8",
          borderRadius: "4px",
          fontSize: "14px",
          color: "#1f5582",
          border: "1px solid #bee5eb",
        }}
      >
        <strong>💡 Tip:</strong> Los campos de categoría, subcategoría y tipo son
        necesarios para generar el SKU automático. Use los botones "+" para crear
        nuevas opciones si no encuentra lo que busca.
      </div>
    </div>
  );
};

export default React.memo(SkuConfigForm);
