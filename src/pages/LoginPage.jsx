// src/pages/LoginPage.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "../components/Auth/LoginForm"; //
import { useAuth } from "../context/AuthContext"; //

function LoginPage() {
    const navigate = useNavigate();
    const { login, authToken, isLoading, authError } = useAuth(); //

    const handleLoginSubmit = async (credentials) => {
        await login(credentials.username, credentials.password);
    };

    useEffect(() => {
        if (authToken) {
            navigate("/inventario", { replace: true }); //
        }
    }, [authToken, navigate]);

    if (authToken && !isLoading) {
        // Evita mostrar el form brevemente si ya hay token
        return (
            <div className="flex items-center justify-center min-h-screen bg-white">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-3 text-sm text-gray-600">
                        Redirigiendo...
                    </p>
                </div>
            </div>
        );
    }

    // Estilos exactamente como en la imagen
    const containerStyle = {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "white",
        padding: "0 15px",
        fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    };

    const formContainerStyle = {
        width: "100%",
        maxWidth: "440px",
    };

    const titleStyle = {
        fontSize: "28px",
        fontWeight: "600",
        color: "#333",
        textAlign: "center",
        marginBottom: "8px",
        fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    };

    const subtitleStyle = {
        fontSize: "16px",
        color: "#666",
        textAlign: "center",
        marginBottom: "30px",
        fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    };

    return (
        <div style={containerStyle}>
            <div style={formContainerStyle}>
                <h2 style={titleStyle}>Bienvenido</h2>
                <p style={subtitleStyle}>
                    Ingresa tus credenciales para acceder
                </p>

                <LoginForm
                    onLoginSubmit={handleLoginSubmit}
                    loading={isLoading}
                    error={authError}
                />
            </div>
        </div>
    );
}

export default LoginPage;
