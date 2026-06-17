import React, { useState } from "react";
import { registerUser } from "../services/authService";

const TestRegisterPage = () => {
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        first_name: "",
        last_name: ""
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");
        setError("");

        try {
            const result = await registerUser(formData);
            setMessage(`Usuario creado exitosamente: ${result.username} (ID: ${result.id})`);
            setFormData({
                username: "",
                email: "",
                password: "",
                first_name: "",
                last_name: ""
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
            <h1>Prueba de Registro de Usuario</h1>
            <p>Esta es una página de prueba para crear usuarios en el backend local.</p>
            
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                <div>
                    <label>Nombre de usuario (obligatorio):</label>
                    <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                        style={{ width: "100%", padding: "8px", margin: "5px 0" }}
                    />
                </div>

                <div>
                    <label>Email (obligatorio):</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        style={{ width: "100%", padding: "8px", margin: "5px 0" }}
                    />
                </div>

                <div>
                    <label>Contraseña (obligatorio):</label>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        style={{ width: "100%", padding: "8px", margin: "5px 0" }}
                    />
                </div>

                <div>
                    <label>Nombre (opcional):</label>
                    <input
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        style={{ width: "100%", padding: "8px", margin: "5px 0" }}
                    />
                </div>

                <div>
                    <label>Apellido (opcional):</label>
                    <input
                        type="text"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        style={{ width: "100%", padding: "8px", margin: "5px 0" }}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        padding: "12px",
                        backgroundColor: loading ? "#ccc" : "#007bff",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: loading ? "not-allowed" : "pointer"
                    }}
                >
                    {loading ? "Creando usuario..." : "Crear Usuario"}
                </button>
            </form>

            {message && (
                <div style={{
                    marginTop: "15px",
                    padding: "10px",
                    backgroundColor: "#d4edda",
                    color: "#155724",
                    border: "1px solid #c3e6cb",
                    borderRadius: "4px"
                }}>
                    {message}
                </div>
            )}

            {error && (
                <div style={{
                    marginTop: "15px",
                    padding: "10px",
                    backgroundColor: "#f8d7da",
                    color: "#721c24",
                    border: "1px solid #f5c6cb",
                    borderRadius: "4px"
                }}>
                    Error: {error}
                </div>
            )}

            <div style={{ marginTop: "30px", padding: "15px", backgroundColor: "#f8f9fa", borderRadius: "4px" }}>
                <h3>Información:</h3>
                <ul>
                    <li>Backend local corriendo en: <code>http://127.0.0.1:8001</code></li>
                    <li>Frontend conectándose vía proxy a: <code>/api</code></li>
                    <li>Endpoint utilizado: <code>/api/auth/users/</code></li>
                </ul>
            </div>
        </div>
    );
};

export default TestRegisterPage;
