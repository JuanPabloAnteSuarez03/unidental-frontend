import React from "react";

const SkuConfigForm = ({
  formData,
  handleInputChange,
  categories,
  isLoadingCategories,
  getAvailableSubcategorias,
  getAvailableTipos,
  skuValidation,
  handleGenerateNextSku,
  isGeneratingSku,
  getSkuRequirements,
  handleValidateSku,
  isValidatingSku,
  skuInfo,
  getAvailableSkuCategorias,
}) => {
  return (
    <div style={{ marginBottom: "40px" }}>
      {/* Separador visual */}
      <div
        style={{
          width: "100%",
          height: "1px",
          background:
            "linear-gradient(to right, transparent, #e9ecef, transparent)",
          marginBottom: "32px",
        }}
      ></div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "24px",
          padding: "16px 20px",
          background: "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)",
          borderRadius: "12px",
          color: "white",
        }}
      >
        <div
          style={{
            background: "rgba(255, 255, 255, 0.2)",
            width: "40px",
            height: "40px",
            borderRadius: "10px",
            marginRight: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          }}
        >
          <span style={{ color: "white", fontSize: "24px" }}>🔧</span>
        </div>
        <div>
          <h3
            style={{
              color: "white",
              fontSize: "20px",
              fontWeight: "600",
              margin: 0,
              letterSpacing: "-0.3px",
            }}
          >
            Configuración de SKU
          </h3>
          <p
            style={{
              color: "rgba(255, 255, 255, 0.9)",
              fontSize: "14px",
              margin: "4px 0 0 0",
            }}
          >
            Código único y configuración del producto
          </p>
        </div>
      </div>

      {/* Sistema de categorías SKU */}
      <div style={{ marginBottom: "20px" }}>
        <h4
          style={{
            color: "#2c3e50",
            fontSize: "16px",
            fontWeight: "600",
            marginBottom: "15px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: "3px",
              height: "16px",
              backgroundColor: "#e74c3c",
              marginRight: "8px",
              borderRadius: "2px",
            }}
          />
          Campos Requeridos para SKU
        </h4>

        {/* Categoría del Producto / SKU */}
        <div>
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
            🏷️ Categoría del Producto *
          </label>
          <select
            id="sku_categoria"
            name="sku_categoria"
            value={formData.sku_categoria}
            onChange={handleInputChange}
            required
            disabled={isLoadingCategories}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "4px",
              border: "1px solid #ced4da",
              fontSize: "16px",
              boxSizing: "border-box",
              backgroundColor: isLoadingCategories ? "#f8f9fa" : "#ffffff",
            }}
          >
            <option value="">
              {isLoadingCategories
                ? "Cargando categorías..."
                : "Seleccione una categoría"}
            </option>
            {Object.entries(getAvailableSkuCategorias()).map(([key, value]) => (
              <option key={key} value={key}>
                {key} - {value}
              </option>
            ))}
          </select>
        </div>

        {/* Subcategoría SKU */}
        <div style={{ marginTop: "15px" }}>
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
            🔖 Subcategoría SKU *
          </label>
          <select
            id="sku_subcategoria"
            name="sku_subcategoria"
            value={formData.sku_subcategoria}
            onChange={handleInputChange}
            required
            disabled={!formData.sku_categoria}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "4px",
              border: "1px solid #ced4da",
              fontSize: "16px",
              boxSizing: "border-box",
              backgroundColor: !formData.sku_categoria ? "#f8f9fa" : "#ffffff",
            }}
          >
            <option value="">
              {!formData.sku_categoria
                ? "Primero seleccione una categoría"
                : "Seleccione subcategoría SKU"}
            </option>
            {Object.entries(getAvailableSubcategorias()).map(([key, value]) => (
              <option key={key} value={key}>
                {key} - {value}
              </option>
            ))}
          </select>
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
          <select
            id="sku_tipo"
            name="sku_tipo"
            value={formData.sku_tipo}
            onChange={handleInputChange}
            required
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "4px",
              border: "1px solid #ced4da",
              fontSize: "16px",
              boxSizing: "border-box",
            }}
          >
            <option value="">Seleccione tipo/material SKU</option>
            {Object.entries(getAvailableTipos()).map(([key, value]) => (
              <option key={key} value={key}>
                {key} - {value}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* SKU */}
      <div>
        <label
          htmlFor="sku"
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
          🏷️ SKU (Código del producto) *
        </label>
        <div
          style={{
            display: "flex",
            gap: "8px",
            alignItems: "stretch",
          }}
        >
          <input
            type="text"
            id="sku"
            name="sku"
            value={formData.sku}
            onChange={handleInputChange}
            required
            style={{
              flex: "1",
              padding: "10px",
              borderRadius: "4px",
              border: `1px solid ${
                skuValidation?.valid === true
                  ? "#28a745"
                  : skuValidation?.valid === false
                  ? "#dc3545"
                  : "#ced4da"
              }`,
              fontSize: "16px",
              boxSizing: "border-box",
              fontFamily: "monospace",
            }}
            placeholder="Ej: LAB-ART-BIO-001"
          />
          <div
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
              marginTop: "10px",
            }}
          >
            {/* Botón Generar Siguiente SKU */}
            <button
              type="button"
              onClick={handleGenerateNextSku}
              disabled={isGeneratingSku || !getSkuRequirements().canOperate}
              style={{
                padding: "10px 16px",
                borderRadius: "4px",
                border: "none",
                backgroundColor: getSkuRequirements().canOperate
                  ? isGeneratingSku
                    ? "#6c757d"
                    : "#007bff"
                  : "#e9ecef",
                color: getSkuRequirements().canOperate ? "white" : "#6c757d",
                fontSize: "14px",
                cursor: getSkuRequirements().canOperate
                  ? isGeneratingSku
                    ? "not-allowed"
                    : "pointer"
                  : "not-allowed",
                opacity: getSkuRequirements().canOperate ? 1 : 0.6,
                whiteSpace: "nowrap",
                transition: "all 0.2s ease",
              }}
              title={
                !getSkuRequirements().canOperate
                  ? getSkuRequirements().reason
                  : "Generar el siguiente SKU disponible"
              }
            >
              {isGeneratingSku ? (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      borderTop: "2px solid white",
                      borderRight: "2px solid transparent",
                      animation: "spin 1s linear infinite",
                    }}
                  ></span>
                  <span style={{ marginLeft: "5px" }}>Generando...</span>
                </span>
              ) : (
                "Generar Siguiente"
              )}
            </button>

            {/* Botón Validar SKU */}
            <button
              type="button"
              onClick={handleValidateSku}
              disabled={isValidatingSku || !formData.sku.trim()}
              style={{
                padding: "10px 16px",
                borderRadius: "4px",
                border: "none",
                backgroundColor: formData.sku.trim()
                  ? isValidatingSku
                    ? "#6c757d"
                    : "#17a2b8"
                  : "#e9ecef",
                color: formData.sku.trim() ? "white" : "#6c757d",
                fontSize: "14px",
                cursor: formData.sku.trim()
                  ? isValidatingSku
                    ? "not-allowed"
                    : "pointer"
                  : "not-allowed",
                opacity: formData.sku.trim() ? 1 : 0.6,
                whiteSpace: "nowrap",
                transition: "all 0.2s ease",
              }}
            >
              {isValidatingSku ? (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      borderTop: "2px solid white",
                      borderRight: "2px solid transparent",
                      animation: "spin 1s linear infinite",
                    }}
                  ></span>
                  <span style={{ marginLeft: "5px" }}>Buscando...</span>
                </span>
              ) : (
                "Validar"
              )}
            </button>
          </div>
        </div>

        {/* Mensaje de validación del SKU */}
        {skuValidation && (
          <div
            style={{
              marginTop: "5px",
              fontSize: "14px",
              color: skuValidation.valid ? "#28a745" : "#dc3545",
            }}
          >
            {skuValidation.message ||
              (skuValidation.valid ? "SKU válido" : "SKU no válido")}
          </div>
        )}

        {skuInfo && (
          <p
            style={{
              color: "#6c757d",
              fontSize: "14px",
              marginTop: "5px",
            }}
          >
            Formato: {skuInfo.formato} (Ej: {skuInfo.ejemplo})
          </p>
        )}
      </div>

      <style>
        {`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}
      </style>
    </div>
  );
};

export default SkuConfigForm;
