import React, { useState, useCallback, useEffect } from "react";
import { customersService } from "../../services/customersService";
import { useAuth } from "../../context/AuthContext";

const CustomerSelector = ({ 
    selectedCustomer, 
    onCustomerSelected 
}) => {
    const { authToken } = useAuth();
    const [searchTerm, setSearchTerm] = useState("");
    const [customers, setCustomers] = useState([]);
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
    const [newCustomerData, setNewCustomerData] = useState({
        name: "",
        phone: "",
        email: "",
        notes: ""
    });
    const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
    const [createError, setCreateError] = useState(null);
    const [phoneError, setPhoneError] = useState(null);
    const [emailError, setEmailError] = useState(null);

    // Load customers when search term changes
    useEffect(() => {
        const searchCustomers = async () => {
            if (searchTerm.length < 2 || !authToken) {
                setFilteredCustomers([]);
                return;
            }

            try {
                setLoading(true);
                const response = await customersService.searchCustomers({ search: searchTerm }, authToken);
                setFilteredCustomers(response.results || []);
            } catch (error) {
                console.error("Error searching customers:", error);
                setFilteredCustomers([]);
            } finally {
                setLoading(false);
            }
        };

        const debounceTimer = setTimeout(searchCustomers, 300);
        return () => clearTimeout(debounceTimer);
    }, [searchTerm, authToken]);

    // Handle customer selection
    const handleCustomerSelect = useCallback((customer) => {
        onCustomerSelected(customer);
        setSearchTerm("");
        setFilteredCustomers([]);
    }, [onCustomerSelected]);

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

    // Handle new customer creation
    const handleCreateCustomer = async () => {
        if (!newCustomerData.name.trim()) {
            setCreateError("El nombre del cliente es requerido");
            return;
        }

        if (newCustomerData.phone && !validatePhone(newCustomerData.phone)) {
            setCreateError("El número de teléfono no es válido");
            return;
        }

        if (newCustomerData.email && !validateEmail(newCustomerData.email)) {
            setCreateError("El formato del email no es válido");
            return;
        }

        if (!authToken) {
            setCreateError("Error de autenticación");
            return;
        }

        try {
            setIsCreatingCustomer(true);
            setCreateError(null);

            const createdCustomer = await customersService.createCustomer(newCustomerData, authToken);
            
            onCustomerSelected(createdCustomer);
            
            // Reset form
            setNewCustomerData({
                name: "",
                phone: "",
                email: "",
                notes: ""
            });
            setShowNewCustomerForm(false);
            setPhoneError(null);
            setEmailError(null);

        } catch (error) {
            console.error("Error creating customer:", error);
            setCreateError(error.message || "Error al crear el cliente");
        } finally {
            setIsCreatingCustomer(false);
        }
    };

    // Handle form input changes
    const handleInputChange = useCallback((field, value) => {
        if (field === "phone") {
            // Filter out non-allowed characters in real time
            const cleanValue = value.replace(/[^\d\s\-\(\)\+]/g, '');
            
            setNewCustomerData(prev => ({
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
            setNewCustomerData(prev => ({
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
            setNewCustomerData(prev => ({
                ...prev,
                [field]: value
            }));
        }
        setCreateError(null);
    }, []);

    return (
        <div>
            {/* Selected Customer Display */}
            {selectedCustomer && (
                <div
                    style={{
                        marginBottom: "15px",
                        padding: "15px",
                        backgroundColor: "#e8f4fd",
                        border: "1px solid #3498db",
                        borderRadius: "6px",
                    }}
                >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                            <h4
                                style={{
                                    margin: "0 0 4px 0",
                                    fontSize: "16px",
                                    fontWeight: "600",
                                    color: "#2c3e50",
                                }}
                            >
                                {selectedCustomer.name}
                            </h4>
                            {selectedCustomer.phone && (
                                <p style={{ margin: "0 0 2px 0", fontSize: "14px", color: "#6c757d" }}>
                                    📞 {selectedCustomer.phone}
                                </p>
                            )}
                            {selectedCustomer.email && (
                                <p style={{ margin: 0, fontSize: "14px", color: "#6c757d" }}>
                                    📧 {selectedCustomer.email}
                                </p>
                            )}
                        </div>
                        <button
                            onClick={() => onCustomerSelected(null)}
                            style={{
                                padding: "8px 10px",
                                border: "1px solid #e74c3c",
                                borderRadius: "4px",
                                backgroundColor: "#e74c3c",
                                color: "white",
                                cursor: "pointer",
                                fontSize: "14px",
                                fontWeight: "500",
                            }}
                            title="Quitar cliente"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}

            {/* Customer Search */}
            {!selectedCustomer && (
                <div>
                    {/* Search Input */}
                    <div style={{ marginBottom: "15px" }}>
                        <label
                            style={{
                                display: "block",
                                fontSize: "14px",
                                fontWeight: "600",
                                color: "#2c3e50",
                                marginBottom: "8px",
                            }}
                        >
                            Buscar Cliente
                        </label>
                        <div style={{ position: "relative" }}>
                            <input
                                type="text"
                                placeholder="Buscar por nombre, teléfono o email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: "100%",
                                    paddingLeft: "35px",
                                    paddingRight: "12px",
                                    paddingTop: "10px",
                                    paddingBottom: "10px",
                                    border: "1px solid #dee2e6",
                                    borderRadius: "4px",
                                    fontSize: "14px",
                                    backgroundColor: "white",
                                }}
                            />
                            <div
                                style={{
                                    position: "absolute",
                                    left: "10px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    color: "#6c757d",
                                    fontSize: "14px",
                                    fontWeight: "normal",
                                }}
                            >
                                ⌕
                            </div>
                        </div>
                    </div>

                    {/* Customer List */}
                    {loading && (
                        <div
                            style={{
                                textAlign: "center",
                                padding: "20px",
                                color: "#6c757d",
                            }}
                        >
                            <div style={{ fontSize: "16px", marginBottom: "8px" }}>⏳</div>
                            <p style={{ margin: 0, fontSize: "14px" }}>Buscando clientes...</p>
                        </div>
                    )}

                    {searchTerm.length >= 2 && !loading && (
                        <div
                            style={{
                                marginBottom: "15px",
                                maxHeight: "200px",
                                overflowY: "auto",
                                border: "1px solid #dee2e6",
                                borderRadius: "4px",
                                backgroundColor: "white",
                            }}
                        >
                            {filteredCustomers.length > 0 ? (
                                filteredCustomers.map((customer) => (
                                    <button
                                        key={customer.id}
                                        onClick={() => handleCustomerSelect(customer)}
                                        style={{
                                            width: "100%",
                                            textAlign: "left",
                                            padding: "12px",
                                            border: "none",
                                            borderBottom: "1px solid #f8f9fa",
                                            backgroundColor: "white",
                                            cursor: "pointer",
                                            transition: "background-color 0.2s ease",
                                        }}
                                        onMouseEnter={(e) => e.target.style.backgroundColor = "#f8f9fa"}
                                        onMouseLeave={(e) => e.target.style.backgroundColor = "white"}
                                    >
                                        <div
                                            style={{
                                                fontSize: "14px",
                                                fontWeight: "600",
                                                color: "#2c3e50",
                                                marginBottom: "2px",
                                            }}
                                        >
                                            {customer.name}
                                        </div>
                                        {customer.phone && (
                                            <div style={{ fontSize: "12px", color: "#6c757d" }}>
                                                📞 {customer.phone}
                                            </div>
                                        )}
                                        {customer.email && (
                                            <div style={{ fontSize: "12px", color: "#6c757d" }}>
                                                📧 {customer.email}
                                            </div>
                                        )}
                                    </button>
                                ))
                            ) : (
                                <div
                                    style={{
                                        textAlign: "center",
                                        padding: "20px",
                                        color: "#6c757d",
                                        fontSize: "14px",
                                    }}
                                >
                                    No se encontraron clientes con "{searchTerm}"
                                </div>
                            )}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            paddingTop: "15px",
                            borderTop: "1px solid #dee2e6",
                        }}
                    >
                        <button
                            onClick={() => onCustomerSelected({ id: null, name: "Cliente genérico" })}
                            style={{
                                fontSize: "14px",
                                color: "#6c757d",
                                backgroundColor: "transparent",
                                border: "none",
                                cursor: "pointer",
                                textDecoration: "underline",
                                padding: "4px 0",
                            }}
                        >
                            Venta sin cliente específico
                        </button>
                        
                        <button
                            onClick={() => setShowNewCustomerForm(!showNewCustomerForm)}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                padding: "10px 16px",
                                fontSize: "14px",
                                fontWeight: "600",
                                color: "white",
                                backgroundColor: "#3498db",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                            }}
                        >
                            <span style={{ marginRight: "6px", fontSize: "12px" }}>+</span>
                            Nuevo Cliente
                        </button>
                    </div>
                </div>
            )}

            {/* New Customer Form */}
            {showNewCustomerForm && (
                <div
                    style={{
                        marginTop: "20px",
                        padding: "20px",
                        border: "2px dashed #dee2e6",
                        borderRadius: "6px",
                        backgroundColor: "#f8f9fa",
                    }}
                >
                    <h4
                        style={{
                            margin: "0 0 15px 0",
                            fontSize: "16px",
                            fontWeight: "600",
                            color: "#2c3e50",
                        }}
                    >
                        Crear Nuevo Cliente
                    </h4>
                    
                    {createError && (
                        <div
                            style={{
                                marginBottom: "15px",
                                padding: "12px",
                                backgroundColor: "#f8d7da",
                                border: "1px solid #f5c6cb",
                                borderRadius: "4px",
                                color: "#721c24",
                                fontSize: "14px",
                            }}
                        >
                            {createError}
                        </div>
                    )}

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "15px" }}>
                        <div>
                            <label
                                style={{
                                    display: "block",
                                    fontSize: "12px",
                                    fontWeight: "600",
                                    color: "#2c3e50",
                                    marginBottom: "4px",
                                }}
                            >
                                Nombre *
                            </label>
                            <input
                                type="text"
                                placeholder="Nombre completo"
                                value={newCustomerData.name}
                                onChange={(e) => handleInputChange("name", e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "8px",
                                    fontSize: "14px",
                                    border: "1px solid #dee2e6",
                                    borderRadius: "4px",
                                    backgroundColor: "white",
                                }}
                            />
                        </div>
                        
                        <div>
                            <label
                                style={{
                                    display: "block",
                                    fontSize: "12px",
                                    fontWeight: "600",
                                    color: "#2c3e50",
                                    marginBottom: "4px",
                                }}
                            >
                                Teléfono
                            </label>
                            <input
                                type="tel"
                                placeholder="Ej: +57 300 123 4567"
                                value={newCustomerData.phone}
                                onChange={(e) => handleInputChange("phone", e.target.value)}
                                pattern="[\d\s\-\(\)\+]*"
                                title="Solo se permiten números, espacios, guiones, paréntesis y signo más"
                                style={{
                                    width: "100%",
                                    padding: "8px",
                                    fontSize: "14px",
                                    border: phoneError ? "1px solid #e74c3c" : "1px solid #dee2e6",
                                    borderRadius: "4px",
                                    backgroundColor: "white",
                                }}
                            />
                            {phoneError && (
                                <div
                                    style={{
                                        fontSize: "12px",
                                        color: "#e74c3c",
                                        marginTop: "4px",
                                    }}
                                >
                                    {phoneError}
                                </div>
                            )}
                        </div>
                        
                        <div style={{ gridColumn: "span 2" }}>
                            <label
                                style={{
                                    display: "block",
                                    fontSize: "12px",
                                    fontWeight: "600",
                                    color: "#2c3e50",
                                    marginBottom: "4px",
                                }}
                            >
                                Email
                            </label>
                            <input
                                type="email"
                                placeholder="Ej: usuario@dominio.com"
                                value={newCustomerData.email}
                                onChange={(e) => handleInputChange("email", e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "8px",
                                    fontSize: "14px",
                                    border: emailError ? "1px solid #e74c3c" : "1px solid #dee2e6",
                                    borderRadius: "4px",
                                    backgroundColor: "white",
                                }}
                            />
                            {emailError && (
                                <div
                                    style={{
                                        fontSize: "12px",
                                        color: "#e74c3c",
                                        marginTop: "4px",
                                    }}
                                >
                                    {emailError}
                                </div>
                            )}
                        </div>
                        
                        <div style={{ gridColumn: "span 2" }}>
                            <label
                                style={{
                                    display: "block",
                                    fontSize: "12px",
                                    fontWeight: "600",
                                    color: "#2c3e50",
                                    marginBottom: "4px",
                                }}
                            >
                                Notas
                            </label>
                            <textarea
                                placeholder="Notas adicionales sobre el cliente"
                                value={newCustomerData.notes}
                                onChange={(e) => handleInputChange("notes", e.target.value)}
                                rows={2}
                                style={{
                                    width: "100%",
                                    padding: "8px",
                                    fontSize: "14px",
                                    border: "1px solid #dee2e6",
                                    borderRadius: "4px",
                                    backgroundColor: "white",
                                    resize: "vertical",
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                        <button
                            onClick={() => {
                                setShowNewCustomerForm(false);
                                setNewCustomerData({
                                    name: "",
                                    phone: "",
                                    email: "",
                                    notes: ""
                                });
                                setCreateError(null);
                                setPhoneError(null);
                                setEmailError(null);
                            }}
                            style={{
                                padding: "10px 16px",
                                fontSize: "14px",
                                color: "#6c757d",
                                backgroundColor: "transparent",
                                border: "1px solid #dee2e6",
                                borderRadius: "4px",
                                cursor: "pointer",
                            }}
                            disabled={isCreatingCustomer}
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleCreateCustomer}
                            disabled={isCreatingCustomer || !newCustomerData.name.trim() || phoneError || emailError}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                padding: "10px 16px",
                                fontSize: "14px",
                                fontWeight: "600",
                                color: "white",
                                backgroundColor: isCreatingCustomer || !newCustomerData.name.trim() || phoneError || emailError ? "#95a5a6" : "#3498db",
                                border: "none",
                                borderRadius: "4px",
                                cursor: isCreatingCustomer || !newCustomerData.name.trim() || phoneError || emailError ? "not-allowed" : "pointer",
                            }}
                        >
                            {isCreatingCustomer ? (
                                <>
                                    <span style={{ marginRight: "8px", fontSize: "12px" }}>⏳</span>
                                    Creando...
                                </>
                            ) : (
                                "Crear Cliente"
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerSelector; 