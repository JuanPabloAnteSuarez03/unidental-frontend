import React from "react";

const SkuGenerationForm = ({
  formData,
  handleInputChange,
  skuValidation,
  handleGenerateNextSku,
  isGeneratingSku,
  getSkuRequirements,
  handleValidateSku,
  isValidatingSku,
  skuInfo,
}) => {
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
        🏷️ Generación SKU
      </h3>

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
        </div>
        
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

export default SkuGenerationForm; 