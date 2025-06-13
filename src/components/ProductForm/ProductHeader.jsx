import React from "react";

const ProductHeader = ({ skuInfo, getSkuRequirements }) => {
  return (
    <div
      style={{
        marginBottom: "30px",
        borderBottom: "2px solid #eee",
        paddingBottom: "15px",
        position: "relative",
      }}
    >
      <h1
        style={{
          color: "#2c3e50",
          fontSize: "28px",
          fontWeight: "700",
          margin: "0 0 8px 0",
          display: "flex",
          alignItems: "center",
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: "4px",
            height: "28px",
            backgroundColor: "#3498db",
            marginRight: "12px",
            borderRadius: "2px",
          }}
        />
        Crear Nuevo Producto
      </h1>
      <p
        style={{
          color: "#6c757d",
          fontSize: "16px",
          margin: "0 0 0 16px",
          lineHeight: "1.5",
        }}
      >
        Complete la información del nuevo producto para agregarlo al inventario
      </p>

      {/* Información del sistema SKU */}
      {skuInfo && !skuInfo.error && (
        <div
          style={{
            marginTop: "15px",
            padding: "12px 15px",
            backgroundColor: "#e8f4fd",
            borderRadius: "6px",
            border: "1px solid #bee5eb",
            fontSize: "14px",
            color: "#0c5460",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
          }}
        >
          <svg
            style={{ marginRight: "10px" }}
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#0c5460"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          <div>
            <strong>Sistema SKU:</strong>{" "}
            {skuInfo.format || "Formato automático"}
            {skuInfo.next_number && ` | Próximo número: ${skuInfo.next_number}`}
            {skuInfo.prefix && ` | Prefijo: ${skuInfo.prefix}`}
          </div>
        </div>
      )}

      {/* Mensaje de error del sistema SKU */}
      {skuInfo && skuInfo.error && (
        <div
          style={{
            marginTop: "15px",
            padding: "12px 15px",
            backgroundColor: "#fff3cd",
            borderRadius: "6px",
            border: "1px solid #ffeaa7",
            fontSize: "14px",
            color: "#856404",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
          }}
        >
          <svg
            style={{ marginRight: "10px" }}
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#856404"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <div>
            <strong>Sistema SKU:</strong> {skuInfo.message || skuInfo.error}
          </div>
        </div>
      )}

      {/* Requisitos para operaciones de SKU */}
      {!getSkuRequirements().canOperate && !skuInfo?.error && (
        <div
          style={{
            marginTop: "15px",
            padding: "12px 15px",
            backgroundColor: "#fff3cd",
            borderRadius: "6px",
            border: "1px solid #ffeaa7",
            fontSize: "14px",
            color: "#856404",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
          }}
        >
          <svg
            style={{ marginRight: "10px" }}
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#856404"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
          </svg>
          <div>
            <strong>Requisitos SKU:</strong> {getSkuRequirements().reason}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductHeader;
