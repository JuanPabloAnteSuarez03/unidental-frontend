import React from "react";

const MovementsHeader = ({ totalCount = 0, isLoading = false }) => {
  return (
    <div
      style={{
        marginBottom: "40px",
        background: "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)",
        borderRadius: "16px",
        padding: "32px",
        color: "white",
        boxShadow: "0 8px 32px rgba(44, 62, 80, 0.15)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative background pattern */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "200px",
          height: "200px",
          background: "rgba(255, 255, 255, 0.05)",
          borderRadius: "50%",
          transform: "translate(50%, -50%)",
        }}
      ></div>
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "150px",
          height: "150px",
          background: "rgba(255, 255, 255, 0.03)",
          borderRadius: "50%",
          transform: "translate(-50%, 50%)",
        }}
      ></div>

      <div style={{ position: "relative", zIndex: 1 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.15)",
              borderRadius: "12px",
              padding: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: "32px" }}>📦</span>
          </div>
          <div>
            <h1
              style={{
                color: "white",
                fontSize: "32px",
                fontWeight: "700",
                margin: "0 0 4px 0",
                letterSpacing: "-0.5px",
              }}
            >
              Movimientos de Stock
            </h1>
            <p
              style={{
                color: "rgba(255, 255, 255, 0.9)",
                fontSize: "16px",
                margin: 0,
                fontWeight: "400",
              }}
            >
              Registra y consulta todos los movimientos de inventario
            </p>
          </div>
        </div>

        {!isLoading && totalCount > 0 && (
          <div
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              padding: "12px 16px",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span style={{ fontSize: "16px" }}>📊</span>
            <span
              style={{
                color: "white",
                fontSize: "16px",
                fontWeight: "600",
              }}
            >
              {totalCount} movimiento{totalCount !== 1 ? "s" : ""} registrado
              {totalCount !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MovementsHeader;
