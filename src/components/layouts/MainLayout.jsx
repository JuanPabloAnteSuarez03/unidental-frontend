import React from "react";

const MainLayout = ({ children }) => {
  return (
    <div style={{ minHeight: "100vh", fontFamily: "Arial, sans-serif" }}>
      {/* Header global */}
      <header
        style={{
          backgroundColor: "#2c3e50",
          color: "white",
          padding: "1rem",
          marginBottom: "20px",
        }}
      >
        <h1>Sistema de Gestión</h1>
        <h2>Panel Principal</h2>
        <nav>
          <a href="/" style={{ color: "white", marginRight: "15px" }}>
            Inicio
          </a>
          <a href="/inventario" style={{ color: "white" }}>
            Inventario
          </a>
        </nav>
      </header>

      {/* Contenido principal */}
      <main style={{ padding: "0 20px" }}>{children}</main>

      {/* Footer global */}
      <footer
        style={{
          marginTop: "40px",
          padding: "20px",
          backgroundColor: "#ecf0f1",
          textAlign: "center",
        }}
      >
        <p>&copy; 2024 Sistema de Inventario</p>
      </footer>
    </div>
  );
};

export default MainLayout;
