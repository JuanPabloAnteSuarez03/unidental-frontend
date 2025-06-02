// src/components/layouts/MainLayout.jsx
import React from "react";
import { Link } from "react-router-dom";
// Asegúrate que la ruta a useAuth sea la correcta según tu estructura de proyecto
import { useAuth } from "../../context/AuthContext"; // [cite: src/context/AuthContext.jsx]

const MainLayout = ({ children }) => {
    const { authToken } = useAuth();
    const isAuthenticated = !!authToken;

    return (
        <div style={{ minHeight: "100vh", fontFamily: "Arial, sans-serif" }}>
            {/* Header global */}
            <header
                style={{
                    backgroundColor: "#2c3e50",
                    color: "white",
                    padding: "1rem 2rem",
                    marginBottom: "20px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <div className="logo-area">
                    <h1 style={{ margin: 0, fontSize: "1.8em" }}>
                        Sistema de Gestión
                    </h1>
                    <h2
                        style={{
                            margin: "0.2em 0 0 0",
                            fontSize: "1em",
                            fontWeight: "normal",
                        }}
                    >
                        Panel Principal
                    </h2>
                </div>
                <nav style={{ display: "flex", alignItems: "center" }}>
                    {/* Mostrar el enlace a Inventario solo si está autenticado */}
                    {isAuthenticated && (
                        <Link
                            to="/inventario"
                            style={{
                                color: "white",
                                marginRight: "20px",
                                textDecoration: "none",
                            }}
                        >
                            Inventario
                        </Link>
                    )}
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
                    borderTop: "1px solid #dee2e6",
                }}
            >
                <p style={{ margin: 0, color: "#34495e" }}>
                    &copy; {new Date().getFullYear()} Sistema de Inventario
                    Unidental
                </p>
            </footer>
        </div>
    );
};

export default MainLayout;
