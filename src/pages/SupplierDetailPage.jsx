import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getSupplierById } from "../services/suppliersService";
import ProductosTable from "../components/Alertas/ProductosTable";
import { FaArrowLeft, FaBoxOpen } from "react-icons/fa";
import AddPurchaseOptionModal from "../components/OrdenesDeCompra/AddPurchaseOptionModal";
import PurchaseOptionDetailModal from "../components/OrdenesDeCompra/PurchaseOptionDetailModal";

const SupplierDetailPage = () => {
    const { supplierName } = useParams();
    const { authToken } = useAuth();
    const navigate = useNavigate();

    const [supplier, setSupplier] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPurchaseOption, setSelectedPurchaseOption] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isDeleteMode, setIsDeleteMode] = useState(false);
    const [selectedOptions, setSelectedOptions] = useState([]); // IDs de opciones seleccionadas
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState(null);
    const [isEditInfo, setIsEditInfo] = useState(false);
    const [editInfo, setEditInfo] = useState({
        name: "",
        phone: "",
        email: "",
    });
    const [showEditConfirm, setShowEditConfirm] = useState(false);
    const [savingEdit, setSavingEdit] = useState(false);
    const [editError, setEditError] = useState(null);
    const [editSuccess, setEditSuccess] = useState(false);

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
        navigate("/compras/proveedores");
    };

    const handleOpenModal = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleSavePurchaseOption = (purchaseOption) => {
        // TODO: Implementar lógica para guardar la opción de compra
        console.log("Opción de compra guardada:", purchaseOption);

        // Actualizar la lista de productos del proveedor
        if (supplier && supplier.purchase_options) {
            const updatedSupplier = {
                ...supplier,
                purchase_options: [
                    ...supplier.purchase_options,
                    purchaseOption,
                ],
            };
            setSupplier(updatedSupplier);
        }

        // Mostrar notificación de éxito
        alert("Opción de compra agregada exitosamente");
    };

    // Función para normalizar tildes y caracteres especiales
    function normalizeText(text) {
        if (!text) return "";
        return text
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();
    }

    // Función para filtrar productos basado en el término de búsqueda
    const getFilteredProducts = () => {
        if (!supplier || !supplier.purchase_options) return [];

        if (!searchTerm.trim()) {
            return supplier.purchase_options;
        }

        const normalizedSearch = normalizeText(searchTerm);
        return supplier.purchase_options.filter(
            (option) =>
                normalizeText(option.product_name).includes(normalizedSearch) ||
                normalizeText(option.category_name).includes(
                    normalizedSearch
                ) ||
                option.purchase_price.toString().includes(searchTerm)
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

            {/* Nombre del proveedor */}
            <div
                style={{
                    backgroundColor: "white",
                    borderRadius: "16px",
                    padding: "32px",
                    marginBottom: "24px",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                    border: "1px solid #e9ecef",
                    textAlign: "center",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "16px",
                        marginBottom: "12px",
                    }}
                >
                    <div
                        style={{
                            width: "48px",
                            height: "48px",
                            backgroundColor: "#e3f2fd",
                            borderRadius: "12px",
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
                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                            />
                        </svg>
                    </div>
                    <h1
                        style={{
                            fontSize: "36px",
                            fontWeight: "800",
                            color: "#2c3e50",
                            margin: "0",
                            letterSpacing: "-0.5px",
                        }}
                    >
                        {supplier.name}
                    </h1>
                </div>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        gap: "16px",
                        flexWrap: "wrap",
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
                        justifyContent: "space-between",
                    }}
                >
                    <span
                        style={{
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
                    </span>
                    <span style={{ display: "flex", gap: 12 }}>
                        {isEditInfo && (
                            <button
                                style={{
                                    padding: "8px 18px",
                                    backgroundColor: "#dc3545",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "8px",
                                    fontWeight: 600,
                                    fontSize: 15,
                                    cursor: "pointer",
                                    boxShadow: "0 2px 8px rgba(220,53,69,0.15)",
                                    transition: "all 0.3s ease",
                                }}
                                onClick={() => setIsEditInfo(false)}
                            >
                                Cancelar edición
                            </button>
                        )}
                        {isEditInfo && (
                            <button
                                style={{
                                    padding: "8px 18px",
                                    backgroundColor: "#1976d2",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "8px",
                                    fontWeight: 600,
                                    fontSize: 15,
                                    cursor: "pointer",
                                    boxShadow:
                                        "0 2px 8px rgba(25,118,210,0.15)",
                                    transition: "all 0.3s ease",
                                }}
                                onClick={() => setShowEditConfirm(true)}
                            >
                                Guardar cambios
                            </button>
                        )}
                        {!isEditInfo && (
                            <button
                                style={{
                                    padding: "8px 18px",
                                    backgroundColor: "#1976d2",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "8px",
                                    fontWeight: 600,
                                    fontSize: 15,
                                    cursor: "pointer",
                                    boxShadow:
                                        "0 2px 8px rgba(25,118,210,0.15)",
                                    transition: "all 0.3s ease",
                                }}
                                onClick={() => {
                                    setEditInfo({
                                        name: supplier.name || "",
                                        phone: supplier.phone || "",
                                        email: supplier.email || "",
                                    });
                                    setIsEditInfo(true);
                                }}
                            >
                                Actualizar info
                            </button>
                        )}
                    </span>
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
                                    Nombre
                                </label>
                                {isEditInfo ? (
                                    <input
                                        type="text"
                                        value={editInfo.name}
                                        onChange={(e) =>
                                            setEditInfo((info) => ({
                                                ...info,
                                                name: e.target.value,
                                            }))
                                        }
                                        style={{
                                            fontSize: "16px",
                                            color: "#2c3e50",
                                            fontWeight: "600",
                                            padding: "8px 12px",
                                            border: "1px solid #bdbdbd",
                                            borderRadius: "6px",
                                            width: "100%",
                                        }}
                                    />
                                ) : (
                                    <p
                                        style={{
                                            fontSize: "16px",
                                            color: "#2c3e50",
                                            margin: 0,
                                            fontWeight: "600",
                                        }}
                                    >
                                        {supplier.name}
                                    </p>
                                )}
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
                                {isEditInfo ? (
                                    <input
                                        type="text"
                                        value={editInfo.phone}
                                        onChange={(e) =>
                                            setEditInfo((info) => ({
                                                ...info,
                                                phone: e.target.value,
                                            }))
                                        }
                                        style={{
                                            fontSize: "16px",
                                            color: "#2c3e50",
                                            fontWeight: "600",
                                            padding: "8px 12px",
                                            border: "1px solid #bdbdbd",
                                            borderRadius: "6px",
                                            width: "100%",
                                        }}
                                    />
                                ) : (
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
                                )}
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
                                {isEditInfo ? (
                                    <input
                                        type="email"
                                        value={editInfo.email}
                                        onChange={(e) =>
                                            setEditInfo((info) => ({
                                                ...info,
                                                email: e.target.value,
                                            }))
                                        }
                                        style={{
                                            fontSize: "16px",
                                            color: "#2c3e50",
                                            fontWeight: "600",
                                            padding: "8px 12px",
                                            border: "1px solid #bdbdbd",
                                            borderRadius: "6px",
                                            width: "100%",
                                        }}
                                    />
                                ) : (
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
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Información adicional */}
                    {/* SECCIÓN ELIMINADA */}
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

                {/* Barra de búsqueda, contador y botón de orden de compra */}
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

                    <div
                        style={{
                            display: "flex",
                            gap: 8,
                            position: "relative",
                        }}
                    >
                        <button
                            onClick={handleOpenModal}
                            style={{
                                padding: "12px 20px",
                                backgroundColor: "#28a745",
                                color: "white",
                                border: "none",
                                borderRadius: "8px",
                                fontSize: "14px",
                                fontWeight: "600",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "8px",
                                boxShadow: "0 2px 8px rgba(40,167,69,0.25)",
                                transition: "all 0.3s ease",
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.backgroundColor =
                                    "#218838";
                                e.currentTarget.style.transform =
                                    "translateY(-1px)";
                                e.currentTarget.style.boxShadow =
                                    "0 4px 12px rgba(40,167,69,0.35)";
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.backgroundColor =
                                    "#28a745";
                                e.currentTarget.style.transform =
                                    "translateY(0)";
                                e.currentTarget.style.boxShadow =
                                    "0 2px 8px rgba(40,167,69,0.25)";
                            }}
                            disabled={isDeleteMode}
                        >
                            <svg
                                width="16"
                                height="16"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                />
                            </svg>
                            Agregar opción
                        </button>
                        <div style={{ position: "relative" }}>
                            {isDeleteMode && (
                                <div
                                    style={{
                                        position: "absolute",
                                        bottom: "100%",
                                        left: "50%",
                                        transform: "translateX(-50%)",
                                        marginBottom: 8,
                                        padding: "8px 16px",
                                        background: "#fff3cd",
                                        color: "#856404",
                                        borderRadius: "20px",
                                        border: "1px solid #ffeeba",
                                        fontWeight: 600,
                                        fontSize: 14,
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 8,
                                        whiteSpace: "nowrap",
                                        zIndex: 10,
                                    }}
                                >
                                    Seleccionadas: {selectedOptions.length}
                                </div>
                            )}
                            <button
                                style={{
                                    padding: "12px 20px",
                                    backgroundColor: isDeleteMode
                                        ? "#b52a37"
                                        : "#dc3545",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "8px",
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    cursor: "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    boxShadow: "0 2px 8px rgba(220,53,69,0.15)",
                                    transition: "all 0.3s ease",
                                }}
                                onClick={() => {
                                    if (
                                        isDeleteMode &&
                                        selectedOptions.length > 0
                                    ) {
                                        setShowDeleteConfirm(true);
                                    } else {
                                        setIsDeleteMode((v) => !v);
                                        setSelectedOptions([]);
                                    }
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                        "#b52a37";
                                    e.currentTarget.style.transform =
                                        "translateY(-1px)";
                                    e.currentTarget.style.boxShadow =
                                        "0 4px 12px rgba(220,53,69,0.25)";
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                        isDeleteMode ? "#b52a37" : "#dc3545";
                                    e.currentTarget.style.transform =
                                        "translateY(0)";
                                    e.currentTarget.style.boxShadow =
                                        "0 2px 8px rgba(220,53,69,0.15)";
                                }}
                            >
                                <svg
                                    width="16"
                                    height="16"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                                {isDeleteMode
                                    ? "Eliminar opción"
                                    : "Eliminar opción"}
                            </button>
                        </div>
                        {isDeleteMode && (
                            <button
                                style={{
                                    padding: "12px 20px",
                                    backgroundColor: "#ff9800",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "8px",
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    cursor: "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    boxShadow: "0 2px 8px rgba(255,152,0,0.15)",
                                    transition: "all 0.3s ease",
                                }}
                                onClick={() => {
                                    setIsDeleteMode(false);
                                    setSelectedOptions([]);
                                }}
                            >
                                Cancelar
                            </button>
                        )}
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
                                                selectedOptions.includes(
                                                    option.id
                                                )
                                                    ? "#ffeaea"
                                                    : idx % 2 === 0
                                                    ? "#fff"
                                                    : "#f8f9fa",
                                            cursor: "pointer",
                                            border: selectedOptions.includes(
                                                option.id
                                            )
                                                ? "2px solid #dc3545"
                                                : undefined,
                                        }}
                                        onClick={() => {
                                            if (isDeleteMode) {
                                                setSelectedOptions((prev) =>
                                                    prev.includes(option.id)
                                                        ? prev.filter(
                                                              (id) =>
                                                                  id !==
                                                                  option.id
                                                          )
                                                        : [...prev, option.id]
                                                );
                                            } else {
                                                setSelectedPurchaseOption(
                                                    option
                                                );
                                                setIsDetailModalOpen(true);
                                            }
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

            {/* Modal para agregar opción de compra */}
            <AddPurchaseOptionModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                supplierId={supplier?.id}
                onSave={handleSavePurchaseOption}
            />

            {/* Modal para ver detalles de la opción de compra */}
            <PurchaseOptionDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                purchaseOption={selectedPurchaseOption}
            />

            {/* Modal de confirmación de eliminación */}
            {showDeleteConfirm && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "rgba(0,0,0,0.4)",
                        zIndex: 3000,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <div
                        style={{
                            background: "white",
                            borderRadius: 16,
                            padding: 32,
                            minWidth: 340,
                            maxWidth: 420,
                            boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
                            textAlign: "center",
                        }}
                    >
                        <h3 style={{ color: "#dc3545", marginBottom: 16 }}>
                            ¿Estás seguro que deseas eliminar las siguientes
                            opciones de compra?
                        </h3>
                        <ul
                            style={{
                                textAlign: "left",
                                margin: "16px 0",
                                padding: 0,
                                listStyle: "none",
                                maxHeight: 180,
                                overflowY: "auto",
                            }}
                        >
                            {supplier.purchase_options
                                .filter((opt) =>
                                    selectedOptions.includes(opt.id)
                                )
                                .map((opt) => (
                                    <li
                                        key={opt.id}
                                        style={{
                                            marginBottom: 6,
                                            color: "#2c3e50",
                                            fontWeight: 500,
                                        }}
                                    >
                                        {opt.product_name}
                                    </li>
                                ))}
                        </ul>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "center",
                                gap: 16,
                                marginTop: 24,
                            }}
                        >
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                style={{
                                    padding: "10px 20px",
                                    background: "#adb5bd",
                                    color: "white",
                                    border: "none",
                                    borderRadius: 8,
                                    fontWeight: 600,
                                    fontSize: 15,
                                    cursor: "pointer",
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                style={{
                                    padding: "10px 20px",
                                    background: "#dc3545",
                                    color: "white",
                                    border: "none",
                                    borderRadius: 8,
                                    fontWeight: 600,
                                    fontSize: 15,
                                    cursor: deleting
                                        ? "not-allowed"
                                        : "pointer",
                                    opacity: deleting ? 0.7 : 1,
                                }}
                                disabled={deleting}
                                onClick={async () => {
                                    setDeleting(true);
                                    setDeleteError(null);
                                    try {
                                        for (const id of selectedOptions) {
                                            const response = await fetch(
                                                `https://unidental-backend.onrender.com/api/suppliers/purchase-options/${id}/`,
                                                {
                                                    method: "DELETE",
                                                    headers: {
                                                        Authorization: `Token ${authToken}`,
                                                    },
                                                }
                                            );
                                            if (!response.ok) {
                                                throw new Error(
                                                    `Error al eliminar opción con id ${id}`
                                                );
                                            }
                                        }
                                        // Actualizar la lista local eliminando las opciones borradas
                                        if (
                                            supplier &&
                                            supplier.purchase_options
                                        ) {
                                            const updatedSupplier = {
                                                ...supplier,
                                                purchase_options:
                                                    supplier.purchase_options.filter(
                                                        (opt) =>
                                                            !selectedOptions.includes(
                                                                opt.id
                                                            )
                                                    ),
                                            };
                                            setSupplier(updatedSupplier);
                                        }
                                        setShowDeleteConfirm(false);
                                        setIsDeleteMode(false);
                                        setSelectedOptions([]);
                                    } catch (err) {
                                        setDeleteError(err.message);
                                    } finally {
                                        setDeleting(false);
                                    }
                                }}
                            >
                                {deleting ? "Eliminando..." : "Eliminar"}
                            </button>
                        </div>
                        {deleteError && (
                            <div
                                style={{
                                    color: "#dc3545",
                                    marginTop: 12,
                                    fontWeight: 500,
                                }}
                            >
                                {deleteError}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal de confirmación de edición de info */}
            {showEditConfirm && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "rgba(0,0,0,0.4)",
                        zIndex: 3000,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <div
                        style={{
                            background: "white",
                            borderRadius: 16,
                            padding: 32,
                            minWidth: 340,
                            maxWidth: 420,
                            boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
                            textAlign: "center",
                        }}
                    >
                        <h3 style={{ color: "#1976d2", marginBottom: 16 }}>
                            ¿Estás seguro de guardar los siguientes cambios?
                        </h3>
                        <ul
                            style={{
                                textAlign: "left",
                                margin: "16px 0",
                                padding: 0,
                                listStyle: "none",
                                maxHeight: 180,
                                overflowY: "auto",
                            }}
                        >
                            {editInfo.name !== (supplier.name || "") && (
                                <li
                                    style={{
                                        marginBottom: 10,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 10,
                                    }}
                                >
                                    <span
                                        style={{
                                            color: "#1976d2",
                                            fontSize: 18,
                                        }}
                                    >
                                        ✏️
                                    </span>
                                    <span
                                        style={{
                                            fontWeight: 500,
                                            color: "#2c3e50",
                                        }}
                                    >
                                        Nombre:
                                    </span>
                                    <span
                                        style={{
                                            color: "#6c757d",
                                            textDecoration: "line-through",
                                            marginLeft: 4,
                                        }}
                                    >
                                        {supplier.name}
                                    </span>
                                    <span
                                        style={{
                                            color: "#388e3c",
                                            fontWeight: 700,
                                            marginLeft: 8,
                                        }}
                                    >
                                        → {editInfo.name}
                                    </span>
                                </li>
                            )}
                            {editInfo.phone !== (supplier.phone || "") && (
                                <li
                                    style={{
                                        marginBottom: 10,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 10,
                                    }}
                                >
                                    <span
                                        style={{
                                            color: "#1976d2",
                                            fontSize: 18,
                                        }}
                                    >
                                        ✏️
                                    </span>
                                    <span
                                        style={{
                                            fontWeight: 500,
                                            color: "#2c3e50",
                                        }}
                                    >
                                        Teléfono:
                                    </span>
                                    <span
                                        style={{
                                            color: "#6c757d",
                                            textDecoration: "line-through",
                                            marginLeft: 4,
                                        }}
                                    >
                                        {supplier.phone || "No especificado"}
                                    </span>
                                    <span
                                        style={{
                                            color: "#388e3c",
                                            fontWeight: 700,
                                            marginLeft: 8,
                                        }}
                                    >
                                        → {editInfo.phone}
                                    </span>
                                </li>
                            )}
                            {editInfo.email !== (supplier.email || "") && (
                                <li
                                    style={{
                                        marginBottom: 10,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 10,
                                    }}
                                >
                                    <span
                                        style={{
                                            color: "#1976d2",
                                            fontSize: 18,
                                        }}
                                    >
                                        ✏️
                                    </span>
                                    <span
                                        style={{
                                            fontWeight: 500,
                                            color: "#2c3e50",
                                        }}
                                    >
                                        Email:
                                    </span>
                                    <span
                                        style={{
                                            color: "#6c757d",
                                            textDecoration: "line-through",
                                            marginLeft: 4,
                                        }}
                                    >
                                        {supplier.email || "No especificado"}
                                    </span>
                                    <span
                                        style={{
                                            color: "#388e3c",
                                            fontWeight: 700,
                                            marginLeft: 8,
                                        }}
                                    >
                                        → {editInfo.email}
                                    </span>
                                </li>
                            )}
                            {editInfo.name === (supplier.name || "") &&
                                editInfo.phone === (supplier.phone || "") &&
                                editInfo.email === (supplier.email || "") && (
                                    <li
                                        style={{
                                            color: "#adb5bd",
                                            fontStyle: "italic",
                                        }}
                                    >
                                        No hay cambios
                                    </li>
                                )}
                        </ul>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "center",
                                gap: 16,
                                marginTop: 24,
                            }}
                        >
                            <button
                                onClick={() => setShowEditConfirm(false)}
                                style={{
                                    padding: "10px 20px",
                                    background: "#adb5bd",
                                    color: "white",
                                    border: "none",
                                    borderRadius: 8,
                                    fontWeight: 600,
                                    fontSize: 15,
                                    cursor: "pointer",
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                style={{
                                    padding: "10px 20px",
                                    background: "#1976d2",
                                    color: "white",
                                    border: "none",
                                    borderRadius: 8,
                                    fontWeight: 600,
                                    fontSize: 15,
                                    cursor: savingEdit
                                        ? "not-allowed"
                                        : "pointer",
                                    opacity: savingEdit ? 0.7 : 1,
                                }}
                                disabled={savingEdit}
                                onClick={async () => {
                                    setSavingEdit(true);
                                    setEditError(null);
                                    setEditSuccess(false);
                                    try {
                                        const body = {};
                                        if (
                                            editInfo.name !==
                                            (supplier.name || "")
                                        )
                                            body.name = editInfo.name;
                                        if (
                                            editInfo.phone !==
                                            (supplier.phone || "")
                                        )
                                            body.phone = editInfo.phone;
                                        if (
                                            editInfo.email !==
                                            (supplier.email || "")
                                        )
                                            body.email = editInfo.email;
                                        if (Object.keys(body).length === 0)
                                            throw new Error(
                                                "No hay cambios para guardar"
                                            );
                                        const response = await fetch(
                                            `https://unidental-backend.onrender.com/api/suppliers/suppliers/${supplier.id}/`,
                                            {
                                                method: "PATCH",
                                                headers: {
                                                    "Content-Type":
                                                        "application/json",
                                                    Authorization: `Token ${authToken}`,
                                                },
                                                body: JSON.stringify(body),
                                            }
                                        );
                                        if (!response.ok) {
                                            const data = await response
                                                .json()
                                                .catch(() => ({}));
                                            throw new Error(
                                                data.detail ||
                                                    "Error al guardar los cambios"
                                            );
                                        }
                                        const updated = await response.json();
                                        setSupplier((s) => ({
                                            ...s,
                                            ...updated,
                                        }));
                                        setShowEditConfirm(false);
                                        setIsEditInfo(false);
                                        setEditSuccess(true);
                                    } catch (err) {
                                        setEditError(err.message);
                                    } finally {
                                        setSavingEdit(false);
                                    }
                                }}
                            >
                                {savingEdit
                                    ? "Guardando..."
                                    : "Confirmar cambios"}
                            </button>
                        </div>
                        {editError && (
                            <div
                                style={{
                                    color: "#dc3545",
                                    marginTop: 12,
                                    fontWeight: 500,
                                }}
                            >
                                {editError}
                            </div>
                        )}
                        {editSuccess && (
                            <div
                                style={{
                                    color: "#388e3c",
                                    marginTop: 12,
                                    fontWeight: 500,
                                }}
                            >
                                ¡Cambios guardados correctamente!
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupplierDetailPage;
