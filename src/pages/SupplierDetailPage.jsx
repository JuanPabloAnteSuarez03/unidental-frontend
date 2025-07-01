import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getSupplierById } from "../services/suppliersService";
import ProductosTable from "../components/Alertas/ProductosTable";
import { FaArrowLeft, FaBoxOpen } from "react-icons/fa";

const SupplierDetailPage = () => {
    const { supplierName } = useParams();
    const { authToken } = useAuth();
    const navigate = useNavigate();

    const [supplier, setSupplier] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    // Extraer el ID del proveedor del nombre de la URL
    const extractSupplierId = (urlName) => {
        // Buscar el ID en el formato: "nombre-proveedor-id-123"
        const match = urlName.match(/-id-(\d+)$/);
        return match ? parseInt(match[1]) : null;
    };

    useEffect(() => {
        const loadSupplier = async () => {
            if (!authToken) {
                navigate("/login");
                return;
            }

            const supplierId = extractSupplierId(supplierName);
            if (!supplierId) {
                setError("ID de proveedor no válido");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);
                const supplierData = await getSupplierById(
                    supplierId,
                    authToken
                );
                setSupplier(supplierData);
            } catch (err) {
                console.error("Error loading supplier:", err);
                setError("Error al cargar los datos del proveedor");
            } finally {
                setLoading(false);
            }
        };

        loadSupplier();
    }, [supplierName, authToken, navigate]);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("es-ES", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const handleBackToSuppliers = () => {
        navigate("/proveedores");
    };

    // Función para filtrar productos basado en el término de búsqueda
    const getFilteredProducts = () => {
        if (!supplier || !supplier.purchase_options) return [];

        if (!searchTerm.trim()) {
            return supplier.purchase_options;
        }

        const searchLower = searchTerm.toLowerCase();
        return supplier.purchase_options.filter(
            (option) =>
                option.product_name.toLowerCase().includes(searchLower) ||
                option.category_name.toLowerCase().includes(searchLower) ||
                option.purchase_price.toString().includes(searchLower)
        );
    };

    const filteredProducts = getFilteredProducts();
    const totalProducts = supplier?.purchase_options?.length || 0;
    const filteredCount = filteredProducts.length;

    if (loading) {
        return (
            <div
                style={{
                    padding: "20px",
                    maxWidth: "1200px",
                    margin: "0 auto",
                    fontFamily:
                        "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                    backgroundColor: "#f8f9fa",
                    minHeight: "calc(100vh - 140px)",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "400px",
                        flexDirection: "column",
                    }}
                >
                    <div
                        style={{
                            width: "50px",
                            height: "50px",
                            border: "4px solid #e3e6ea",
                            borderTop: "4px solid #007bff",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite",
                        }}
                    ></div>
                    <p
                        style={{
                            marginTop: "20px",
                            color: "#6c757d",
                            fontSize: "16px",
                        }}
                    >
                        Cargando detalles del proveedor...
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div
                style={{
                    padding: "20px",
                    maxWidth: "1200px",
                    margin: "0 auto",
                    fontFamily:
                        "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                    backgroundColor: "#f8f9fa",
                    minHeight: "calc(100vh - 140px)",
                }}
            >
                <div
                    style={{
                        backgroundColor: "#f8d7da",
                        border: "1px solid #f5c6cb",
                        borderRadius: "8px",
                        padding: "24px",
                        marginBottom: "24px",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                    }}
                >
                    <svg
                        width="24"
                        height="24"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        style={{ color: "#721c24", flexShrink: 0 }}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    <div>
                        <h3
                            style={{
                                margin: "0 0 8px 0",
                                fontSize: "16px",
                                fontWeight: "600",
                                color: "#721c24",
                            }}
                        >
                            Error
                        </h3>
                        <p
                            style={{
                                margin: "0 0 16px 0",
                                fontSize: "14px",
                                color: "#721c24",
                            }}
                        >
                            {error}
                        </p>
                        <button
                            onClick={handleBackToSuppliers}
                            style={{
                                padding: "8px 16px",
                                backgroundColor: "#721c24",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                fontSize: "14px",
                                cursor: "pointer",
                            }}
                        >
                            Volver a Proveedores
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!supplier) {
        return (
            <div
                style={{
                    padding: "20px",
                    maxWidth: "1200px",
                    margin: "0 auto",
                    fontFamily:
                        "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                    backgroundColor: "#f8f9fa",
                    minHeight: "calc(100vh - 140px)",
                }}
            >
                <div
                    style={{
                        backgroundColor: "#fff3cd",
                        border: "1px solid #ffeaa7",
                        borderRadius: "8px",
                        padding: "24px",
                        textAlign: "center",
                    }}
                >
                    <h3 style={{ margin: "0 0 16px 0", color: "#856404" }}>
                        Proveedor no encontrado
                    </h3>
                    <p style={{ margin: "0 0 16px 0", color: "#856404" }}>
                        El proveedor que buscas no existe o ha sido eliminado.
                    </p>
                    <button
                        onClick={handleBackToSuppliers}
                        style={{
                            padding: "8px 16px",
                            backgroundColor: "#856404",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            fontSize: "14px",
                            cursor: "pointer",
                        }}
                    >
                        Volver a Proveedores
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            className="supplier-detail-page"
            style={{
                padding: "20px",
                maxWidth: "1400px",
                margin: "0 auto",
                fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                backgroundColor: "#f8f9fa",
                minHeight: "calc(100vh - 140px)",
            }}
        >
            {/* Botón de regreso */}
            <div
                style={{
                    marginBottom: "20px",
                }}
            >
                <button
                    onClick={handleBackToSuppliers}
                    style={{
                        padding: "12px 20px",
                        backgroundColor: "#e3f2fd",
                        color: "#1976d2",
                        border: "none",
                        borderRadius: "12px",
                        fontSize: "15px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        fontWeight: 600,
                        boxShadow: "0 4px 12px rgba(25,118,210,0.15)",
                        transition: "all 0.3s ease",
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = "#1976d2";
                        e.currentTarget.style.color = "white";
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow =
                            "0 6px 20px rgba(25,118,210,0.25)";
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = "#e3f2fd";
                        e.currentTarget.style.color = "#1976d2";
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow =
                            "0 4px 12px rgba(25,118,210,0.15)";
                    }}
                >
                    <FaArrowLeft style={{ fontSize: "16px" }} /> Volver a
                    Proveedores
                </button>
            </div>

            {/* Header con información del proveedor */}
            <div
                style={{
                    backgroundColor: "white",
                    borderRadius: "20px",
                    padding: "32px",
                    marginBottom: "30px",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
                    border: "1px solid #f0f0f0",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                {/* Barra de color superior */}
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: "4px",
                        background:
                            "linear-gradient(90deg, #2c3e50 0%, #34495e 100%)",
                    }}
                />

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "24px",
                        marginBottom: "16px",
                    }}
                >
                    <div
                        style={{
                            width: "64px",
                            height: "64px",
                            borderRadius: "16px",
                            backgroundColor: "#e3f2fd",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 4px 16px rgba(25,118,210,0.15)",
                        }}
                    >
                        <svg
                            width="32"
                            height="32"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            style={{ color: "#1976d2" }}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                            />
                        </svg>
                    </div>
                    <div style={{ flex: 1 }}>
                        <h1
                            style={{
                                fontSize: "2.5rem",
                                fontWeight: "700",
                                color: "#2c3e50",
                                margin: "0 0 12px 0",
                                lineHeight: "1.2",
                            }}
                        >
                            {supplier.name}
                        </h1>
                        <div
                            style={{
                                display: "flex",
                                gap: "16px",
                                flexWrap: "wrap",
                                alignItems: "center",
                            }}
                        >
                            <span
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    padding: "8px 16px",
                                    backgroundColor: "#e3f2fd",
                                    color: "#1976d2",
                                    borderRadius: "20px",
                                    fontSize: "14px",
                                    fontWeight: "700",
                                    letterSpacing: "0.5px",
                                    boxShadow: "0 2px 8px rgba(25,118,210,0.1)",
                                }}
                            >
                                ID: #{supplier.id}
                            </span>
                            <span
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    padding: "8px 16px",
                                    backgroundColor: "#e8f5e9",
                                    color: "#2e7d32",
                                    borderRadius: "20px",
                                    fontSize: "14px",
                                    fontWeight: "700",
                                    letterSpacing: "0.5px",
                                    boxShadow: "0 2px 8px rgba(46,125,50,0.1)",
                                }}
                            >
                                Activo
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Información del proveedor */}
            <div
                style={{
                    backgroundColor: "white",
                    borderRadius: "20px",
                    padding: "32px",
                    marginBottom: "30px",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
                    border: "1px solid #f0f0f0",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                {/* Barra de color superior */}
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: "4px",
                        background:
                            "linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)",
                    }}
                />

                <h2
                    style={{
                        fontSize: "28px",
                        fontWeight: "700",
                        color: "#2c3e50",
                        margin: "0 0 32px 0",
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                    }}
                >
                    <div
                        style={{
                            width: "48px",
                            height: "48px",
                            borderRadius: "12px",
                            backgroundColor: "#e3f2fd",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 4px 12px rgba(25,118,210,0.15)",
                        }}
                    >
                        <svg
                            width="24"
                            height="24"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            style={{ color: "#1976d2" }}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                        </svg>
                    </div>
                    Información de Contacto
                </h2>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fit, minmax(350px, 1fr))",
                        gap: "40px",
                    }}
                >
                    {/* Información básica */}
                    <div
                        style={{
                            backgroundColor: "#fafbfc",
                            borderRadius: "16px",
                            padding: "24px",
                            border: "1px solid #e3f2fd",
                        }}
                    >
                        <h3
                            style={{
                                fontSize: "18px",
                                fontWeight: "700",
                                color: "#1976d2",
                                margin: "0 0 24px 0",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                            }}
                        >
                            <svg
                                width="18"
                                height="18"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                            </svg>
                            Información Básica
                        </h3>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "20px",
                            }}
                        >
                            <div
                                style={{
                                    backgroundColor: "white",
                                    borderRadius: "12px",
                                    padding: "16px",
                                    border: "1px solid #e9ecef",
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                                }}
                            >
                                <label
                                    style={{
                                        fontSize: "11px",
                                        color: "#6c757d",
                                        textTransform: "uppercase",
                                        fontWeight: "700",
                                        letterSpacing: "0.5px",
                                        marginBottom: "8px",
                                        display: "block",
                                    }}
                                >
                                    Nombre del Contacto
                                </label>
                                <p
                                    style={{
                                        fontSize: "16px",
                                        color: "#2c3e50",
                                        margin: 0,
                                        fontWeight: "600",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                    }}
                                >
                                    <svg
                                        width="16"
                                        height="16"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        style={{ color: "#28a745" }}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                        />
                                    </svg>
                                    {supplier.contact_name || (
                                        <span
                                            style={{
                                                color: "#adb5bd",
                                                fontStyle: "italic",
                                                fontWeight: "400",
                                            }}
                                        >
                                            No especificado
                                        </span>
                                    )}
                                </p>
                            </div>
                            <div
                                style={{
                                    backgroundColor: "white",
                                    borderRadius: "12px",
                                    padding: "16px",
                                    border: "1px solid #e9ecef",
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                                }}
                            >
                                <label
                                    style={{
                                        fontSize: "11px",
                                        color: "#6c757d",
                                        textTransform: "uppercase",
                                        fontWeight: "700",
                                        letterSpacing: "0.5px",
                                        marginBottom: "8px",
                                        display: "block",
                                    }}
                                >
                                    Teléfono
                                </label>
                                <p
                                    style={{
                                        fontSize: "16px",
                                        color: "#2c3e50",
                                        margin: 0,
                                        fontWeight: "600",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                    }}
                                >
                                    {supplier.phone ? (
                                        <>
                                            <svg
                                                width="16"
                                                height="16"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                                style={{ color: "#28a745" }}
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                                />
                                            </svg>
                                            {supplier.phone}
                                        </>
                                    ) : (
                                        <span
                                            style={{
                                                color: "#adb5bd",
                                                fontStyle: "italic",
                                                fontWeight: "400",
                                            }}
                                        >
                                            No especificado
                                        </span>
                                    )}
                                </p>
                            </div>
                            <div
                                style={{
                                    backgroundColor: "white",
                                    borderRadius: "12px",
                                    padding: "16px",
                                    border: "1px solid #e9ecef",
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                                }}
                            >
                                <label
                                    style={{
                                        fontSize: "11px",
                                        color: "#6c757d",
                                        textTransform: "uppercase",
                                        fontWeight: "700",
                                        letterSpacing: "0.5px",
                                        marginBottom: "8px",
                                        display: "block",
                                    }}
                                >
                                    Email
                                </label>
                                <p
                                    style={{
                                        fontSize: "16px",
                                        color: "#2c3e50",
                                        margin: 0,
                                        fontWeight: "600",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                    }}
                                >
                                    {supplier.email ? (
                                        <>
                                            <svg
                                                width="16"
                                                height="16"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                                style={{ color: "#007bff" }}
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                                />
                                            </svg>
                                            {supplier.email}
                                        </>
                                    ) : (
                                        <span
                                            style={{
                                                color: "#adb5bd",
                                                fontStyle: "italic",
                                                fontWeight: "400",
                                            }}
                                        >
                                            No especificado
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Información adicional */}
                    <div
                        style={{
                            backgroundColor: "#fafbfc",
                            borderRadius: "16px",
                            padding: "24px",
                            border: "1px solid #e8f5e9",
                        }}
                    >
                        <h3
                            style={{
                                fontSize: "18px",
                                fontWeight: "700",
                                color: "#388e3c",
                                margin: "0 0 24px 0",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                            }}
                        >
                            <svg
                                width="18"
                                height="18"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                            </svg>
                            Información Adicional
                        </h3>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "20px",
                            }}
                        >
                            <div
                                style={{
                                    backgroundColor: "white",
                                    borderRadius: "12px",
                                    padding: "16px",
                                    border: "1px solid #e9ecef",
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                                }}
                            >
                                <label
                                    style={{
                                        fontSize: "11px",
                                        color: "#6c757d",
                                        textTransform: "uppercase",
                                        fontWeight: "700",
                                        letterSpacing: "0.5px",
                                        marginBottom: "8px",
                                        display: "block",
                                    }}
                                >
                                    Dirección
                                </label>
                                <p
                                    style={{
                                        fontSize: "16px",
                                        color: "#2c3e50",
                                        margin: 0,
                                        fontWeight: "600",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                    }}
                                >
                                    <svg
                                        width="16"
                                        height="16"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        style={{ color: "#ff9800" }}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                        />
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                        />
                                    </svg>
                                    {supplier.address || (
                                        <span
                                            style={{
                                                color: "#adb5bd",
                                                fontStyle: "italic",
                                                fontWeight: "400",
                                            }}
                                        >
                                            No especificada
                                        </span>
                                    )}
                                </p>
                            </div>
                            <div
                                style={{
                                    backgroundColor: "white",
                                    borderRadius: "12px",
                                    padding: "16px",
                                    border: "1px solid #e9ecef",
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                                }}
                            >
                                <label
                                    style={{
                                        fontSize: "11px",
                                        color: "#6c757d",
                                        textTransform: "uppercase",
                                        fontWeight: "700",
                                        letterSpacing: "0.5px",
                                        marginBottom: "8px",
                                        display: "block",
                                    }}
                                >
                                    Ciudad
                                </label>
                                <p
                                    style={{
                                        fontSize: "16px",
                                        color: "#2c3e50",
                                        margin: 0,
                                        fontWeight: "600",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                    }}
                                >
                                    <svg
                                        width="16"
                                        height="16"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        style={{ color: "#9c27b0" }}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                        />
                                    </svg>
                                    {supplier.city || (
                                        <span
                                            style={{
                                                color: "#adb5bd",
                                                fontStyle: "italic",
                                                fontWeight: "400",
                                            }}
                                        >
                                            No especificada
                                        </span>
                                    )}
                                </p>
                            </div>
                            <div
                                style={{
                                    backgroundColor: "white",
                                    borderRadius: "12px",
                                    padding: "16px",
                                    border: "1px solid #e9ecef",
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                                }}
                            >
                                <label
                                    style={{
                                        fontSize: "11px",
                                        color: "#6c757d",
                                        textTransform: "uppercase",
                                        fontWeight: "700",
                                        letterSpacing: "0.5px",
                                        marginBottom: "8px",
                                        display: "block",
                                    }}
                                >
                                    País
                                </label>
                                <p
                                    style={{
                                        fontSize: "16px",
                                        color: "#2c3e50",
                                        margin: 0,
                                        fontWeight: "600",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                    }}
                                >
                                    <svg
                                        width="16"
                                        height="16"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        style={{ color: "#f44336" }}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                    {supplier.country || (
                                        <span
                                            style={{
                                                color: "#adb5bd",
                                                fontStyle: "italic",
                                                fontWeight: "400",
                                            }}
                                        >
                                            No especificado
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabla de productos del proveedor */}
            <div
                className="supplier-products-table-container"
                style={{
                    backgroundColor: "white",
                    borderRadius: "12px",
                    padding: "32px 24px 24px 24px",
                    marginTop: "32px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    border: "1px solid #e9ecef",
                }}
            >
                <h2
                    style={{
                        fontSize: "1.5rem",
                        fontWeight: "700",
                        color: "#212529",
                        margin: "0 0 28px 0",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                    }}
                >
                    <FaBoxOpen style={{ color: "#1976d2", fontSize: 22 }} />
                    Productos ofrecidos por este proveedor
                </h2>

                {/* Barra de búsqueda y contador */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "24px",
                        flexWrap: "wrap",
                        gap: "16px",
                    }}
                >
                    <div
                        style={{
                            position: "relative",
                            flex: "1",
                            maxWidth: "400px",
                        }}
                    >
                        <input
                            type="text"
                            placeholder="Buscar productos por nombre, categoría o precio..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "12px 16px 12px 48px",
                                border: "2px solid #e9ecef",
                                borderRadius: "12px",
                                fontSize: "15px",
                                backgroundColor: "#ffffff",
                                color: "#2c3e50",
                                outline: "none",
                                transition: "all 0.3s ease",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = "#1976d2";
                                e.target.style.boxShadow =
                                    "0 4px 16px rgba(25,118,210,0.15)";
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = "#e9ecef";
                                e.target.style.boxShadow =
                                    "0 2px 8px rgba(0,0,0,0.04)";
                            }}
                        />
                        <svg
                            width="20"
                            height="20"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            style={{
                                position: "absolute",
                                left: "16px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                color: "#6c757d",
                                pointerEvents: "none",
                            }}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "8px 16px",
                            backgroundColor: "#e3f2fd",
                            borderRadius: "20px",
                            border: "1px solid #bbdefb",
                        }}
                    >
                        <span
                            style={{
                                fontSize: "14px",
                                fontWeight: "600",
                                color: "#1976d2",
                            }}
                        >
                            {searchTerm.trim() ? (
                                <>
                                    {filteredCount} de {totalProducts} productos
                                </>
                            ) : (
                                <>{totalProducts} productos total</>
                            )}
                        </span>
                    </div>
                </div>
                {supplier.purchase_options &&
                supplier.purchase_options.length > 0 ? (
                    <div style={{ overflowX: "auto" }}>
                        <table
                            style={{
                                width: "100%",
                                borderCollapse: "collapse",
                                minWidth: 900,
                                backgroundColor: "#fff",
                            }}
                        >
                            <thead>
                                <tr
                                    style={{
                                        background:
                                            "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)",
                                        color: "white",
                                    }}
                                >
                                    <th
                                        style={{
                                            padding: "16px 12px",
                                            textAlign: "left",
                                            fontSize: "14px",
                                            fontWeight: "600",
                                            letterSpacing: "0.5px",
                                            textTransform: "uppercase",
                                        }}
                                    >
                                        🏷️ Producto
                                    </th>
                                    <th
                                        style={{
                                            padding: "16px 12px",
                                            textAlign: "left",
                                            fontSize: "14px",
                                            fontWeight: "600",
                                            letterSpacing: "0.5px",
                                            textTransform: "uppercase",
                                        }}
                                    >
                                        📂 Categoría
                                    </th>
                                    <th
                                        style={{
                                            padding: "16px 12px",
                                            textAlign: "left",
                                            fontSize: "14px",
                                            fontWeight: "600",
                                            letterSpacing: "0.5px",
                                            textTransform: "uppercase",
                                        }}
                                    >
                                        💲 Precio de compra
                                    </th>
                                    <th
                                        style={{
                                            padding: "16px 12px",
                                            textAlign: "center",
                                            fontSize: "14px",
                                            fontWeight: "600",
                                            letterSpacing: "0.5px",
                                            textTransform: "uppercase",
                                        }}
                                    >
                                        ✅ Vigente
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProducts.map((option, idx) => (
                                    <tr
                                        key={option.id}
                                        style={{
                                            backgroundColor:
                                                idx % 2 === 0
                                                    ? "#fff"
                                                    : "#f8f9fa",
                                        }}
                                    >
                                        <td
                                            style={{
                                                padding: "16px 12px",
                                                borderBottom:
                                                    "1px solid #e9ecef",
                                                fontWeight: 600,
                                                color: "#2c3e50",
                                                fontSize: 15,
                                            }}
                                        >
                                            {option.product_name}
                                        </td>
                                        <td
                                            style={{
                                                padding: "16px 12px",
                                                borderBottom:
                                                    "1px solid #e9ecef",
                                            }}
                                        >
                                            <span
                                                style={{
                                                    backgroundColor: "#e3f2fd",
                                                    color: "#1565c0",
                                                    padding: "4px 10px",
                                                    borderRadius: "12px",
                                                    fontSize: "13px",
                                                    fontWeight: 500,
                                                }}
                                            >
                                                {option.category_name}
                                            </span>
                                        </td>
                                        <td
                                            style={{
                                                padding: "16px 12px",
                                                borderBottom:
                                                    "1px solid #e9ecef",
                                                color: "#1976d2",
                                                fontWeight: 600,
                                                fontFamily: "monospace",
                                                fontSize: 15,
                                            }}
                                        >
                                            $
                                            {parseFloat(
                                                option.purchase_price
                                            ).toFixed(2)}
                                        </td>
                                        <td
                                            style={{
                                                padding: "16px 12px",
                                                borderBottom:
                                                    "1px solid #e9ecef",
                                                textAlign: "center",
                                            }}
                                        >
                                            <span
                                                style={{
                                                    display: "inline-block",
                                                    padding: "6px 14px",
                                                    borderRadius: "20px",
                                                    backgroundColor:
                                                        option.is_currently_valid
                                                            ? "#d4edda"
                                                            : "#ffeaa7",
                                                    color: option.is_currently_valid
                                                        ? "#155724"
                                                        : "#856404",
                                                    fontWeight: 700,
                                                    fontSize: "13px",
                                                    letterSpacing: "0.5px",
                                                    border: `2px solid ${
                                                        option.is_currently_valid
                                                            ? "#c3e6cb"
                                                            : "#ffeaa7"
                                                    }`,
                                                    textTransform: "uppercase",
                                                }}
                                            >
                                                {option.is_currently_valid
                                                    ? "VIGENTE"
                                                    : "NO VIGENTE"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : searchTerm.trim() && filteredProducts.length === 0 ? (
                    <div
                        style={{
                            textAlign: "center",
                            padding: "40px 20px",
                            color: "#6c757d",
                            fontStyle: "italic",
                            backgroundColor: "#f8f9fa",
                            borderRadius: "12px",
                            border: "1px solid #e9ecef",
                        }}
                    >
                        <svg
                            width="48"
                            height="48"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            style={{ marginBottom: "16px", opacity: 0.5 }}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                        <div style={{ fontSize: "16px", marginBottom: "8px" }}>
                            No se encontraron productos
                        </div>
                        <div style={{ fontSize: "14px" }}>
                            No hay productos que coincidan con "{searchTerm}"
                        </div>
                    </div>
                ) : (
                    <div style={{ color: "#6c757d", fontStyle: "italic" }}>
                        Este proveedor no tiene productos registrados.
                    </div>
                )}
            </div>

            {/* Información del sistema */}
            <div
                style={{
                    backgroundColor: "white",
                    borderRadius: "20px",
                    padding: "32px",
                    marginTop: "30px",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
                    border: "1px solid #f0f0f0",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                {/* Barra de color superior */}
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: "4px",
                        background:
                            "linear-gradient(90deg, #6c757d 0%, #495057 100%)",
                    }}
                />

                <h2
                    style={{
                        fontSize: "28px",
                        fontWeight: "700",
                        color: "#2c3e50",
                        margin: "0 0 32px 0",
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                    }}
                >
                    <div
                        style={{
                            width: "48px",
                            height: "48px",
                            borderRadius: "12px",
                            backgroundColor: "#f8f9fa",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 4px 12px rgba(108,117,125,0.15)",
                        }}
                    >
                        <svg
                            width="24"
                            height="24"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            style={{ color: "#6c757d" }}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                    </div>
                    Información del Sistema
                </h2>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fit, minmax(300px, 1fr))",
                        gap: "32px",
                    }}
                >
                    <div
                        style={{
                            backgroundColor: "#fafbfc",
                            borderRadius: "16px",
                            padding: "24px",
                            border: "1px solid #e9ecef",
                        }}
                    >
                        <label
                            style={{
                                fontSize: "11px",
                                color: "#6c757d",
                                textTransform: "uppercase",
                                fontWeight: "700",
                                letterSpacing: "0.5px",
                                marginBottom: "8px",
                                display: "block",
                            }}
                        >
                            Fecha de Creación
                        </label>
                        <p
                            style={{
                                fontSize: "16px",
                                color: "#2c3e50",
                                margin: 0,
                                fontWeight: "600",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                            }}
                        >
                            <svg
                                width="16"
                                height="16"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                style={{ color: "#6c757d" }}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                            </svg>
                            {formatDate(supplier.created_at)}
                        </p>
                    </div>
                    <div
                        style={{
                            backgroundColor: "#fafbfc",
                            borderRadius: "16px",
                            padding: "24px",
                            border: "1px solid #e9ecef",
                        }}
                    >
                        <label
                            style={{
                                fontSize: "11px",
                                color: "#6c757d",
                                textTransform: "uppercase",
                                fontWeight: "700",
                                letterSpacing: "0.5px",
                                marginBottom: "8px",
                                display: "block",
                            }}
                        >
                            Última Actualización
                        </label>
                        <p
                            style={{
                                fontSize: "16px",
                                color: "#2c3e50",
                                margin: 0,
                                fontWeight: "600",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                            }}
                        >
                            <svg
                                width="16"
                                height="16"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                style={{ color: "#6c757d" }}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            {supplier.updated_at
                                ? formatDate(supplier.updated_at)
                                : "No actualizado"}
                        </p>
                    </div>
                </div>
            </div>

            <style>
                {`
                .supplier-products-table-container {
                    margin-bottom: 30px;
                }
                .supplier-products-table {
                    border-radius: 12px;
                    overflow: hidden;
                    background: white;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
                }
                .supplier-products-table th {
                    background-color: #f5f5f5;
                    padding: 16px 15px;
                    text-align: left;
                    font-weight: 700;
                    color: #333;
                    border-bottom: 1px solid #ddd;
                    font-size: 15px;
                }
                .supplier-products-table td {
                    padding: 15px 15px;
                    border-bottom: 1px solid #eee;
                    font-size: 15px;
                }
                .supplier-products-table tr:last-child td {
                    border-bottom: none;
                }
                .supplier-products-table tbody tr:hover {
                    background-color: #e3f2fd44;
                    transition: background 0.2s;
                }
                .supplier-detail-page h1, .supplier-detail-page h2 {
                    letter-spacing: 0.5px;
                }
                `}
            </style>

            <style>
                {`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}
            </style>
        </div>
    );
};

export default SupplierDetailPage;
