// src/components/Auth/LoginForm.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";

function LoginForm({ onLoginSubmit, error, loading }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (event) => {
        event.preventDefault();
        if (onLoginSubmit) {
            onLoginSubmit({ username, password });
        }
    };

    // Estilos de elementos individuales
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

    const textStyle = {
        color: "#666",
    };

    const adminTextStyle = {
        color: "#666",
        fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    };

    return (
        <form
            onSubmit={handleSubmit}
            style={formStyle}
            data-testid="login-form"
        >
            <div style={fieldContainerStyle}>
                <label htmlFor="username" style={labelStyle}>
                    Usuario
                </label>
                <input
                    type="text"
                    name="username"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    style={inputStyle}
                    disabled={loading}
                />
            </div>

            <div style={fieldContainerStyle}>
                <label htmlFor="password" style={labelStyle}>
                    Contraseña
                </label>
                <div style={{ position: "relative" }}>
                    <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ ...inputStyle, paddingRight: 42 }}
                        disabled={loading}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                        title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                        style={{
                            position: "absolute",
                            right: 8,
                            top: "50%",
                            transform: "translateY(-50%)",
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            color: "#6c757d",
                            padding: 6,
                            fontSize: 16,
                        }}
                        disabled={loading}
                    >
                        {showPassword ? "🙈" : "👁️"}
                    </button>
                </div>
            </div>

            {error && (
                <div
                    style={{
                        padding: "12px",
                        backgroundColor: "#ffeded",
                        color: "#d63031",
                        marginBottom: "15px",
                        borderRadius: "4px",
                    }}
                >
                    <p style={{ fontWeight: "500" }}>Error de Autenticación</p>
                    <p>{error}</p>
                </div>
            )}

            <button type="submit" disabled={loading} style={buttonStyle}>
                {loading ? "Ingresando..." : "Ingresar"}
            </button>

            <div style={linkContainerStyle}>
                <p>
                    <Link to="/password-reset" style={linkStyle}>
                        ¿Olvidaste tu contraseña?
                    </Link>
                </p>
                <p style={{ marginTop: "8px" }}>
                    <span style={adminTextStyle}>
                        ¿Problemas para acceder? Contacta al administrador
                    </span>
                </p>
            </div>
        </form>
    );
}

export default LoginForm;
