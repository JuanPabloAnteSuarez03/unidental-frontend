import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import CrearUsuarioForm from "../components/Configuracion/CrearUsuarioForm";
import CerrarSesion from "../components/Configuracion/CerrarSesion";

const ControlUsuariosPage = () => {
    const [activeView, setActiveView] = useState("crear"); // "crear" o "logout"

    return (
        <div
            style={{
                minHeight: "80vh",
                padding: "40px 20px",
                background: "#f4f6fb",
            }}
        >
            <div
                style={{
                    background: "#fff",
                    borderRadius: 16,
                    boxShadow: "0 8px 32px rgba(44, 62, 80, 0.12)",
                    padding: "40px",
                    maxWidth: 800,
                    width: "100%",
                    margin: "0 auto",
                }}
            >
                <div
                    style={{
                        textAlign: "center",
                        marginBottom: 40,
                        borderBottom: "2px solid #ecf0f1",
                        paddingBottom: 24,
                    }}
                >
                    <h1
                        style={{
                            color: "#2c3e50",
                            fontWeight: 800,
                            fontSize: 32,
                            margin: "0 0 8px 0",
                            letterSpacing: "-0.5px",
                        }}
                    >
                        Panel de Configuración
                    </h1>
                    <p
                        style={{
                            color: "#7f8c8d",
                            fontSize: 16,
                            margin: 0,
                            fontWeight: 500,
                        }}
                    >
                        Gestiona usuarios y configuración del sistema
                    </p>
                </div>

                {/* Botones de navegación mejorados */}
                <div
                    style={{
                        display: "flex",
                        gap: 12,
                        marginBottom: 40,
                        background: "#f8fafc",
                        padding: "8px",
                        borderRadius: 12,
                        border: "1px solid #ecf0f1",
                        maxWidth: 400,
                        margin: "0 auto 40px auto",
                    }}
                >
                    <button
                        onClick={() => setActiveView("crear")}
                        style={{
                            flex: 1,
                            padding: "16px 20px",
                            background:
                                activeView === "crear"
                                    ? "#2c3e50"
                                    : "transparent",
                            color: activeView === "crear" ? "#fff" : "#2c3e50",
                            border: "none",
                            borderRadius: 8,
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.3s ease",
                            fontSize: 15,
                            boxShadow:
                                activeView === "crear"
                                    ? "0 4px 12px rgba(44,62,80,0.15)"
                                    : "none",
                        }}
                    >
                        👤 Crear Usuario
                    </button>
                    <button
                        onClick={() => setActiveView("logout")}
                        style={{
                            flex: 1,
                            padding: "16px 20px",
                            background:
                                activeView === "logout"
                                    ? "#e74c3c"
                                    : "transparent",
                            color: activeView === "logout" ? "#fff" : "#e74c3c",
                            border: "none",
                            borderRadius: 8,
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.3s ease",
                            fontSize: 15,
                            boxShadow:
                                activeView === "logout"
                                    ? "0 4px 12px rgba(231,76,60,0.15)"
                                    : "none",
                        }}
                    >
                        🚪 Cerrar Sesión
                    </button>
                </div>

                {/* Contenido dinámico con mejor espaciado */}
                <div
                    style={{
                        minHeight: 400,
                        background: "#fafbfc",
                        borderRadius: 12,
                        padding: "32px",
                        border: "1px solid #ecf0f1",
                    }}
                >
                    {activeView === "crear" ? (
                        <CrearUsuarioForm />
                    ) : (
                        <CerrarSesion />
                    )}
                </div>
            </div>
        </div>
    );
};

export default ControlUsuariosPage;
