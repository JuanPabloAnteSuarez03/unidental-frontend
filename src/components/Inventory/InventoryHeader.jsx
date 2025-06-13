import React from "react";

const InventoryHeader = ({ totalGeneralProducts }) => {
  return (
    <div
      className="inventory-header"
      style={{
        marginBottom: "30px",
        borderBottom: "2px solid #eee",
        paddingBottom: "15px",
        backgroundColor: "white",
        padding: "25px",
        borderRadius: "12px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        border: "1px solid #e9ecef",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "15px",
          marginBottom: "10px",
        }}
      >
        <div
          style={{
            width: "4px",
            height: "32px",
            backgroundColor: "#007bff",
            borderRadius: "2px",
          }}
        />
        <h1
          style={{
            color: "#2c3e50",
            fontSize: "32px",
            fontWeight: "700",
            margin: 0,
            letterSpacing: "-0.5px",
          }}
        >
          Gestión de Inventario
        </h1>
      </div>
      <p
        style={{
          color: "#6c757d",
          fontSize: "16px",
          margin: 0,
          paddingLeft: "19px",
        }}
      >
        Administra y consulta el inventario de productos ({" "}
        <span style={{ fontWeight: "600", color: "#007bff" }}>
          {totalGeneralProducts !== undefined ? totalGeneralProducts : 0}
        </span>{" "}
        en total)
      </p>
    </div>
  );
};

export default InventoryHeader;
