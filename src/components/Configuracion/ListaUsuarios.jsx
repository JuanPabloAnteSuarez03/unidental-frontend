import React, { useState, useEffect } from "react";
import { getUsers } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";

const ListaUsuarios = () => {
    const { authToken } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const fetchUsers = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await getUsers(authToken);
            setUsers(response.results || response || []);
        } catch (err) {
            setError(err.message || "Error al obtener usuarios.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    return (
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 32 }}>
                <h2
                    style={{
                        color: "#2c3e50",
                        fontWeight: 700,
                        fontSize: 24,
                        margin: "0 0 8px 0",
                    }}
                >
                    Lista de Usuarios
                </h2>
                <p
                    style={{
                        color: "#7f8c8d",
                        fontSize: 16,
                        margin: 0,
                    }}
                >
                    Gestiona y visualiza todos los usuarios registrados en el
                    sistema
                </p>
            </div>

            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 24,
                    background: "#fff",
                    padding: "16px 20px",
                    borderRadius: 12,
                    border: "1px solid #e1e8ed",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                        style={{
                            background: "#3498db",
                            color: "#fff",
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            fontSize: 16,
                        }}
                    >
                        {users.length}
                    </div>
                    <div>
                        <div style={{ fontWeight: 600, color: "#2c3e50" }}>
                            Total de Usuarios
                        </div>
                        <div style={{ fontSize: 14, color: "#7f8c8d" }}>
                            {users.length === 1
                                ? "1 usuario registrado"
                                : `${users.length} usuarios registrados`}
                        </div>
                    </div>
                </div>

                <button
                    onClick={fetchUsers}
                    disabled={loading}
                    style={{
                        padding: "12px 20px",
                        background: "#3498db",
                        color: "#fff",
                        border: "none",
                        borderRadius: 8,
                        fontWeight: 600,
                        cursor: loading ? "not-allowed" : "pointer",
                        fontSize: 14,
                        transition: "all 0.3s ease",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        boxShadow: "0 2px 8px rgba(52,152,219,0.2)",
                    }}
                >
                    {loading ? "🔄" : "🔄"}
                    {loading ? "Actualizando..." : "Actualizar"}
                </button>
            </div>

            {error && (
                <div
                    style={{
                        color: "#e74c3c",
                        fontWeight: 600,
                        marginBottom: 20,
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

            {loading && users.length === 0 ? (
                <div
                    style={{
                        textAlign: "center",
                        color: "#7f8c8d",
                        padding: "40px",
                        background: "#fff",
                        borderRadius: 12,
                        border: "1px solid #e1e8ed",
                    }}
                >
                    <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>
                        Cargando usuarios...
                    </div>
                </div>
            ) : users.length === 0 ? (
                <div
                    style={{
                        textAlign: "center",
                        color: "#7f8c8d",
                        padding: "40px",
                        background: "#fff",
                        borderRadius: 12,
                        border: "1px solid #e1e8ed",
                    }}
                >
                    <div style={{ fontSize: 48, marginBottom: 16 }}>👥</div>
                    <div
                        style={{
                            fontSize: 16,
                            fontWeight: 600,
                            marginBottom: 8,
                        }}
                    >
                        No hay usuarios registrados
                    </div>
                    <div style={{ fontSize: 14 }}>
                        Los usuarios aparecerán aquí cuando sean creados
                    </div>
                </div>
            ) : (
                <div
                    style={{
                        maxHeight: 400,
                        overflowY: "auto",
                        background: "#fff",
                        borderRadius: 12,
                        border: "1px solid #e1e8ed",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                    }}
                >
                    {users.map((user, index) => (
                        <div
                            key={user.id || index}
                            style={{
                                padding: "20px",
                                borderBottom:
                                    index < users.length - 1
                                        ? "1px solid #f1f3f4"
                                        : "none",
                                display: "flex",
                                alignItems: "center",
                                gap: 16,
                                transition: "background-color 0.2s ease",
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.background = "#f8fafc";
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = "transparent";
                            }}
                        >
                            <div
                                style={{
                                    background: "#3498db",
                                    color: "#fff",
                                    width: 48,
                                    height: 48,
                                    borderRadius: "50%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontWeight: 700,
                                    fontSize: 18,
                                }}
                            >
                                {user.username.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div
                                    style={{
                                        fontWeight: 600,
                                        color: "#2c3e50",
                                        fontSize: 16,
                                        marginBottom: 4,
                                    }}
                                >
                                    {user.username}
                                </div>
                                <div
                                    style={{
                                        color: "#7f8c8d",
                                        fontSize: 14,
                                    }}
                                >
                                    {user.email}
                                </div>
                            </div>
                            <div
                                style={{
                                    padding: "6px 12px",
                                    background: "#e8f5e8",
                                    color: "#27ae60",
                                    borderRadius: 20,
                                    fontSize: 12,
                                    fontWeight: 600,
                                }}
                            >
                                Activo
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ListaUsuarios;
