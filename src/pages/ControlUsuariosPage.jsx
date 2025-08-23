import React from "react";
import CrearUsuarioForm from "../components/Configuracion/CrearUsuarioForm";

const ControlUsuariosPage = () => {
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
                        Crear Usuarios
                    </h1>
                    <p
                        style={{
                            color: "#7f8c8d",
                            fontSize: 16,
                            margin: 0,
                            fontWeight: 500,
                        }}
                    >
                        Gestiona la creación de nuevos usuarios del sistema
                    </p>
                </div>

                {/* Contenido del formulario */}
                <div
                    style={{
                        minHeight: 400,
                        background: "#fafbfc",
                        borderRadius: 12,
                        padding: "32px",
                        border: "1px solid #ecf0f1",
                    }}
                >
                    <CrearUsuarioForm />
                </div>
            </div>
        </div>
    );
};

export default ControlUsuariosPage;
