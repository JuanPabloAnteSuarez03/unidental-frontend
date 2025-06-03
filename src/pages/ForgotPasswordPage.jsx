// src/pages/ForgotPasswordPage.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { requestPasswordReset } from "../services/authService"; //

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !email.includes("@")) {
            setError("Por favor ingrese un correo electrónico válido");
            return;
        }
        setIsLoading(true);
        setError("");
        try {
            await requestPasswordReset(email);
            setSuccess(true);
        } catch (error) {
            setError(
                error.message ||
                    "Error al solicitar el restablecimiento de contraseña"
            );
        } finally {
            setIsLoading(false);
        }
    };

    // Estilos con la misma tipografía y colores que el login
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

    const formStyle = {
        width: "100%",
        fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    };

    const fieldContainerStyle = {
        marginBottom: "20px",
    };

    const labelStyle = {
        display: "block",
        marginBottom: "10px",
        fontSize: "16px",
        fontWeight: "500",
        color: "#666",
        fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    };

    const inputStyle = {
        width: "100%",
        padding: "12px",
        border: "1px solid #ddd",
        borderRadius: "4px",
        fontSize: "16px",
        boxSizing: "border-box",
        fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    };

    const buttonStyle = {
        width: "100%",
        padding: "12px",
        backgroundColor: "rgb(44, 62, 80)",
        color: "white",
        border: "none",
        borderRadius: "4px",
        fontSize: "16px",
        cursor: "pointer",
        fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    };

    const linkContainerStyle = {
        textAlign: "center",
        marginTop: "20px",
        fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    };

    const linkStyle = {
        color: "#007bff",
        textDecoration: "none",
    };

    const successStyle = {
        padding: "16px",
        backgroundColor: "#e3fcef",
        color: "#2f9e5f",
        borderRadius: "4px",
        marginBottom: "20px",
        textAlign: "center",
        fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    };

    const errorStyle = {
        padding: "12px",
        backgroundColor: "#ffeded",
        color: "#d63031",
        marginBottom: "15px",
        borderRadius: "4px",
        fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    };

    return (
        <div style={containerStyle}>
            <div style={formContainerStyle}>
                <h2 style={titleStyle}>Recuperar Contraseña</h2>
                <p style={subtitleStyle}>
                    Ingresa tu correo electrónico para recibir instrucciones
                </p>

                {success ? (
                    <div>
                        <div style={successStyle}>
                            <p>
                                Se ha enviado un enlace para restablecer tu
                                contraseña a {email}. Por favor revisa tu correo
                                electrónico.
                            </p>
                        </div>
                        <div style={linkContainerStyle}>
                            <Link to="/login" style={linkStyle}>
                                Volver a iniciar sesión
                            </Link>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} style={formStyle}>
                        <div style={fieldContainerStyle}>
                            <label htmlFor="email" style={labelStyle}>
                                Correo Electrónico
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                style={inputStyle}
                                placeholder="tu@email.com"
                                disabled={isLoading}
                            />
                        </div>

                        {error && (
                            <div style={errorStyle}>
                                <p>{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            style={buttonStyle}
                        >
                            {isLoading ? "Enviando..." : "Enviar Instrucciones"}
                        </button>

                        <div style={linkContainerStyle}>
                            <Link to="/login" style={linkStyle}>
                                Volver a Iniciar Sesión
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
