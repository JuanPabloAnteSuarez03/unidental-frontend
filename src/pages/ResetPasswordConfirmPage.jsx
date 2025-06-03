// src/pages/ResetPasswordConfirmPage.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { resetPasswordConfirm } from "../services/authService"; //

function ResetPasswordConfirmPage() {
    const { uid, token } = useParams();
    const navigate = useNavigate();

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    useEffect(() => {
        if (!uid || !token) {
            setError(
                "Enlace de reseteo inválido o la URL no contiene los parámetros necesarios (uid, token)."
            );
        }
    }, [uid, token]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setSuccessMessage("");
        if (!uid || !token) {
            setError(
                "No se pueden procesar los datos: falta uid o token del enlace. Por favor, usa el enlace de tu correo."
            );
            return;
        }
        if (newPassword !== confirmPassword) {
            setError("Las contraseñas no coinciden.");
            return;
        }
        if (newPassword.length < 8) {
            setError("La nueva contraseña debe tener al menos 8 caracteres.");
            return;
        }
        setIsLoading(true);
        try {
            await resetPasswordConfirm(uid, token, newPassword);
            setSuccessMessage(
                "¡Tu contraseña ha sido restablecida exitosamente! Serás redirigido para iniciar sesión."
            );
            setTimeout(() => {
                navigate("/login");
            }, 3000);
        } catch (err) {
            console.error("Error al restablecer la contraseña:", err);
            setError(
                err.message ||
                    "No se pudo restablecer la contraseña. El enlace puede ser inválido, haber expirado, o la contraseña no cumple los requisitos."
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

    const successTitleStyle = {
        fontSize: "24px",
        fontWeight: "600",
        color: "#2f9e5f",
        marginBottom: "15px",
        fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    };

    const errorTitleStyle = {
        fontSize: "24px",
        fontWeight: "600",
        color: "#d63031",
        marginBottom: "15px",
        fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    };

    if (successMessage) {
        return (
            <div style={containerStyle}>
                <div style={formContainerStyle}>
                    <div style={{ textAlign: "center" }}>
                        <h2 style={successTitleStyle}>¡Éxito!</h2>
                        <div style={successStyle}>
                            <p>{successMessage}</p>
                        </div>
                        <div style={linkContainerStyle}>
                            <Link to="/login" style={linkStyle}>
                                Ir a Iniciar Sesión
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!uid || !token) {
        return (
            <div style={containerStyle}>
                <div style={formContainerStyle}>
                    <div style={{ textAlign: "center" }}>
                        <h2 style={errorTitleStyle}>Error de Enlace</h2>
                        <div style={errorStyle}>
                            <p>
                                {error ||
                                    "El enlace para restablecer la contraseña es inválido o está incompleto."}
                            </p>
                        </div>
                        <div style={linkContainerStyle}>
                            <p style={{ marginBottom: "10px" }}>
                                <Link to="/password-reset" style={linkStyle}>
                                    Solicitar Nuevo Enlace
                                </Link>
                            </p>
                            <p>
                                <Link to="/login" style={linkStyle}>
                                    Volver a Iniciar Sesión
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={containerStyle}>
            <div style={formContainerStyle}>
                <h2 style={titleStyle}>Establecer Nueva Contraseña</h2>

                <form onSubmit={handleSubmit} style={formStyle}>
                    <div style={fieldContainerStyle}>
                        <label htmlFor="new-password" style={labelStyle}>
                            Nueva Contraseña
                        </label>
                        <input
                            id="new-password"
                            name="newPassword"
                            type="password"
                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            disabled={isLoading}
                            minLength={8}
                            style={inputStyle}
                            placeholder="Ingresa tu nueva contraseña"
                        />
                    </div>
                    <div style={fieldContainerStyle}>
                        <label htmlFor="confirm-password" style={labelStyle}>
                            Confirmar Nueva Contraseña
                        </label>
                        <input
                            id="confirm-password"
                            name="confirmPassword"
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={isLoading}
                            minLength={8}
                            style={inputStyle}
                            placeholder="Confirma tu nueva contraseña"
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
                        {isLoading
                            ? "Estableciendo..."
                            : "Restablecer Contraseña"}
                    </button>

                    <div style={linkContainerStyle}>
                        <Link to="/login" style={linkStyle}>
                            Cancelar y volver a Iniciar Sesión
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ResetPasswordConfirmPage;
