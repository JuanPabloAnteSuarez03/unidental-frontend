import React, { useState, useCallback } from "react";
import { customersService } from "../services/customersService";
import { useAuth } from "../context/AuthContext";

const NewCustomerPage = () => {
    const { authToken } = useAuth();
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        notes: ""
    });
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [phoneError, setPhoneError] = useState(null);
    const [emailError, setEmailError] = useState(null);

    // Validate phone number
    const validatePhone = (phone) => {
        if (!phone) return true; // Phone is optional
        
        // Allow numbers, spaces, hyphens, parentheses, and plus sign
        const phoneRegex = /^[\d\s\-\(\)\+]*$/;
        
        if (!phoneRegex.test(phone)) {
            return false;
        }
        
        // Check if it has at least some digits
        const digitCount = phone.replace(/[^\d]/g, '').length;
        if (digitCount > 0 && digitCount < 7) {
            return false;
        }
        
        return true;
    };

    // Validate email format
    const validateEmail = (email) => {
        if (!email) return true; // Email is optional
        
        // Standard email regex pattern
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        
        return emailRegex.test(email.trim());
    };

    // Handle form input changes
    const handleInputChange = useCallback((field, value) => {
        if (field === "phone") {
            // Filter out non-allowed characters in real time
            const cleanValue = value.replace(/[^\d\s\-\(\)\+]/g, '');
            
            setFormData(prev => ({
                ...prev,
                [field]: cleanValue
            }));
            
            // Validate phone in real time
            if (cleanValue && !validatePhone(cleanValue)) {
                setPhoneError("Solo se permiten números, espacios, guiones y paréntesis");
            } else {
                setPhoneError(null);
            }
        } else if (field === "email") {
            setFormData(prev => ({
                ...prev,
                [field]: value
            }));
            
            // Validate email in real time
            if (value && !validateEmail(value)) {
                setEmailError("Formato de email inválido (ejemplo: usuario@dominio.com)");
            } else {
                setEmailError(null);
            }
        } else {
            setFormData(prev => ({
                ...prev,
                [field]: value
            }));
        }
        setError(null);
        setSuccess(false);
    }, []);

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            setError("El nombre del cliente es requerido");
            return;
        }

        if (formData.phone && !validatePhone(formData.phone)) {
            setError("El número de teléfono no es válido");
            return;
        }

        if (formData.email && !validateEmail(formData.email)) {
            setError("El formato del email no es válido");
            return;
        }

        if (!authToken) {
            setError("Error de autenticación");
            return;
        }

        try {
            setIsCreating(true);
            setError(null);

            await customersService.createCustomer(formData, authToken);
            
            setSuccess(true);
            
            // Reset form
            setFormData({
                name: "",
                phone: "",
                email: "",
                notes: ""
            });
            setPhoneError(null);
            setEmailError(null);

            // Scroll to top to show success message
            window.scrollTo({ top: 0, behavior: 'smooth' });

        } catch (error) {
            console.error("Error creating customer:", error);
            setError(error.message || "Error al crear el cliente");
        } finally {
            setIsCreating(false);
        }
    };

    // Handle reset form
    const handleReset = () => {
        setFormData({
            name: "",
            phone: "",
            email: "",
            notes: ""
        });
        setError(null);
        setSuccess(false);
        setPhoneError(null);
        setEmailError(null);
    };

    return (
        <div
            style={{
                padding: "20px",
                maxWidth: "800px",
                margin: "0 auto",
                fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                backgroundColor: "#f8f9fa",
                minHeight: "calc(100vh - 140px)",
            }}
        >
            {/* Título de la página */}
            <div
                style={{
                    marginBottom: "30px",
                    borderBottom: "2px solid #eee",
                    paddingBottom: "15px",
                    backgroundColor: "white",
                    padding: "20px",
                    borderRadius: "8px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <h1
                            style={{
                                color: "#2c3e50",
                                fontSize: "28px",
                                fontWeight: "700",
                                margin: "0 0 8px 0",
                            }}
                        >
                            Nuevo Cliente
                        </h1>
                        <p
                            style={{
                                color: "#6c757d",
                                fontSize: "16px",
                                margin: 0,
                            }}
                        >
                            Complete la información para registrar un nuevo cliente
                        </p>
                    </div>
                    
                    <button
                        onClick={() => window.location.href = "/clientes/lista"}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            padding: "10px 16px",
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#3498db",
                            backgroundColor: "transparent",
                            border: "1px solid #3498db",
                            borderRadius: "6px",
                            cursor: "pointer",
                            textDecoration: "none",
                        }}
                    >
                        ← Ver Lista de Clientes
                    </button>
                </div>
            </div>

            {/* Mensajes de estado */}
            {error && (
                <div
                    style={{
                        marginBottom: "20px",
                        padding: "15px",
                        backgroundColor: "#f8d7da",
                        border: "1px solid #f5c6cb",
                        borderRadius: "8px",
                        color: "#721c24",
                        fontSize: "14px",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    }}
                >
                    <strong>Error:</strong> {error}
                </div>
            )}

            {success && (
                <div
                    style={{
                        marginBottom: "20px",
                        padding: "15px",
                        backgroundColor: "#d4edda",
                        border: "1px solid #c3e6cb",
                        borderRadius: "8px",
                        color: "#155724",
                        fontSize: "14px",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    }}
                >
                    <strong>¡Éxito!</strong> El cliente ha sido creado correctamente.
                </div>
            )}

            {/* Formulario */}
            <div
                style={{
                    backgroundColor: "white",
                    borderRadius: "8px",
                    padding: "30px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    border: "1px solid #dee2e6",
                }}
            >
                <form onSubmit={handleSubmit}>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "20px",
                            marginBottom: "20px",
                        }}
                    >
                        {/* Nombre */}
                        <div style={{ gridColumn: "span 2" }}>
                            <label
                                htmlFor="name"
                                style={{
                                    display: "block",
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    color: "#2c3e50",
                                    marginBottom: "8px",
                                }}
                            >
                                Nombre del Cliente *
                            </label>
                            <input
                                type="text"
                                id="name"
                                placeholder="Nombre completo del cliente"
                                value={formData.name}
                                onChange={(e) => handleInputChange("name", e.target.value)}
                                style={{
                                    width: "100%",
                                    boxSizing: "border-box",
                                    padding: "12px",
                                    fontSize: "14px",
                                    border: "1px solid #dee2e6",
                                    borderRadius: "6px",
                                    backgroundColor: "white",
                                    transition: "border-color 0.2s ease",
                                }}
                                onFocus={(e) => e.target.style.borderColor = "#3498db"}
                                onBlur={(e) => e.target.style.borderColor = "#dee2e6"}
                                required
                            />
                        </div>
                        
                        {/* Teléfono */}
                        <div>
                            <label
                                htmlFor="phone"
                                style={{
                                    display: "block",
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    color: "#2c3e50",
                                    marginBottom: "8px",
                                }}
                            >
                                Teléfono
                            </label>
                            <input
                                type="tel"
                                id="phone"
                                placeholder="Ej: +57 300 123 4567"
                                value={formData.phone}
                                onChange={(e) => handleInputChange("phone", e.target.value)}
                                pattern="[\d\s\-\(\)\+]*"
                                title="Solo se permiten números, espacios, guiones, paréntesis y signo más"
                                style={{
                                    width: "100%",
                                    boxSizing: "border-box",
                                    padding: "12px",
                                    fontSize: "14px",
                                    border: phoneError ? "1px solid #e74c3c" : "1px solid #dee2e6",
                                    borderRadius: "6px",
                                    backgroundColor: "white",
                                    transition: "border-color 0.2s ease",
                                }}
                                onFocus={(e) => {
                                    if (!phoneError) e.target.style.borderColor = "#3498db";
                                }}
                                onBlur={(e) => {
                                    if (!phoneError) e.target.style.borderColor = "#dee2e6";
                                }}
                            />
                            {phoneError && (
                                <div
                                    style={{
                                        fontSize: "12px",
                                        color: "#e74c3c",
                                        marginTop: "5px",
                                    }}
                                >
                                    {phoneError}
                                </div>
                            )}
                        </div>
                        
                        {/* Email */}
                        <div>
                            <label
                                htmlFor="email"
                                style={{
                                    display: "block",
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    color: "#2c3e50",
                                    marginBottom: "8px",
                                }}
                            >
                                Correo Electrónico
                            </label>
                            <input
                                type="email"
                                id="email"
                                placeholder="cliente@ejemplo.com"
                                value={formData.email}
                                onChange={(e) => handleInputChange("email", e.target.value)}
                                style={{
                                    width: "100%",
                                    boxSizing: "border-box",
                                    padding: "12px",
                                    fontSize: "14px",
                                    border: emailError ? "1px solid #e74c3c" : "1px solid #dee2e6",
                                    borderRadius: "6px",
                                    backgroundColor: "white",
                                    transition: "border-color 0.2s ease",
                                }}
                                onFocus={(e) => {
                                    if (!emailError) e.target.style.borderColor = "#3498db";
                                }}
                                onBlur={(e) => {
                                    if (!emailError) e.target.style.borderColor = "#dee2e6";
                                }}
                            />
                            {emailError && (
                                <div
                                    style={{
                                        fontSize: "12px",
                                        color: "#e74c3c",
                                        marginTop: "5px",
                                    }}
                                >
                                    {emailError}
                                </div>
                            )}
                        </div>
                        
                        {/* Notas */}
                        <div style={{ gridColumn: "span 2" }}>
                            <label
                                htmlFor="notes"
                                style={{
                                    display: "block",
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    color: "#2c3e50",
                                    marginBottom: "8px",
                                }}
                            >
                                Notas Adicionales
                            </label>
                            <textarea
                                id="notes"
                                placeholder="Información adicional sobre el cliente..."
                                value={formData.notes}
                                onChange={(e) => handleInputChange("notes", e.target.value)}
                                rows={4}
                                style={{
                                    width: "100%",
                                    boxSizing: "border-box",
                                    padding: "12px",
                                    fontSize: "14px",
                                    border: "1px solid #dee2e6",
                                    borderRadius: "6px",
                                    backgroundColor: "white",
                                    resize: "vertical",
                                    fontFamily: "inherit",
                                    transition: "border-color 0.2s ease",
                                }}
                                onFocus={(e) => e.target.style.borderColor = "#3498db"}
                                onBlur={(e) => e.target.style.borderColor = "#dee2e6"}
                            />
                        </div>
                    </div>

                    {/* Información adicional */}
                    <div
                        style={{
                            backgroundColor: "#f8f9fa",
                            border: "1px solid #dee2e6",
                            borderRadius: "6px",
                            padding: "15px",
                            marginBottom: "25px",
                        }}
                    >
                        <h4
                            style={{
                                margin: "0 0 10px 0",
                                fontSize: "14px",
                                fontWeight: "600",
                                color: "#2c3e50",
                            }}
                        >
                            ℹ️ Información Importante
                        </h4>
                        <ul
                            style={{
                                margin: 0,
                                paddingLeft: "20px",
                                fontSize: "13px",
                                color: "#6c757d",
                            }}
                        >
                            <li>Solo el nombre es obligatorio</li>
                            <li>El teléfono puede incluir números, espacios, guiones y paréntesis</li>
                            <li>El correo debe tener un formato válido</li>
                            <li>Las notas son opcionales y pueden contener información adicional</li>
                        </ul>
                    </div>

                    {/* Botones */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: "15px",
                            paddingTop: "20px",
                            borderTop: "1px solid #dee2e6",
                        }}
                    >
                        <button
                            type="button"
                            onClick={handleReset}
                            disabled={isCreating}
                            style={{
                                padding: "12px 24px",
                                fontSize: "14px",
                                fontWeight: "500",
                                color: "#6c757d",
                                backgroundColor: "transparent",
                                border: "1px solid #dee2e6",
                                borderRadius: "6px",
                                cursor: isCreating ? "not-allowed" : "pointer",
                                transition: "all 0.2s ease",
                            }}
                            onMouseEnter={(e) => {
                                if (!isCreating) {
                                    e.target.style.backgroundColor = "#f8f9fa";
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isCreating) {
                                    e.target.style.backgroundColor = "transparent";
                                }
                            }}
                        >
                            Limpiar Formulario
                        </button>

                        <button
                            type="submit"
                            disabled={isCreating || !formData.name.trim() || phoneError || emailError}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                padding: "12px 24px",
                                fontSize: "14px",
                                fontWeight: "600",
                                color: "white",
                                backgroundColor: 
                                    isCreating || !formData.name.trim() || phoneError || emailError 
                                        ? "#95a5a6" 
                                        : "#3498db",
                                border: "none",
                                borderRadius: "6px",
                                cursor: 
                                    isCreating || !formData.name.trim() || phoneError || emailError 
                                        ? "not-allowed" 
                                        : "pointer",
                                transition: "background-color 0.2s ease",
                            }}
                            onMouseEnter={(e) => {
                                if (!isCreating && formData.name.trim() && !phoneError && !emailError) {
                                    e.target.style.backgroundColor = "#2980b9";
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isCreating && formData.name.trim() && !phoneError && !emailError) {
                                    e.target.style.backgroundColor = "#3498db";
                                }
                            }}
                        >
                            {isCreating ? (
                                <>
                                    <span style={{ marginRight: "10px", fontSize: "12px" }}>⏳</span>
                                    Creando Cliente...
                                </>
                            ) : (
                                <>
                                    <span style={{ marginRight: "8px", fontSize: "12px" }}>✓</span>
                                    Crear Cliente
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewCustomerPage;