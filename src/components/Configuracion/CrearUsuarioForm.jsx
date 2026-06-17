import React, { useState } from "react";
import { registerUser } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";

const CrearUsuarioForm = () => {
    const { authToken } = useAuth();
    const [form, setForm] = useState({
        username: "",
        password: "",
        email: "",
        role: "User", // Por defecto "User" (Empleado)
    });
    const [touched, setTouched] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleBlur = (e) => {
        const { name } = e.target;
        setTouched((prev) => ({ ...prev, [name]: true }));
    };

    const validate = () => {
        return {
            username: form.username.trim().length < 3,
            password: form.password.length < 6,
            email: !/^\S+@\S+\.\S+$/.test(form.email),
            role: !form.role || (form.role !== "User" && form.role !== "Admin"),
        };
    };

    const errors = validate();
    const isValid = Object.values(errors).every((v) => v === false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitted(true);
        setError("");
        setSuccess("");
        if (isValid) {
            setLoading(true);
            try {
                await registerUser(
                    {
                        username: form.username.trim(),
                        password: form.password,
                        email: form.email.trim(),
                        role: form.role,
                    },
                    authToken
                );
                setSuccess("Usuario creado correctamente.");
                setForm({
                    username: "",
                    password: "",
                    email: "",
                    role: "User",
                });
                setTouched({});
                setSubmitted(false);
            } catch (err) {
                setError(err.message || "Error al crear usuario.");
            } finally {
                setLoading(false);
            }
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
                    Crear Nuevo Usuario
                </h2>
                <p
                    style={{
                        color: "#7f8c8d",
                        fontSize: 16,
                        margin: 0,
                    }}
                >
                    Completa los campos para registrar un nuevo usuario en el
                    sistema
                </p>
            </div>

            <form onSubmit={handleSubmit} noValidate>
                <div style={{ marginBottom: 24 }}>
                    <label
                        htmlFor="username"
                        style={{
                            fontWeight: 600,
                            color: "#34495e",
                            display: "block",
                            marginBottom: 8,
                            fontSize: 15,
                        }}
                    >
                        Nombre de usuario
                    </label>
                    <input
                        type="text"
                        id="username"
                        name="username"
                        value={form.username}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                        style={{
                            width: "100%",
                            padding: "14px 16px",
                            border:
                                errors.username &&
                                (touched.username || submitted)
                                    ? "2px solid #e74c3c"
                                    : "2px solid #e1e8ed",
                            borderRadius: 8,
                            fontSize: 16,
                            outline: "none",
                            background:
                                errors.username &&
                                (touched.username || submitted)
                                    ? "#fff6f6"
                                    : "#fff",
                            transition: "all 0.3s ease",
                            boxSizing: "border-box",
                        }}
                        minLength={3}
                        autoComplete="off"
                        disabled={loading}
                        placeholder="Ingresa el nombre de usuario"
                    />
                    {(touched.username || submitted) && errors.username && (
                        <div
                            style={{
                                color: "#e74c3c",
                                fontSize: 14,
                                marginTop: 6,
                                fontWeight: 500,
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                            }}
                        >
                            ⚠️ El nombre de usuario debe tener al menos 3
                            caracteres.
                        </div>
                    )}
                </div>

                <div style={{ marginBottom: 24 }}>
                    <label
                        htmlFor="password"
                        style={{
                            fontWeight: 600,
                            color: "#34495e",
                            display: "block",
                            marginBottom: 8,
                            fontSize: 15,
                        }}
                    >
                        Contraseña
                    </label>
                    <div style={{ position: "relative" }}>
                        <input
                            type={showPassword ? "text" : "password"}
                            id="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            required
                            style={{
                                width: "100%",
                                padding: "14px 46px 14px 16px",
                                border:
                                    errors.password &&
                                    (touched.password || submitted)
                                        ? "2px solid #e74c3c"
                                        : "2px solid #e1e8ed",
                                borderRadius: 8,
                                fontSize: 16,
                                outline: "none",
                                background:
                                    errors.password &&
                                    (touched.password || submitted)
                                        ? "#fff6f6"
                                        : "#fff",
                                transition: "all 0.3s ease",
                                boxSizing: "border-box",
                            }}
                            minLength={6}
                            autoComplete="new-password"
                            disabled={loading}
                            placeholder="Ingresa la contraseña"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                            title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                            style={{
                                position: "absolute",
                                right: 10,
                                top: "50%",
                                transform: "translateY(-50%)",
                                border: "none",
                                background: "transparent",
                                cursor: "pointer",
                                padding: 6,
                                color: "#6c757d",
                                fontSize: 16,
                            }}
                            disabled={loading}
                        >
                            {showPassword ? "🙈" : "👁️"}
                        </button>
                    </div>
                    {(touched.password || submitted) && errors.password && (
                        <div
                            style={{
                                color: "#e74c3c",
                                fontSize: 14,
                                marginTop: 6,
                                fontWeight: 500,
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                            }}
                        >
                            ⚠️ La contraseña debe tener al menos 6 caracteres.
                        </div>
                    )}
                </div>

                <div style={{ marginBottom: 32 }}>
                    <label
                        htmlFor="email"
                        style={{
                            fontWeight: 600,
                            color: "#34495e",
                            display: "block",
                            marginBottom: 8,
                            fontSize: 15,
                        }}
                    >
                        Correo electrónico
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                        style={{
                            width: "100%",
                            padding: "14px 16px",
                            border:
                                errors.email && (touched.email || submitted)
                                    ? "2px solid #e74c3c"
                                    : "2px solid #e1e8ed",
                            borderRadius: 8,
                            fontSize: 16,
                            outline: "none",
                            background:
                                errors.email && (touched.email || submitted)
                                    ? "#fff6f6"
                                    : "#fff",
                            transition: "all 0.3s ease",
                            boxSizing: "border-box",
                        }}
                        autoComplete="off"
                        disabled={loading}
                        placeholder="ejemplo@correo.com"
                    />
                    {(touched.email || submitted) && errors.email && (
                        <div
                            style={{
                                color: "#e74c3c",
                                fontSize: 14,
                                marginTop: 6,
                                fontWeight: 500,
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                            }}
                        >
                            ⚠️ Ingresa un correo electrónico válido.
                        </div>
                    )}
                </div>

                <div style={{ marginBottom: 32 }}>
                    <label
                        htmlFor="role"
                        style={{
                            fontWeight: 600,
                            color: "#34495e",
                            display: "block",
                            marginBottom: 8,
                            fontSize: 15,
                        }}
                    >
                        Rol del usuario
                    </label>
                    <select
                        id="role"
                        name="role"
                        value={form.role}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                        style={{
                            width: "100%",
                            padding: "14px 16px",
                            border:
                                errors.role && (touched.role || submitted)
                                    ? "2px solid #e74c3c"
                                    : "2px solid #e1e8ed",
                            borderRadius: 8,
                            fontSize: 16,
                            outline: "none",
                            background:
                                errors.role && (touched.role || submitted)
                                    ? "#fff6f6"
                                    : "#fff",
                            transition: "all 0.3s ease",
                            boxSizing: "border-box",
                            cursor: "pointer",
                        }}
                        disabled={loading}
                    >
                        <option value="User">Empleado</option>
                        <option value="Admin">Administrador</option>
                    </select>
                    {(touched.role || submitted) && errors.role && (
                        <div
                            style={{
                                color: "#e74c3c",
                                fontSize: 14,
                                marginTop: 6,
                                fontWeight: 500,
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                            }}
                        >
                            ⚠️ Selecciona un rol válido.
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={!isValid || loading}
                    style={{
                        width: "100%",
                        padding: "16px 0",
                        background: isValid && !loading ? "#2c3e50" : "#bdc3c7",
                        color: "#fff",
                        border: "none",
                        borderRadius: 8,
                        fontWeight: 700,
                        fontSize: 16,
                        cursor: isValid && !loading ? "pointer" : "not-allowed",
                        boxShadow:
                            isValid && !loading
                                ? "0 4px 16px rgba(44,62,80,0.2)"
                                : "none",
                        transition: "all 0.3s ease",
                        letterSpacing: "0.5px",
                    }}
                >
                    {loading ? "🔄 Creando usuario..." : "✅ Crear usuario"}
                </button>

                {success && (
                    <div
                        style={{
                            color: "#27ae60",
                            fontWeight: 600,
                            marginTop: 20,
                            textAlign: "center",
                            padding: "12px",
                            background: "#d5f4e6",
                            borderRadius: 8,
                            border: "1px solid #a8e6cf",
                        }}
                    >
                        🎉 {success}
                    </div>
                )}
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
            </form>
        </div>
    );
};

export default CrearUsuarioForm;
