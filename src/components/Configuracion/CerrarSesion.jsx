import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";

const CerrarSesion = () => {
    const { currentUser, logout } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogout = async () => {
        setLoading(true);
        setError("");
        try {
            await logout();
        } catch (err) {
            setError("Error al cerrar sesión. Inténtalo de nuevo.");
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: 500, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 32 }}>
                <h2
                    style={{
                        color: "#2c3e50",
                        fontWeight: 700,
                        fontSize: 24,
                        margin: "0 0 8px 0",
                    }}
                >
                    Cerrar Sesión
                </h2>
                <p
                    style={{
                        color: "#7f8c8d",
                        fontSize: 16,
                        margin: 0,
                    }}
                >
                    Gestiona tu sesión actual y accede a la configuración de
                    seguridad
                </p>
            </div>

            <div style={{ marginBottom: 32 }}>
                <h3
                    style={{
                        color: "#2c3e50",
                        fontWeight: 600,
                        marginBottom: 20,
                        fontSize: 18,
                    }}
                >
                    📋 Información de Sesión
                </h3>
                {currentUser ? (
                    <div
                        style={{
                            background: "#fff",
                            padding: "24px",
                            borderRadius: 12,
                            border: "1px solid #e1e8ed",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 16,
                                marginBottom: 16,
                            }}
                        >
                            <div
                                style={{
                                    background: "#3498db",
                                    color: "#fff",
                                    width: 56,
                                    height: 56,
                                    borderRadius: "50%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontWeight: 700,
                                    fontSize: 20,
                                }}
                            >
                                {currentUser.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div
                                    style={{
                                        fontWeight: 700,
                                        color: "#2c3e50",
                                        fontSize: 18,
                                        marginBottom: 4,
                                    }}
                                >
                                    {currentUser.username}
                                </div>
                                {currentUser.email && (
                                    <div
                                        style={{
                                            color: "#7f8c8d",
                                            fontSize: 14,
                                        }}
                                    >
                                        {currentUser.email}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                padding: "8px 12px",
                                background: "#e8f5e8",
                                borderRadius: 8,
                                width: "fit-content",
                            }}
                        >
                            <div style={{ fontSize: 12 }}>🟢</div>
                            <span
                                style={{
                                    color: "#27ae60",
                                    fontSize: 14,
                                    fontWeight: 600,
                                }}
                            >
                                Sesión activa
                            </span>
                        </div>
                    </div>
                ) : (
                    <div
                        style={{
                            color: "#7f8c8d",
                            textAlign: "center",
                            padding: "24px",
                            background: "#f8fafc",
                            borderRadius: 12,
                            border: "1px solid #e1e8ed",
                        }}
                    >
                        <div style={{ fontSize: 48, marginBottom: 16 }}>❓</div>
                        <div style={{ fontSize: 16, fontWeight: 600 }}>
                            Información de usuario no disponible
                        </div>
                    </div>
                )}
            </div>

            <div
                style={{
                    background: "#fff3cd",
                    border: "1px solid #ffeaa7",
                    borderRadius: 12,
                    padding: "20px",
                    marginBottom: 32,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 12,
                    }}
                >
                    <div style={{ fontSize: 20, marginTop: 2 }}>⚠️</div>
                    <div>
                        <h4
                            style={{
                                color: "#856404",
                                fontWeight: 600,
                                margin: "0 0 8px 0",
                                fontSize: 16,
                            }}
                        >
                            Confirmar cierre de sesión
                        </h4>
                        <p
                            style={{
                                color: "#856404",
                                fontSize: 14,
                                margin: 0,
                                lineHeight: 1.5,
                            }}
                        >
                            Al cerrar sesión, tendrás que volver a iniciar
                            sesión para acceder al sistema.
                        </p>
                    </div>
                </div>
            </div>

            <button
                onClick={handleLogout}
                disabled={loading}
                style={{
                    width: "100%",
                    padding: "16px 0",
                    background: loading ? "#bdc3c7" : "#e74c3c",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: 16,
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "all 0.3s ease",
                    boxShadow: loading
                        ? "none"
                        : "0 4px 16px rgba(231,76,60,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                }}
            >
                {loading ? "🔄" : "🚪"}
                {loading ? "Cerrando sesión..." : "Cerrar Sesión"}
            </button>

            {error && (
                <div
                    style={{
                        color: "#e74c3c",
                        fontWeight: 600,
                        marginTop: 20,
                        textAlign: "center",
                        padding: "12px",
                        background: "#fdf2f2",
                        borderRadius: 8,
                        border: "1px solid #fecaca",
                    }}
                >
                    ❌ {error}
                </div>
            )}
        </div>
    );
};

export default CerrarSesion;
