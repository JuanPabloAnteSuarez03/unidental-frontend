import React from "react";
import { getTransferStats } from "../../services/transfersService";

const TransferPersistenceInfo = () => {
  const stats = getTransferStats();

  return (
    <div
      style={{
        backgroundColor: "#f8f9fa",
        borderRadius: "12px",
        padding: "20px",
        marginBottom: "24px",
        border: "1px solid #e9ecef",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "16px",
        }}
      >
        <span style={{ fontSize: "24px" }}>🔄</span>
        <div>
          <h3
            style={{
              fontSize: "18px",
              fontWeight: "600",
              margin: "0",
              color: "#2c3e50",
            }}
          >
            Sistema de Transferencias Persistentes con Control de Stock
          </h3>
          <p
            style={{
              fontSize: "14px",
              color: "#6c757d",
              margin: "4px 0 0 0",
            }}
          >
            Transferencias guardadas localmente con validación de inventario
            real
          </p>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            backgroundColor: "#fff",
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #e9ecef",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "24px",
              fontWeight: "700",
              color: "#2c3e50",
            }}
          >
            {stats.total}
          </div>
          <div style={{ fontSize: "12px", color: "#6c757d" }}>
            Total Transferencias
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#fff",
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #e9ecef",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "24px",
              fontWeight: "700",
              color: "#28a745",
            }}
          >
            {stats.completadas}
          </div>
          <div style={{ fontSize: "12px", color: "#6c757d" }}>Completadas</div>
        </div>

        <div
          style={{
            backgroundColor: "#fff",
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #e9ecef",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "24px",
              fontWeight: "700",
              color: "#ffc107",
            }}
          >
            {stats.pendientes}
          </div>
          <div style={{ fontSize: "12px", color: "#6c757d" }}>Pendientes</div>
        </div>

        <div
          style={{
            backgroundColor: "#fff",
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #e9ecef",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "24px",
              fontWeight: "700",
              color: "#17a2b8",
            }}
          >
            {stats.aprobadas}
          </div>
          <div style={{ fontSize: "12px", color: "#6c757d" }}>Aprobadas</div>
        </div>
      </div>
    </div>
  );
};

export default TransferPersistenceInfo;
