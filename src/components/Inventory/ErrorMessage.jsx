import React from "react";

const ErrorMessage = ({ error }) => {
  if (!error) return null;

  return (
    <div
      style={{
        backgroundColor: "white",
        borderRadius: "12px",
        padding: "25px",
        marginBottom: "20px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        border: "1px solid #e74c3c",
        borderLeft: "4px solid #e74c3c",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div
          style={{
            width: "24px",
            height: "24px",
            borderRadius: "50%",
            backgroundColor: "#e74c3c",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: "14px",
            fontWeight: "bold",
          }}
        >
          !
        </div>
        <div>
          <h3
            style={{
              color: "#e74c3c",
              fontSize: "18px",
              fontWeight: "600",
              margin: "0 0 4px 0",
            }}
          >
            Error al cargar productos
          </h3>
          <p
            style={{
              color: "#721c24",
              fontSize: "14px",
              margin: 0,
            }}
          >
            {error}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;
