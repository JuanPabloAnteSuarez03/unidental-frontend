import React, { useState, useEffect } from "react";
import { getSuppliers, getPurchaseOptions } from "../services/suppliersService";
import { useAuth } from "../context/AuthContext";
import { getLocations } from "../services/inventoryService";

const OrdenesDeCompraPage = () => {
    const { authToken } = useAuth();
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [suppliers, setSuppliers] = useState([]);
    const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(false);
    const [orderItems, setOrderItems] = useState([]); // [{product, quantity}]
    const [locations, setLocations] = useState([]);
    const [isLoadingLocations, setIsLoadingLocations] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState("");

    const [notes, setNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [submitSuccess, setSubmitSuccess] = useState("");
    const [activeSection, setActiveSection] = useState("registro"); // 'registro' o 'otra'
    // Estado para la tabla de órdenes
    const [orders, setOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [ordersError, setOrdersError] = useState("");
    const [ordersPage, setOrdersPage] = useState(1);
    const [ordersTotalPages, setOrdersTotalPages] = useState(1);
    const [ordersCount, setOrdersCount] = useState(0);
    const ORDERS_PAGE_SIZE = 10;
    // Estado para el panel de detalle de orden
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showOrderDetail, setShowOrderDetail] = useState(false);
    const [orderDetailLoading, setOrderDetailLoading] = useState(false);
    const [orderDetailError, setOrderDetailError] = useState("");

    // Cargar proveedores
    useEffect(() => {
        setIsLoadingSuppliers(true);
        getSuppliers({ page_size: 100 }, authToken)
            .then((data) => setSuppliers(data.results || []))
            .catch(() => setSuppliers([]))
            .finally(() => setIsLoadingSuppliers(false));
    }, [authToken]);

    // Cargar productos del proveedor
    useEffect(() => {
        if (!selectedSupplier) {
            setProducts([]);
            setOrderItems([]);
            return;
        }
        setIsLoading(true);
        getPurchaseOptions({ supplier: selectedSupplier.id }, authToken)
            .then((data) =>
                setProducts(
                    (data.results || []).map((opt) => ({
                        ...opt,
                        purchase_option: opt.id,
                    }))
                )
            )
            .catch(() => setProducts([]))
            .finally(() => setIsLoading(false));
        setOrderItems([]); // Limpiar orden al cambiar proveedor
    }, [selectedSupplier, authToken]);

    // Cargar sedes (locations)
    useEffect(() => {
        if (!authToken) return;
        setIsLoadingLocations(true);
        getLocations(authToken)
            .then((data) => {
                // Filtrar solo sedes (type: "sede") si aplica
                const sedes = Array.isArray(data)
                    ? data.filter((loc) => loc.type === "sede")
                    : [];
                setLocations(sedes);
            })
            .catch(() => setLocations([]))
            .finally(() => setIsLoadingLocations(false));
    }, [authToken]);

    // Cargar órdenes de compra cuando se entra a la sección 'otra' o cambia la página
    useEffect(() => {
        if (activeSection !== "otra") return;
        setOrdersLoading(true);
        setOrdersError("");
        fetch(
            `https://unidental-backend.onrender.com/api/purchases/orders/?page=${ordersPage}&page_size=${ORDERS_PAGE_SIZE}`,
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Token ${authToken}`,
                },
            }
        )
            .then(async (res) => {
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.detail || `Error ${res.status}`);
                }
                return res.json();
            })
            .then((data) => {
                setOrders(data.results || []);
                setOrdersCount(data.count || 0);
                setOrdersTotalPages(
                    data.count ? Math.ceil(data.count / ORDERS_PAGE_SIZE) : 1
                );
            })
            .catch((err) =>
                setOrdersError(err.message || "Error al cargar órdenes")
            )
            .finally(() => setOrdersLoading(false));
    }, [activeSection, ordersPage, authToken]);

    // Agregar producto a la orden
    const handleAddProduct = (product) => {
        setOrderItems((prev) => {
            if (prev.some((item) => item.product.id === product.id))
                return prev;
            return [...prev, { product, quantity: 1 }];
        });
    };

    // Quitar producto de la orden
    const handleRemoveProduct = (productId) => {
        setOrderItems((prev) =>
            prev.filter((item) => item.product.id !== productId)
        );
    };

    // Cambiar cantidad
    const handleChangeQuantity = (productId, value) => {
        setOrderItems((prev) =>
            prev.map((item) =>
                item.product.id === productId
                    ? { ...item, quantity: Math.max(1, parseInt(value) || 1) }
                    : item
            )
        );
    };

    // Calcular total
    const total = orderItems.reduce(
        (sum, item) =>
            sum + parseFloat(item.product.purchase_price || 0) * item.quantity,
        0
    );

    const handleCreateOrder = async () => {
        setSubmitError("");
        setSubmitSuccess("");
        if (!selectedSupplier || !selectedLocation || orderItems.length === 0) {
            setSubmitError("Debe seleccionar proveedor, sede y productos.");
            return;
        }
        // Validar que todos los productos tengan purchase_option
        const missingOption = orderItems.find(
            (item) => !item.product.purchase_option
        );
        if (missingOption) {
            setSubmitError(
                `El producto '${
                    missingOption.product.product_name ||
                    missingOption.product.name
                }' no tiene purchase_option.`
            );
            return;
        }
        setIsSubmitting(true);
        try {
            // Generar fecha y hora actual en formato ISO
            const currentDate = new Date().toISOString().split("T")[0];

            const payload = {
                supplier: selectedSupplier.id,
                destination: selectedLocation,
                order_date: currentDate,
                notes,
                items: orderItems.map((item) => ({
                    purchase_option: item.product.purchase_option,
                    quantity_requested: item.quantity,
                    unit_price: item.product.purchase_price || 0,
                })),
            };
            const response = await fetch(
                "https://unidental-backend.onrender.com/api/purchases/orders/",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Token ${authToken}`,
                    },
                    body: JSON.stringify(payload),
                }
            );
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    errorData.detail ||
                        `Error ${response.status}: ${response.statusText}`
                );
            }
            setSubmitSuccess("Orden de compra registrada exitosamente.");
            setOrderItems([]);
            setNotes("");
        } catch (error) {
            setSubmitError(error.message || "Error al registrar la orden.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Utilidad para traducir estados si no viene status_display
    const translateStatus = (status) => {
        if (!status) return "-";
        const map = {
            pending: "Pendiente",
            approved: "Aprobada",
            completed: "Completada",
            cancelled: "Cancelada",
            rejected: "Rechazada",
            in_progress: "En progreso",
            draft: "Borrador",
        };
        return map[status] || status;
    };

    return (
        <>
            <style>
                {`
                    @keyframes fadeIn {
                        from { opacity: 0; transform: scale(0.8); }
                        to { opacity: 1; transform: scale(1); }
                    }
                    
                    @keyframes slideIn {
                        from { transform: translateX(-10px); opacity: 0; }
                        to { transform: translateX(0); opacity: 1; }
                    }
                `}
            </style>
            {/* Header Banner */}
            <div
                style={{
                    background:
                        "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)",
                    borderRadius: "12px",
                    padding: "32px",
                    marginBottom: "32px",
                    boxShadow: "0 4px 16px rgba(44,62,80,0.15)",
                    border: "1px solid #2c3e50",
                    color: "white",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                    }}
                >
                    <div
                        style={{
                            width: "56px",
                            height: "56px",
                            backgroundColor: "rgba(255,255,255,0.2)",
                            borderRadius: "12px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backdropFilter: "blur(10px)",
                        }}
                    >
                        <svg
                            width="28"
                            height="28"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            style={{ color: "white" }}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                            />
                        </svg>
                    </div>
                    <div>
                        <h1
                            style={{
                                fontSize: "32px",
                                fontWeight: "800",
                                color: "white",
                                margin: "0",
                                letterSpacing: "-0.5px",
                            }}
                        >
                            Órdenes de Compra
                        </h1>
                        <p
                            style={{
                                color: "rgba(255,255,255,0.8)",
                                margin: "8px 0 0 0",
                                fontSize: "16px",
                                fontWeight: "500",
                            }}
                        >
                            Gestiona las órdenes de compra de tu empresa
                        </p>
                    </div>
                </div>
            </div>

            {/* Barra de navegación de secciones */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "16px",
                    marginBottom: "32px",
                }}
            >
                <button
                    onClick={() => setActiveSection("registro")}
                    style={{
                        padding: "12px 32px",
                        borderRadius: "8px",
                        border:
                            activeSection === "registro"
                                ? "2px solid #2c3e50"
                                : "2px solid #e3eaf3",
                        background:
                            activeSection === "registro" ? "#2c3e50" : "#fff",
                        color:
                            activeSection === "registro" ? "#fff" : "#2c3e50",
                        fontWeight: 700,
                        fontSize: "16px",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        boxShadow:
                            activeSection === "registro"
                                ? "0 2px 8px rgba(44,62,80,0.15)"
                                : "none",
                    }}
                >
                    Registrar Orden de Compra
                </button>
                <button
                    onClick={() => setActiveSection("otra")}
                    style={{
                        padding: "12px 32px",
                        borderRadius: "8px",
                        border:
                            activeSection === "otra"
                                ? "2px solid #2c3e50"
                                : "2px solid #e3eaf3",
                        background:
                            activeSection === "otra" ? "#2c3e50" : "#fff",
                        color: activeSection === "otra" ? "#fff" : "#2c3e50",
                        fontWeight: 700,
                        fontSize: "16px",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        boxShadow:
                            activeSection === "otra"
                                ? "0 2px 8px rgba(44,62,80,0.15)"
                                : "none",
                    }}
                >
                    Órdenes de Compra Registradas
                </button>
            </div>
            {/* Contenido de la sección activa */}
            {activeSection === "registro" && (
                <div
                    style={{
                        maxWidth: 1400,
                        margin: "0 auto",
                        padding: 24,
                        minHeight: "100vh",
                    }}
                >
                    <h1
                        style={{
                            fontSize: 28,
                            fontWeight: 800,
                            marginBottom: 40,
                            textAlign: "center",
                            color: "#2c3e50",
                            letterSpacing: "-1px",
                        }}
                    >
                        Registrar Orden de Compra
                    </h1>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 400px",
                            gap: 40,
                            alignItems: "flex-start",
                            minHeight: "calc(100vh - 200px)",
                        }}
                    >
                        {/* Columna izquierda: selector y tabla */}
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 24,
                            }}
                        >
                            {/* Selector de proveedor */}
                            <div
                                style={{
                                    background: "#fff",
                                    borderRadius: "8px",
                                    padding: "20px",
                                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                                    border: "1px solid #dee2e6",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        marginBottom: "16px",
                                        padding: "12px 16px",
                                        background:
                                            "linear-gradient(135deg, #3498db 0%, #2c3e50 100%)",
                                        borderRadius: "8px",
                                        color: "white",
                                    }}
                                >
                                    <span style={{ fontSize: "18px" }}>🏢</span>
                                    <h3
                                        style={{
                                            fontSize: "16px",
                                            fontWeight: "700",
                                            margin: 0,
                                            color: "white",
                                        }}
                                    >
                                        Seleccionar Proveedor
                                    </h3>
                                </div>

                                <div style={{ position: "relative" }}>
                                    <select
                                        id="proveedor-select"
                                        value={
                                            selectedSupplier
                                                ? selectedSupplier.id
                                                : ""
                                        }
                                        onChange={(e) => {
                                            const id = e.target.value;
                                            const supplier = suppliers.find(
                                                (s) => String(s.id) === id
                                            );
                                            setSelectedSupplier(
                                                supplier || null
                                            );
                                        }}
                                        style={{
                                            width: "100%",
                                            padding: "12px 16px",
                                            borderRadius: "6px",
                                            border: "2px solid #e3eaf3",
                                            fontSize: "14px",
                                            fontWeight: "500",
                                            color: "#2c3e50",
                                            background: "#f8f9fa",
                                            outline: "none",
                                            transition: "all 0.2s ease",
                                            appearance: "none",
                                            cursor: "pointer",
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor =
                                                "#3498db";
                                            e.target.style.backgroundColor =
                                                "white";
                                            e.target.style.boxShadow =
                                                "0 0 0 3px rgba(52, 152, 219, 0.1)";
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor =
                                                "#e3eaf3";
                                            e.target.style.backgroundColor =
                                                "#f8f9fa";
                                            e.target.style.boxShadow = "none";
                                        }}
                                        disabled={isLoadingSuppliers}
                                    >
                                        <option value="">
                                            Selecciona un proveedor...
                                        </option>
                                        {suppliers.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {s.name}
                                            </option>
                                        ))}
                                    </select>
                                    <span
                                        style={{
                                            position: "absolute",
                                            right: "16px",
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                            pointerEvents: "none",
                                            color: "#6c757d",
                                            fontSize: "14px",
                                            fontWeight: "600",
                                        }}
                                    >
                                        ▼
                                    </span>
                                </div>

                                {isLoadingSuppliers && (
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                            color: "#6c757d",
                                            fontSize: "14px",
                                            marginTop: "12px",
                                            padding: "8px 12px",
                                            backgroundColor: "#f8f9fa",
                                            borderRadius: "6px",
                                            border: "1px solid #e9ecef",
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: "16px",
                                                height: "16px",
                                                border: "2px solid #e9ecef",
                                                borderTop: "2px solid #3498db",
                                                borderRadius: "50%",
                                                animation:
                                                    "spin 1s linear infinite",
                                            }}
                                        ></div>
                                        Cargando proveedores...
                                    </div>
                                )}
                            </div>
                            {/* Tabla de productos */}
                            <div
                                style={{
                                    background: "#fff",
                                    borderRadius: 12,
                                    boxShadow:
                                        "0 4px 16px rgba(52,152,219,0.07)",
                                    padding: 28,
                                    border: "1.5px solid #e3eaf3",
                                    flex: 1,
                                }}
                            >
                                <h2
                                    style={{
                                        fontSize: 22,
                                        fontWeight: 700,
                                        marginBottom: 24,
                                        textAlign: "left",
                                        color: "#2c3e50",
                                        letterSpacing: "-0.5px",
                                    }}
                                >
                                    Productos del Proveedor
                                </h2>
                                {!selectedSupplier ? (
                                    <div
                                        style={{
                                            color: "#888",
                                            fontSize: 16,
                                            textAlign: "center",
                                            padding: "60px 20px",
                                        }}
                                    >
                                        Selecciona un proveedor para ver sus
                                        productos
                                    </div>
                                ) : isLoading ? (
                                    <div
                                        style={{
                                            color: "#888",
                                            fontSize: 16,
                                            textAlign: "center",
                                            padding: "60px 20px",
                                        }}
                                    >
                                        Cargando productos...
                                    </div>
                                ) : products.length === 0 ? (
                                    <div
                                        style={{
                                            color: "#888",
                                            fontSize: 16,
                                            textAlign: "center",
                                            padding: "60px 20px",
                                        }}
                                    >
                                        No hay productos para este proveedor.
                                    </div>
                                ) : (
                                    <div
                                        style={{
                                            borderRadius: 12,
                                            overflow: "hidden",
                                            border: "1px solid #e9ecef",
                                            boxShadow:
                                                "0 2px 8px rgba(0,0,0,0.06)",
                                        }}
                                    >
                                        <table
                                            style={{
                                                width: "100%",
                                                borderCollapse: "collapse",
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
                                                            padding:
                                                                "16px 12px",
                                                            textAlign: "left",
                                                            fontWeight: "600",
                                                            fontSize: "14px",
                                                            letterSpacing:
                                                                "0.5px",
                                                            textTransform:
                                                                "uppercase",
                                                        }}
                                                    >
                                                        📦 Nombre
                                                    </th>
                                                    <th
                                                        style={{
                                                            padding:
                                                                "16px 12px",
                                                            textAlign: "left",
                                                            fontWeight: "600",
                                                            fontSize: "14px",
                                                            letterSpacing:
                                                                "0.5px",
                                                            textTransform:
                                                                "uppercase",
                                                        }}
                                                    >
                                                        💰 Precio
                                                    </th>
                                                    <th
                                                        style={{
                                                            padding:
                                                                "16px 12px",
                                                            textAlign: "left",
                                                            fontWeight: "600",
                                                            fontSize: "14px",
                                                            letterSpacing:
                                                                "0.5px",
                                                            textTransform:
                                                                "uppercase",
                                                        }}
                                                    >
                                                        🏷️ Categoría
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {products.map((item, index) => {
                                                    const added =
                                                        orderItems.some(
                                                            (oi) =>
                                                                oi.product
                                                                    .id ===
                                                                item.id
                                                        );
                                                    return (
                                                        <tr
                                                            key={item.id}
                                                            onClick={() =>
                                                                !added &&
                                                                handleAddProduct(
                                                                    item
                                                                )
                                                            }
                                                            style={{
                                                                backgroundColor:
                                                                    added
                                                                        ? "linear-gradient(135deg, #e8f4fd 0%, #d1ecf1 100%)"
                                                                        : index %
                                                                              2 ===
                                                                          0
                                                                        ? "#fff"
                                                                        : "#f8f9fa",
                                                                cursor: added
                                                                    ? "not-allowed"
                                                                    : "pointer",
                                                                opacity: added
                                                                    ? 1
                                                                    : 1,
                                                                transition:
                                                                    "all 0.3s ease",
                                                                position:
                                                                    "relative",
                                                                borderLeft:
                                                                    added
                                                                        ? "4px solid #3498db"
                                                                        : "none",
                                                                boxShadow: added
                                                                    ? "0 4px 12px rgba(52, 152, 219, 0.15)"
                                                                    : "none",
                                                            }}
                                                            onMouseEnter={(
                                                                e
                                                            ) => {
                                                                if (!added) {
                                                                    e.currentTarget.style.background =
                                                                        "#f0f7ff";
                                                                    e.currentTarget.style.transform =
                                                                        "translateX(2px)";
                                                                }
                                                            }}
                                                            onMouseLeave={(
                                                                e
                                                            ) => {
                                                                if (!added) {
                                                                    e.currentTarget.style.background =
                                                                        index %
                                                                            2 ===
                                                                        0
                                                                            ? "#fff"
                                                                            : "#f8f9fa";
                                                                    e.currentTarget.style.transform =
                                                                        "translateX(0)";
                                                                }
                                                            }}
                                                        >
                                                            <td
                                                                style={{
                                                                    padding:
                                                                        "16px 12px",
                                                                    borderBottom:
                                                                        "1px solid #e9ecef",
                                                                    fontSize:
                                                                        "14px",
                                                                    fontWeight:
                                                                        "600",
                                                                    color: "#2c3e50",
                                                                    position:
                                                                        "relative",
                                                                }}
                                                            >
                                                                <div
                                                                    style={{
                                                                        display:
                                                                            "flex",
                                                                        alignItems:
                                                                            "center",
                                                                        gap: "8px",
                                                                    }}
                                                                >
                                                                    {added && (
                                                                        <span
                                                                            style={{
                                                                                fontSize:
                                                                                    "16px",
                                                                                color: "#27ae60",
                                                                                fontWeight:
                                                                                    "700",
                                                                                animation:
                                                                                    "fadeIn 0.3s ease",
                                                                            }}
                                                                        >
                                                                            ✅
                                                                        </span>
                                                                    )}
                                                                    <span
                                                                        style={{
                                                                            flex: 1,
                                                                        }}
                                                                    >
                                                                        {item.product_name ||
                                                                            item.name}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td
                                                                style={{
                                                                    padding:
                                                                        "16px 12px",
                                                                    borderBottom:
                                                                        "1px solid #e9ecef",
                                                                    fontSize:
                                                                        "16px",
                                                                    fontWeight:
                                                                        "700",
                                                                    color: added
                                                                        ? "#2ecc71"
                                                                        : "#27ae60",
                                                                    textShadow:
                                                                        added
                                                                            ? "0 1px 2px rgba(46, 204, 113, 0.2)"
                                                                            : "none",
                                                                }}
                                                            >
                                                                {item.purchase_price
                                                                    ? `$${item.purchase_price}`
                                                                    : "-"}
                                                            </td>
                                                            <td
                                                                style={{
                                                                    padding:
                                                                        "16px 12px",
                                                                    borderBottom:
                                                                        "1px solid #e9ecef",
                                                                    fontSize:
                                                                        "14px",
                                                                    fontWeight:
                                                                        "500",
                                                                    color: "#6c757d",
                                                                }}
                                                            >
                                                                {item.category_name ||
                                                                    "-"}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* Columna derecha: resumen de la orden */}
                        <div style={{ position: "sticky", top: 24 }}>
                            <div
                                style={{
                                    backgroundColor: "white",
                                    borderRadius: "8px",
                                    padding: "20px",
                                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                                    border: "1px solid #dee2e6",
                                    position: "sticky",
                                    top: "20px",
                                    minHeight: "calc(100vh - 200px)",
                                    display: "flex",
                                    flexDirection: "column",
                                }}
                            >
                                <h3
                                    style={{
                                        color: "#2c3e50",
                                        fontSize: "18px",
                                        fontWeight: "600",
                                        margin: "0 0 20px 0",
                                        textAlign: "center",
                                    }}
                                >
                                    Resumen de la Orden de Compra
                                </h3>
                                {/* Campo para seleccionar sede de destino */}
                                <div style={{ marginBottom: "20px" }}>
                                    <label
                                        htmlFor="sede-destino-select"
                                        style={{
                                            fontSize: "14px",
                                            fontWeight: "600",
                                            color: "#2c3e50",
                                            marginBottom: "8px",
                                            display: "block",
                                        }}
                                    >
                                        📍 Sede de destino de la orden
                                    </label>
                                    <select
                                        id="sede-destino-select"
                                        value={selectedLocation}
                                        onChange={(e) =>
                                            setSelectedLocation(e.target.value)
                                        }
                                        disabled={isLoadingLocations}
                                        style={{
                                            width: "100%",
                                            padding: "12px 14px",
                                            borderRadius: "8px",
                                            border: "2px solid #e9ecef",
                                            fontSize: "14px",
                                            backgroundColor: isLoadingLocations
                                                ? "#f8f9fa"
                                                : "#fff",
                                            transition:
                                                "border-color 0.2s ease",
                                            opacity: isLoadingLocations
                                                ? 0.7
                                                : 1,
                                            boxSizing: "border-box",
                                            marginBottom: "8px",
                                        }}
                                        required
                                    >
                                        <option value="">
                                            {isLoadingLocations
                                                ? "Cargando sedes..."
                                                : "Seleccionar sede de destino"}
                                        </option>
                                        {locations.map((loc) => (
                                            <option key={loc.id} value={loc.id}>
                                                {loc.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* NUEVO: campo para notas */}
                                <div style={{ marginBottom: "16px" }}>
                                    <label
                                        htmlFor="order-notes"
                                        style={{
                                            fontSize: "14px",
                                            fontWeight: "600",
                                            color: "#2c3e50",
                                            marginBottom: "8px",
                                            display: "block",
                                        }}
                                    >
                                        📝 Notas de la orden
                                    </label>
                                    <textarea
                                        id="order-notes"
                                        value={notes}
                                        onChange={(e) =>
                                            setNotes(e.target.value)
                                        }
                                        rows={2}
                                        style={{
                                            width: "100%",
                                            maxWidth: "100%",
                                            padding: "10px 14px",
                                            borderRadius: "8px",
                                            border: "2px solid #e9ecef",
                                            fontSize: "14px",
                                            backgroundColor: "#fff",
                                            resize: "vertical",
                                            boxSizing: "border-box",
                                            wordWrap: "break-word",
                                            overflowWrap: "break-word",
                                        }}
                                        placeholder="Notas adicionales para la orden (opcional)"
                                    />
                                </div>
                                {/* Feedback de error o éxito */}
                                {submitError && (
                                    <div
                                        style={{
                                            color: "#c0392b",
                                            marginBottom: 12,
                                            fontWeight: 600,
                                        }}
                                    >
                                        {submitError}
                                    </div>
                                )}
                                {submitSuccess && (
                                    <div
                                        style={{
                                            color: "#27ae60",
                                            marginBottom: 12,
                                            fontWeight: 600,
                                        }}
                                    >
                                        {submitSuccess}
                                    </div>
                                )}
                                {/* Order Details */}
                                <div style={{ marginBottom: "20px" }}>
                                    {/* Items Count */}
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            padding: "8px 0",
                                            borderBottom: "1px solid #f8f9fa",
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: "14px",
                                                color: "#6c757d",
                                            }}
                                        >
                                            Productos:
                                        </span>
                                        <span
                                            style={{
                                                fontSize: "14px",
                                                fontWeight: "600",
                                                color: "#2c3e50",
                                            }}
                                        >
                                            {orderItems.length}{" "}
                                            {orderItems.length === 1
                                                ? "producto"
                                                : "productos"}
                                        </span>
                                    </div>

                                    {/* Total Quantity */}
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            padding: "8px 0",
                                            borderBottom: "1px solid #f8f9fa",
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: "14px",
                                                color: "#6c757d",
                                            }}
                                        >
                                            Cantidad total:
                                        </span>
                                        <span
                                            style={{
                                                fontSize: "14px",
                                                fontWeight: "600",
                                                color: "#2c3e50",
                                            }}
                                        >
                                            {orderItems.reduce(
                                                (sum, item) =>
                                                    sum + item.quantity,
                                                0
                                            )}{" "}
                                            {orderItems.reduce(
                                                (sum, item) =>
                                                    sum + item.quantity,
                                                0
                                            ) === 1
                                                ? "unidad"
                                                : "unidades"}
                                        </span>
                                    </div>

                                    {/* Supplier */}
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            padding: "8px 0",
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: "14px",
                                                color: "#6c757d",
                                            }}
                                        >
                                            Proveedor:
                                        </span>
                                        <span
                                            style={{
                                                fontSize: "14px",
                                                fontWeight: "600",
                                                color: "#2c3e50",
                                            }}
                                        >
                                            {selectedSupplier
                                                ? `🏢 ${selectedSupplier.name}`
                                                : "❌ No seleccionado"}
                                        </span>
                                    </div>
                                </div>

                                {/* Products List */}
                                {orderItems.length > 0 && (
                                    <div style={{ marginBottom: "20px" }}>
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "8px",
                                                marginBottom: "16px",
                                                padding: "12px 16px",
                                                backgroundColor:
                                                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                                background:
                                                    "linear-gradient(135deg, #3498db 0%, #2c3e50 100%)",
                                                borderRadius: "8px",
                                                color: "white",
                                            }}
                                        >
                                            <span style={{ fontSize: "18px" }}>
                                                📦
                                            </span>
                                            <h4
                                                style={{
                                                    fontSize: "16px",
                                                    fontWeight: "700",
                                                    margin: 0,
                                                    color: "white",
                                                }}
                                            >
                                                Productos en la orden (
                                                {orderItems.length})
                                            </h4>
                                        </div>
                                        <div
                                            style={{
                                                maxHeight: "350px",
                                                overflowY: "auto",
                                                padding: "4px",
                                            }}
                                        >
                                            {orderItems.map(
                                                (
                                                    { product, quantity },
                                                    index
                                                ) => (
                                                    <div
                                                        key={product.id}
                                                        style={{
                                                            padding: "16px",
                                                            border: "1px solid #e3eaf3",
                                                            borderRadius:
                                                                "12px",
                                                            marginBottom:
                                                                "12px",
                                                            backgroundColor:
                                                                "white",
                                                            boxShadow:
                                                                "0 2px 8px rgba(0,0,0,0.06)",
                                                            transition:
                                                                "all 0.2s ease",
                                                            position:
                                                                "relative",
                                                            overflow: "hidden",
                                                        }}
                                                    >
                                                        {/* Product Header */}
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                justifyContent:
                                                                    "space-between",
                                                                alignItems:
                                                                    "flex-start",
                                                                marginBottom:
                                                                    "12px",
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    flex: 1,
                                                                }}
                                                            >
                                                                <div
                                                                    style={{
                                                                        fontSize:
                                                                            "15px",
                                                                        fontWeight:
                                                                            "700",
                                                                        color: "#2c3e50",
                                                                        marginBottom:
                                                                            "4px",
                                                                        lineHeight:
                                                                            "1.3",
                                                                    }}
                                                                >
                                                                    {product.product_name ||
                                                                        product.name}
                                                                </div>
                                                                {product.category_name && (
                                                                    <div
                                                                        style={{
                                                                            fontSize:
                                                                                "12px",
                                                                            color: "#6c757d",
                                                                            backgroundColor:
                                                                                "#f8f9fa",
                                                                            padding:
                                                                                "4px 8px",
                                                                            borderRadius:
                                                                                "12px",
                                                                            display:
                                                                                "inline-block",
                                                                            border: "1px solid #e9ecef",
                                                                        }}
                                                                    >
                                                                        🏷️{" "}
                                                                        {
                                                                            product.category_name
                                                                        }
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <button
                                                                onClick={() =>
                                                                    handleRemoveProduct(
                                                                        product.id
                                                                    )
                                                                }
                                                                style={{
                                                                    background:
                                                                        "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)",
                                                                    border: "none",
                                                                    color: "white",
                                                                    cursor: "pointer",
                                                                    fontSize:
                                                                        "14px",
                                                                    fontWeight:
                                                                        "700",
                                                                    padding:
                                                                        "6px 10px",
                                                                    borderRadius:
                                                                        "20px",
                                                                    minWidth:
                                                                        "32px",
                                                                    height: "32px",
                                                                    display:
                                                                        "flex",
                                                                    alignItems:
                                                                        "center",
                                                                    justifyContent:
                                                                        "center",
                                                                    transition:
                                                                        "all 0.2s ease",
                                                                    boxShadow:
                                                                        "0 2px 4px rgba(231, 76, 60, 0.3)",
                                                                }}
                                                                onMouseEnter={(
                                                                    e
                                                                ) => {
                                                                    e.target.style.transform =
                                                                        "scale(1.1)";
                                                                    e.target.style.boxShadow =
                                                                        "0 4px 8px rgba(231, 76, 60, 0.4)";
                                                                }}
                                                                onMouseLeave={(
                                                                    e
                                                                ) => {
                                                                    e.target.style.transform =
                                                                        "scale(1)";
                                                                    e.target.style.boxShadow =
                                                                        "0 2px 4px rgba(231, 76, 60, 0.3)";
                                                                }}
                                                                title="Quitar producto"
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>

                                                        {/* Product Details */}
                                                        <div
                                                            style={{
                                                                display: "grid",
                                                                gridTemplateColumns:
                                                                    "1fr auto",
                                                                gap: "16px",
                                                                alignItems:
                                                                    "center",
                                                            }}
                                                        >
                                                            {/* Quantity Section */}
                                                            <div
                                                                style={{
                                                                    display:
                                                                        "flex",
                                                                    alignItems:
                                                                        "center",
                                                                    gap: "12px",
                                                                }}
                                                            >
                                                                <div
                                                                    style={{
                                                                        display:
                                                                            "flex",
                                                                        flexDirection:
                                                                            "column",
                                                                        gap: "4px",
                                                                    }}
                                                                >
                                                                    <label
                                                                        style={{
                                                                            fontSize:
                                                                                "12px",
                                                                            fontWeight:
                                                                                "600",
                                                                            color: "#495057",
                                                                            textTransform:
                                                                                "uppercase",
                                                                            letterSpacing:
                                                                                "0.5px",
                                                                        }}
                                                                    >
                                                                        Cantidad
                                                                    </label>
                                                                    <div
                                                                        style={{
                                                                            display:
                                                                                "flex",
                                                                            alignItems:
                                                                                "center",
                                                                            gap: "8px",
                                                                        }}
                                                                    >
                                                                        <button
                                                                            onClick={() =>
                                                                                handleChangeQuantity(
                                                                                    product.id,
                                                                                    Math.max(
                                                                                        1,
                                                                                        quantity -
                                                                                            1
                                                                                    )
                                                                                )
                                                                            }
                                                                            style={{
                                                                                background:
                                                                                    "linear-gradient(135deg, #6c757d 0%, #495057 100%)",
                                                                                border: "none",
                                                                                color: "white",
                                                                                cursor: "pointer",
                                                                                fontSize:
                                                                                    "16px",
                                                                                fontWeight:
                                                                                    "700",
                                                                                width: "28px",
                                                                                height: "28px",
                                                                                borderRadius:
                                                                                    "6px",
                                                                                display:
                                                                                    "flex",
                                                                                alignItems:
                                                                                    "center",
                                                                                justifyContent:
                                                                                    "center",
                                                                                transition:
                                                                                    "all 0.2s ease",
                                                                            }}
                                                                            onMouseEnter={(
                                                                                e
                                                                            ) => {
                                                                                e.target.style.transform =
                                                                                    "scale(1.1)";
                                                                            }}
                                                                            onMouseLeave={(
                                                                                e
                                                                            ) => {
                                                                                e.target.style.transform =
                                                                                    "scale(1)";
                                                                            }}
                                                                        >
                                                                            -
                                                                        </button>
                                                                        <input
                                                                            type="number"
                                                                            min={
                                                                                1
                                                                            }
                                                                            value={
                                                                                quantity
                                                                            }
                                                                            onChange={(
                                                                                e
                                                                            ) =>
                                                                                handleChangeQuantity(
                                                                                    product.id,
                                                                                    e
                                                                                        .target
                                                                                        .value
                                                                                )
                                                                            }
                                                                            style={{
                                                                                width: "60px",
                                                                                padding:
                                                                                    "8px 12px",
                                                                                borderRadius:
                                                                                    "8px",
                                                                                border: "2px solid #e3eaf3",
                                                                                fontSize:
                                                                                    "14px",
                                                                                fontWeight:
                                                                                    "600",
                                                                                textAlign:
                                                                                    "center",
                                                                                backgroundColor:
                                                                                    "#f8f9fa",
                                                                                color: "#2c3e50",
                                                                                transition:
                                                                                    "all 0.2s ease",
                                                                            }}
                                                                            onFocus={(
                                                                                e
                                                                            ) => {
                                                                                e.target.style.borderColor =
                                                                                    "#3498db";
                                                                                e.target.style.backgroundColor =
                                                                                    "white";
                                                                                e.target.style.boxShadow =
                                                                                    "0 0 0 3px rgba(52, 152, 219, 0.1)";
                                                                            }}
                                                                            onBlur={(
                                                                                e
                                                                            ) => {
                                                                                e.target.style.borderColor =
                                                                                    "#e3eaf3";
                                                                                e.target.style.backgroundColor =
                                                                                    "#f8f9fa";
                                                                                e.target.style.boxShadow =
                                                                                    "none";
                                                                            }}
                                                                        />
                                                                        <button
                                                                            onClick={() =>
                                                                                handleChangeQuantity(
                                                                                    product.id,
                                                                                    quantity +
                                                                                        1
                                                                                )
                                                                            }
                                                                            style={{
                                                                                background:
                                                                                    "linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)",
                                                                                border: "none",
                                                                                color: "white",
                                                                                cursor: "pointer",
                                                                                fontSize:
                                                                                    "16px",
                                                                                fontWeight:
                                                                                    "700",
                                                                                width: "28px",
                                                                                height: "28px",
                                                                                borderRadius:
                                                                                    "6px",
                                                                                display:
                                                                                    "flex",
                                                                                alignItems:
                                                                                    "center",
                                                                                justifyContent:
                                                                                    "center",
                                                                                transition:
                                                                                    "all 0.2s ease",
                                                                            }}
                                                                            onMouseEnter={(
                                                                                e
                                                                            ) => {
                                                                                e.target.style.transform =
                                                                                    "scale(1.1)";
                                                                            }}
                                                                            onMouseLeave={(
                                                                                e
                                                                            ) => {
                                                                                e.target.style.transform =
                                                                                    "scale(1)";
                                                                            }}
                                                                        >
                                                                            +
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Price Section */}
                                                            <div
                                                                style={{
                                                                    display:
                                                                        "flex",
                                                                    flexDirection:
                                                                        "column",
                                                                    alignItems:
                                                                        "flex-end",
                                                                    gap: "4px",
                                                                }}
                                                            >
                                                                <div
                                                                    style={{
                                                                        fontSize:
                                                                            "12px",
                                                                        color: "#6c757d",
                                                                        fontWeight:
                                                                            "500",
                                                                    }}
                                                                >
                                                                    Precio
                                                                    unitario
                                                                </div>
                                                                <div
                                                                    style={{
                                                                        fontSize:
                                                                            "14px",
                                                                        fontWeight:
                                                                            "600",
                                                                        color: "#495057",
                                                                    }}
                                                                >
                                                                    $
                                                                    {product.purchase_price
                                                                        ? parseFloat(
                                                                              product.purchase_price
                                                                          ).toFixed(
                                                                              2
                                                                          )
                                                                        : "0.00"}
                                                                </div>
                                                                <div
                                                                    style={{
                                                                        fontSize:
                                                                            "18px",
                                                                        fontWeight:
                                                                            "700",
                                                                        color: "#27ae60",
                                                                        padding:
                                                                            "8px 12px",
                                                                        backgroundColor:
                                                                            "#d5edda",
                                                                        borderRadius:
                                                                            "8px",
                                                                        border: "2px solid #c3e6cb",
                                                                    }}
                                                                >
                                                                    $
                                                                    {product.purchase_price
                                                                        ? (
                                                                              parseFloat(
                                                                                  product.purchase_price
                                                                              ) *
                                                                              quantity
                                                                          ).toFixed(
                                                                              2
                                                                          )
                                                                        : "0.00"}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Price Breakdown */}
                                <div
                                    style={{
                                        borderTop: "2px solid #2c3e50",
                                        paddingTop: "15px",
                                        marginBottom: "20px",
                                    }}
                                >
                                    {/* Subtotal */}
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            padding: "8px 0",
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: "14px",
                                                color: "#6c757d",
                                            }}
                                        >
                                            Subtotal:
                                        </span>
                                        <span
                                            style={{
                                                fontSize: "14px",
                                                fontWeight: "600",
                                                color: "#2c3e50",
                                            }}
                                        >
                                            ${total.toFixed(2)}
                                        </span>
                                    </div>

                                    {/* Total */}
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            padding: "12px 0",
                                            borderTop: "1px solid #dee2e6",
                                            marginTop: "8px",
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: "16px",
                                                fontWeight: "600",
                                                color: "#2c3e50",
                                            }}
                                        >
                                            Total:
                                        </span>
                                        <span
                                            style={{
                                                fontSize: "20px",
                                                fontWeight: "700",
                                                color: "#3498db",
                                            }}
                                        >
                                            ${total.toFixed(2)}
                                        </span>
                                    </div>
                                </div>

                                {/* Purchase Order Badge */}
                                <div
                                    style={{
                                        padding: "15px",
                                        backgroundColor: "#f8f9fa",
                                        borderRadius: "6px",
                                        marginBottom: "20px",
                                        textAlign: "center",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: "24px",
                                            marginBottom: "8px",
                                        }}
                                    >
                                        📋
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "14px",
                                            fontWeight: "600",
                                            color: "#2c3e50",
                                            marginBottom: "4px",
                                        }}
                                    >
                                        Orden de Compra
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "12px",
                                            color: "#3498db",
                                        }}
                                    >
                                        📄 Se generará orden después del
                                        registro
                                    </div>
                                </div>

                                {/* Quick Stats */}
                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "1fr 1fr",
                                        gap: "12px",
                                        marginBottom: "20px",
                                    }}
                                >
                                    <div
                                        style={{
                                            backgroundColor: "#e8f4fd",
                                            borderRadius: "6px",
                                            padding: "12px",
                                            textAlign: "center",
                                            border: "1px solid #3498db",
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: "18px",
                                                fontWeight: "700",
                                                color: "#3498db",
                                            }}
                                        >
                                            {orderItems.length}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: "12px",
                                                color: "#2c3e50",
                                            }}
                                        >
                                            Productos
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            backgroundColor: "#d5edda",
                                            borderRadius: "6px",
                                            padding: "12px",
                                            textAlign: "center",
                                            border: "1px solid #27ae60",
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: "18px",
                                                fontWeight: "700",
                                                color: "#27ae60",
                                            }}
                                        >
                                            {orderItems.reduce(
                                                (sum, item) =>
                                                    sum + item.quantity,
                                                0
                                            )}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: "12px",
                                                color: "#2c3e50",
                                            }}
                                        >
                                            Unidades
                                        </div>
                                    </div>
                                </div>

                                {/* Total Display - Large */}
                                <div
                                    style={{
                                        background:
                                            "linear-gradient(135deg, #3498db 0%, #2c3e50 100%)",
                                        borderRadius: "8px",
                                        padding: "20px",
                                        color: "white",
                                        textAlign: "center",
                                        marginBottom: "20px",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: "14px",
                                            opacity: "0.9",
                                            marginBottom: "4px",
                                        }}
                                    >
                                        Total de la Orden
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "28px",
                                            fontWeight: "700",
                                        }}
                                    >
                                        ${total.toFixed(2)}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "12px",
                                            opacity: "0.8",
                                            marginTop: "4px",
                                        }}
                                    >
                                        Orden de compra
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <button
                                    onClick={handleCreateOrder}
                                    disabled={
                                        !selectedSupplier ||
                                        orderItems.length === 0 ||
                                        !selectedLocation ||
                                        isSubmitting
                                    }
                                    style={{
                                        width: "100%",
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        padding: "15px",
                                        fontSize: "16px",
                                        fontWeight: "600",
                                        borderRadius: "6px",
                                        border: "none",
                                        cursor:
                                            !selectedSupplier ||
                                            orderItems.length === 0 ||
                                            !selectedLocation ||
                                            isSubmitting
                                                ? "not-allowed"
                                                : "pointer",
                                        transition: "all 0.2s ease",
                                        backgroundColor:
                                            !selectedSupplier ||
                                            orderItems.length === 0 ||
                                            !selectedLocation ||
                                            isSubmitting
                                                ? "#95a5a6"
                                                : "#27ae60",
                                        color: "white",
                                        opacity:
                                            !selectedSupplier ||
                                            orderItems.length === 0 ||
                                            !selectedLocation ||
                                            isSubmitting
                                                ? 0.7
                                                : 1,
                                    }}
                                >
                                    {isSubmitting
                                        ? "Enviando..."
                                        : "✅ Crear Orden de Compra"}
                                </button>

                                {/* Help Text */}
                                <div
                                    style={{
                                        fontSize: "12px",
                                        color: "#6c757d",
                                        textAlign: "center",
                                        marginTop: "12px",
                                    }}
                                >
                                    {!selectedSupplier
                                        ? "Seleccione un proveedor y agregue productos para continuar"
                                        : orderItems.length === 0
                                        ? "Agregue productos para continuar"
                                        : "Verifique todos los datos antes de crear la orden"}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {activeSection === "otra" && (
                <div
                    style={{
                        maxWidth: 1200,
                        margin: "0 auto",
                        padding: 48,
                        color: "#222",
                    }}
                >
                    <h2
                        style={{
                            fontWeight: 800,
                            fontSize: 28,
                            marginBottom: 24,
                            textAlign: "center",
                        }}
                    >
                        Órdenes de Compra Registradas
                    </h2>
                    {ordersLoading ? (
                        <div
                            style={{
                                textAlign: "center",
                                color: "#888",
                                fontSize: 18,
                                padding: 40,
                            }}
                        >
                            Cargando órdenes...
                        </div>
                    ) : ordersError ? (
                        <div
                            style={{
                                textAlign: "center",
                                color: "#c0392b",
                                fontWeight: 600,
                                fontSize: 18,
                                padding: 40,
                            }}
                        >
                            {ordersError}
                        </div>
                    ) : (
                        <>
                            <table
                                style={{
                                    width: "100%",
                                    borderCollapse: "collapse",
                                    background: "#fff",
                                    borderRadius: "16px",
                                    overflow: "hidden",
                                    boxShadow: "0 8px 32px rgba(44,62,80,0.12)",
                                    marginBottom: 32,
                                    border: "1px solid #e9ecef",
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
                                                padding: "20px 16px",
                                                textAlign: "left",
                                                fontWeight: "700",
                                                fontSize: "14px",
                                                letterSpacing: "0.5px",
                                                textTransform: "uppercase",
                                                borderBottom:
                                                    "2px solid #1a252f",
                                                width: "8%",
                                            }}
                                        >
                                            ID
                                        </th>
                                        <th
                                            style={{
                                                padding: "20px 16px",
                                                textAlign: "left",
                                                fontWeight: "700",
                                                fontSize: "14px",
                                                letterSpacing: "0.5px",
                                                textTransform: "uppercase",
                                                borderBottom:
                                                    "2px solid #1a252f",
                                                width: "25%",
                                            }}
                                        >
                                            Proveedor
                                        </th>
                                        <th
                                            style={{
                                                padding: "20px 16px",
                                                textAlign: "left",
                                                fontWeight: "700",
                                                fontSize: "14px",
                                                letterSpacing: "0.5px",
                                                textTransform: "uppercase",
                                                borderBottom:
                                                    "2px solid #1a252f",
                                                width: "20%",
                                            }}
                                        >
                                            Sede Destino
                                        </th>
                                        <th
                                            style={{
                                                padding: "20px 16px",
                                                textAlign: "left",
                                                fontWeight: "700",
                                                fontSize: "14px",
                                                letterSpacing: "0.5px",
                                                textTransform: "uppercase",
                                                borderBottom:
                                                    "2px solid #1a252f",
                                                width: "15%",
                                            }}
                                        >
                                            Fecha
                                        </th>
                                        <th
                                            style={{
                                                padding: "20px 16px",
                                                textAlign: "center",
                                                fontWeight: "700",
                                                fontSize: "14px",
                                                letterSpacing: "0.5px",
                                                textTransform: "uppercase",
                                                borderBottom:
                                                    "2px solid #1a252f",
                                                width: "12%",
                                            }}
                                        >
                                            Estado
                                        </th>
                                        <th
                                            style={{
                                                padding: "20px 16px",
                                                textAlign: "right",
                                                fontWeight: "700",
                                                fontSize: "14px",
                                                letterSpacing: "0.5px",
                                                textTransform: "uppercase",
                                                borderBottom:
                                                    "2px solid #1a252f",
                                                width: "20%",
                                            }}
                                        >
                                            Total
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                style={{
                                                    textAlign: "center",
                                                    color: "#888",
                                                    padding: 40,
                                                }}
                                            >
                                                No hay órdenes registradas.
                                            </td>
                                        </tr>
                                    ) : (
                                        orders.map((order) => {
                                            // Buscar nombre del proveedor
                                            let supplierName =
                                                order.supplier_name;
                                            if (
                                                !supplierName &&
                                                order.supplier
                                            ) {
                                                const found = suppliers.find(
                                                    (s) =>
                                                        s.id ===
                                                            order.supplier ||
                                                        s.id ===
                                                            Number(
                                                                order.supplier
                                                            )
                                                );
                                                supplierName = found
                                                    ? found.name
                                                    : order.supplier;
                                            }
                                            // Buscar nombre de la sede destino
                                            let destinationName =
                                                order.destination_name;
                                            if (
                                                !destinationName &&
                                                order.destination
                                            ) {
                                                const found = locations.find(
                                                    (l) =>
                                                        l.id ===
                                                            order.destination ||
                                                        l.id ===
                                                            Number(
                                                                order.destination
                                                            )
                                                );
                                                destinationName = found
                                                    ? found.name
                                                    : order.destination;
                                            }
                                            return (
                                                <tr
                                                    key={order.id}
                                                    style={{
                                                        borderBottom:
                                                            "1px solid #f0f0f0",
                                                        background: "#fff",
                                                        cursor: "pointer",
                                                        transition:
                                                            "all 0.2s ease",
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        const row =
                                                            e.currentTarget;
                                                        row.style.backgroundColor =
                                                            "#f8f9fa";
                                                        row.style.transform =
                                                            "translateY(-1px)";
                                                        row.style.boxShadow =
                                                            "0 4px 12px rgba(44,62,80,0.08)";
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        const row =
                                                            e.currentTarget;
                                                        row.style.backgroundColor =
                                                            "#fff";
                                                        row.style.transform =
                                                            "translateY(0)";
                                                        row.style.boxShadow =
                                                            "none";
                                                    }}
                                                    onClick={async () => {
                                                        setOrderDetailLoading(
                                                            true
                                                        );
                                                        setOrderDetailError("");
                                                        setShowOrderDetail(
                                                            true
                                                        );
                                                        try {
                                                            const res =
                                                                await fetch(
                                                                    `https://unidental-backend.onrender.com/api/purchases/orders/${order.id}/`,
                                                                    {
                                                                        headers:
                                                                            {
                                                                                "Content-Type":
                                                                                    "application/json",
                                                                                Authorization: `Token ${authToken}`,
                                                                            },
                                                                    }
                                                                );
                                                            if (!res.ok) {
                                                                const err =
                                                                    await res
                                                                        .json()
                                                                        .catch(
                                                                            () => ({})
                                                                        );
                                                                throw new Error(
                                                                    err.detail ||
                                                                        `Error ${res.status}`
                                                                );
                                                            }
                                                            const data =
                                                                await res.json();
                                                            // Agregar supplierName y destinationName para consistencia visual
                                                            setSelectedOrder({
                                                                ...data,
                                                                supplierName:
                                                                    data
                                                                        .supplier_details
                                                                        ?.name ||
                                                                    supplierName,
                                                                destinationName:
                                                                    data
                                                                        .destination_details
                                                                        ?.name ||
                                                                    destinationName,
                                                            });
                                                        } catch (err) {
                                                            setOrderDetailError(
                                                                err.message ||
                                                                    "Error al cargar detalle de la orden"
                                                            );
                                                            setSelectedOrder(
                                                                null
                                                            );
                                                        } finally {
                                                            setOrderDetailLoading(
                                                                false
                                                            );
                                                        }
                                                    }}
                                                >
                                                    <td
                                                        style={{
                                                            padding:
                                                                "20px 16px",
                                                            fontWeight: "700",
                                                            fontSize: "15px",
                                                            color: "#2c3e50",
                                                            textAlign: "left",
                                                            borderBottom:
                                                                "1px solid #f0f0f0",
                                                        }}
                                                    >
                                                        #{order.id}
                                                    </td>
                                                    <td
                                                        style={{
                                                            padding:
                                                                "20px 16px",
                                                            fontSize: "14px",
                                                            color: "#495057",
                                                            textAlign: "left",
                                                            borderBottom:
                                                                "1px solid #f0f0f0",
                                                            fontWeight: "500",
                                                        }}
                                                    >
                                                        {supplierName || "-"}
                                                    </td>
                                                    <td
                                                        style={{
                                                            padding:
                                                                "20px 16px",
                                                            fontSize: "14px",
                                                            color: "#495057",
                                                            textAlign: "left",
                                                            borderBottom:
                                                                "1px solid #f0f0f0",
                                                            fontWeight: "500",
                                                        }}
                                                    >
                                                        {destinationName || "-"}
                                                    </td>
                                                    <td
                                                        style={{
                                                            padding:
                                                                "20px 16px",
                                                            fontSize: "14px",
                                                            color: "#495057",
                                                            textAlign: "left",
                                                            borderBottom:
                                                                "1px solid #f0f0f0",
                                                            fontWeight: "500",
                                                        }}
                                                    >
                                                        {order.order_date
                                                            ? new Date(
                                                                  order.order_date
                                                              ).toLocaleDateString(
                                                                  "es-ES",
                                                                  {
                                                                      year: "numeric",
                                                                      month: "short",
                                                                      day: "numeric",
                                                                  }
                                                              )
                                                            : "-"}
                                                    </td>
                                                    <td
                                                        style={{
                                                            padding:
                                                                "20px 16px",
                                                            textAlign: "center",
                                                            borderBottom:
                                                                "1px solid #f0f0f0",
                                                        }}
                                                    >
                                                        <span
                                                            style={{
                                                                display:
                                                                    "inline-block",
                                                                padding:
                                                                    "6px 12px",
                                                                borderRadius:
                                                                    "20px",
                                                                fontSize:
                                                                    "12px",
                                                                fontWeight:
                                                                    "700",
                                                                textTransform:
                                                                    "uppercase",
                                                                letterSpacing:
                                                                    "0.5px",
                                                                backgroundColor:
                                                                    order.status ===
                                                                    "pending"
                                                                        ? "#fff3cd"
                                                                        : order.status ===
                                                                          "approved"
                                                                        ? "#d1ecf1"
                                                                        : order.status ===
                                                                          "completed"
                                                                        ? "#d4edda"
                                                                        : order.status ===
                                                                          "cancelled"
                                                                        ? "#f8d7da"
                                                                        : "#e2e3e5",
                                                                color:
                                                                    order.status ===
                                                                    "pending"
                                                                        ? "#856404"
                                                                        : order.status ===
                                                                          "approved"
                                                                        ? "#0c5460"
                                                                        : order.status ===
                                                                          "completed"
                                                                        ? "#155724"
                                                                        : order.status ===
                                                                          "cancelled"
                                                                        ? "#721c24"
                                                                        : "#383d41",
                                                                border: "1px solid",
                                                                borderColor:
                                                                    order.status ===
                                                                    "pending"
                                                                        ? "#ffeaa7"
                                                                        : order.status ===
                                                                          "approved"
                                                                        ? "#bee5eb"
                                                                        : order.status ===
                                                                          "completed"
                                                                        ? "#c3e6cb"
                                                                        : order.status ===
                                                                          "cancelled"
                                                                        ? "#f5c6cb"
                                                                        : "#d6d8db",
                                                            }}
                                                        >
                                                            {order.status_display ||
                                                                translateStatus(
                                                                    order.status
                                                                ) ||
                                                                "-"}
                                                        </span>
                                                    </td>
                                                    <td
                                                        style={{
                                                            padding:
                                                                "20px 16px",
                                                            color: "#27ae60",
                                                            fontWeight: "700",
                                                            fontSize: "15px",
                                                            textAlign: "right",
                                                            borderBottom:
                                                                "1px solid #f0f0f0",
                                                        }}
                                                    >
                                                        {order.total_amount
                                                            ? `$${parseFloat(
                                                                  order.total_amount
                                                              ).toLocaleString(
                                                                  "es-CO",
                                                                  {
                                                                      minimumFractionDigits: 0,
                                                                  }
                                                              )}`
                                                            : "-"}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                            {/* Paginación */}
                            {ordersTotalPages > 1 && (
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "center",
                                        gap: 16,
                                        marginBottom: 24,
                                    }}
                                >
                                    <button
                                        onClick={() =>
                                            setOrdersPage((p) =>
                                                Math.max(1, p - 1)
                                            )
                                        }
                                        disabled={ordersPage === 1}
                                        style={{
                                            padding: "8px 18px",
                                            borderRadius: 6,
                                            border: "1.5px solid #e3eaf3",
                                            background:
                                                ordersPage === 1
                                                    ? "#f8f9fa"
                                                    : "#fff",
                                            color: "#2c3e50",
                                            fontWeight: 700,
                                            cursor:
                                                ordersPage === 1
                                                    ? "not-allowed"
                                                    : "pointer",
                                        }}
                                    >
                                        ← Anterior
                                    </button>
                                    <span
                                        style={{
                                            fontWeight: 600,
                                            fontSize: 16,
                                            color: "#2c3e50",
                                            alignSelf: "center",
                                        }}
                                    >
                                        Página {ordersPage} de{" "}
                                        {ordersTotalPages}
                                    </span>
                                    <button
                                        onClick={() =>
                                            setOrdersPage((p) =>
                                                Math.min(
                                                    ordersTotalPages,
                                                    p + 1
                                                )
                                            )
                                        }
                                        disabled={
                                            ordersPage === ordersTotalPages
                                        }
                                        style={{
                                            padding: "8px 18px",
                                            borderRadius: 6,
                                            border: "1.5px solid #e3eaf3",
                                            background:
                                                ordersPage === ordersTotalPages
                                                    ? "#f8f9fa"
                                                    : "#fff",
                                            color: "#2c3e50",
                                            fontWeight: 700,
                                            cursor:
                                                ordersPage === ordersTotalPages
                                                    ? "not-allowed"
                                                    : "pointer",
                                        }}
                                    >
                                        Siguiente →
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
            {/* Panel lateral de detalle de orden */}
            {showOrderDetail && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        right: 0,
                        width: "480px",
                        height: "100vh",
                        background:
                            "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)",
                        boxShadow: "-8px 0 32px rgba(44,62,80,0.15)",
                        zIndex: 1000,
                        padding: "0",
                        overflowY: "auto",
                        transition: "transform 0.3s cubic-bezier(.4,2,.3,1)",
                        animation: "slideInDrawer .3s cubic-bezier(.4,2,.3,1)",
                        borderLeft: "1px solid #e9ecef",
                    }}
                >
                    <style>{`
                        @keyframes slideInDrawer {
                            from { transform: translateX(100%); opacity: 0; }
                            to { transform: translateX(0); opacity: 1; }
                        }
                    `}</style>

                    {/* Header del panel */}
                    <div
                        style={{
                            background:
                                "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)",
                            color: "white",
                            padding: "24px 32px",
                            position: "sticky",
                            top: 0,
                            zIndex: 10,
                            boxShadow: "0 2px 8px rgba(44,62,80,0.1)",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <div>
                                <h2
                                    style={{
                                        fontWeight: "800",
                                        fontSize: "24px",
                                        margin: "0 0 4px 0",
                                        color: "white",
                                        letterSpacing: "-0.5px",
                                    }}
                                >
                                    Detalle de Orden
                                </h2>
                                <p
                                    style={{
                                        margin: 0,
                                        opacity: 0.9,
                                        fontSize: "14px",
                                        fontWeight: "500",
                                    }}
                                >
                                    Información completa de la orden
                                </p>
                            </div>
                            <button
                                onClick={() => setShowOrderDetail(false)}
                                style={{
                                    background: "rgba(255,255,255,0.2)",
                                    border: "none",
                                    borderRadius: "50%",
                                    width: "40px",
                                    height: "40px",
                                    fontSize: "20px",
                                    color: "white",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    transition: "all 0.2s ease",
                                    backdropFilter: "blur(10px)",
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.background =
                                        "rgba(255,255,255,0.3)";
                                    e.target.style.transform = "scale(1.1)";
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background =
                                        "rgba(255,255,255,0.2)";
                                    e.target.style.transform = "scale(1)";
                                }}
                                title="Cerrar"
                            >
                                ×
                            </button>
                        </div>
                    </div>
                    {orderDetailLoading ? (
                        <div
                            style={{
                                color: "#888",
                                textAlign: "center",
                                padding: 32,
                                fontSize: 18,
                            }}
                        >
                            Cargando detalle...
                        </div>
                    ) : orderDetailError ? (
                        <div
                            style={{
                                color: "#c0392b",
                                textAlign: "center",
                                padding: 32,
                                fontWeight: 600,
                            }}
                        >
                            {orderDetailError}
                        </div>
                    ) : selectedOrder ? (
                        <div style={{ padding: "32px" }}>
                            {/* Información principal de la orden */}
                            <div
                                style={{
                                    background: "white",
                                    borderRadius: "16px",
                                    padding: "24px",
                                    marginBottom: "24px",
                                    boxShadow: "0 4px 16px rgba(44,62,80,0.08)",
                                    border: "1px solid #e9ecef",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "12px",
                                        marginBottom: "20px",
                                        paddingBottom: "16px",
                                        borderBottom: "2px solid #f8f9fa",
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
                                            color: "#1976d2",
                                            fontSize: "20px",
                                            fontWeight: "700",
                                        }}
                                    >
                                        #{selectedOrder.id}
                                    </div>
                                    <div>
                                        <h3
                                            style={{
                                                fontWeight: "800",
                                                fontSize: "20px",
                                                margin: "0 0 4px 0",
                                                color: "#2c3e50",
                                            }}
                                        >
                                            Orden #{selectedOrder.id}
                                        </h3>
                                        <span
                                            style={{
                                                display: "inline-block",
                                                padding: "4px 12px",
                                                borderRadius: "20px",
                                                fontSize: "12px",
                                                fontWeight: "700",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.5px",
                                                backgroundColor:
                                                    selectedOrder.status ===
                                                    "pending"
                                                        ? "#fff3cd"
                                                        : selectedOrder.status ===
                                                          "approved"
                                                        ? "#d1ecf1"
                                                        : selectedOrder.status ===
                                                          "completed"
                                                        ? "#d4edda"
                                                        : selectedOrder.status ===
                                                          "cancelled"
                                                        ? "#f8d7da"
                                                        : "#e2e3e5",
                                                color:
                                                    selectedOrder.status ===
                                                    "pending"
                                                        ? "#856404"
                                                        : selectedOrder.status ===
                                                          "approved"
                                                        ? "#0c5460"
                                                        : selectedOrder.status ===
                                                          "completed"
                                                        ? "#155724"
                                                        : selectedOrder.status ===
                                                          "cancelled"
                                                        ? "#721c24"
                                                        : "#383d41",
                                                border: "1px solid",
                                                borderColor:
                                                    selectedOrder.status ===
                                                    "pending"
                                                        ? "#ffeaa7"
                                                        : selectedOrder.status ===
                                                          "approved"
                                                        ? "#bee5eb"
                                                        : selectedOrder.status ===
                                                          "completed"
                                                        ? "#c3e6cb"
                                                        : selectedOrder.status ===
                                                          "cancelled"
                                                        ? "#f5c6cb"
                                                        : "#d6d8db",
                                            }}
                                        >
                                            {selectedOrder.status_display ||
                                                translateStatus(
                                                    selectedOrder.status
                                                ) ||
                                                "-"}
                                        </span>
                                    </div>
                                </div>

                                {/* Detalles de la orden */}
                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "1fr 1fr",
                                        gap: "16px",
                                    }}
                                >
                                    <div
                                        style={{
                                            padding: "16px",
                                            background: "#f8f9fa",
                                            borderRadius: "12px",
                                            border: "1px solid #e9ecef",
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: "12px",
                                                fontWeight: "700",
                                                color: "#6c757d",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.5px",
                                                marginBottom: "4px",
                                            }}
                                        >
                                            Proveedor
                                        </div>
                                        <div
                                            style={{
                                                fontSize: "14px",
                                                fontWeight: "600",
                                                color: "#2c3e50",
                                            }}
                                        >
                                            {selectedOrder.supplierName || "-"}
                                        </div>
                                    </div>

                                    <div
                                        style={{
                                            padding: "16px",
                                            background: "#f8f9fa",
                                            borderRadius: "12px",
                                            border: "1px solid #e9ecef",
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: "12px",
                                                fontWeight: "700",
                                                color: "#6c757d",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.5px",
                                                marginBottom: "4px",
                                            }}
                                        >
                                            Sede Destino
                                        </div>
                                        <div
                                            style={{
                                                fontSize: "14px",
                                                fontWeight: "600",
                                                color: "#2c3e50",
                                            }}
                                        >
                                            {selectedOrder.destinationName ||
                                                "-"}
                                        </div>
                                    </div>

                                    <div
                                        style={{
                                            padding: "16px",
                                            background: "#f8f9fa",
                                            borderRadius: "12px",
                                            border: "1px solid #e9ecef",
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: "12px",
                                                fontWeight: "700",
                                                color: "#6c757d",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.5px",
                                                marginBottom: "4px",
                                            }}
                                        >
                                            Fecha
                                        </div>
                                        <div
                                            style={{
                                                fontSize: "14px",
                                                fontWeight: "600",
                                                color: "#2c3e50",
                                            }}
                                        >
                                            {selectedOrder.order_date
                                                ? new Date(
                                                      selectedOrder.order_date
                                                  ).toLocaleDateString(
                                                      "es-ES",
                                                      {
                                                          year: "numeric",
                                                          month: "long",
                                                          day: "numeric",
                                                      }
                                                  )
                                                : "-"}
                                        </div>
                                    </div>

                                    <div
                                        style={{
                                            padding: "16px",
                                            background: "#f8f9fa",
                                            borderRadius: "12px",
                                            border: "1px solid #e9ecef",
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: "12px",
                                                fontWeight: "700",
                                                color: "#6c757d",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.5px",
                                                marginBottom: "4px",
                                            }}
                                        >
                                            Total
                                        </div>
                                        <div
                                            style={{
                                                fontSize: "16px",
                                                fontWeight: "700",
                                                color: "#27ae60",
                                            }}
                                        >
                                            {selectedOrder.total_amount
                                                ? `$${parseFloat(
                                                      selectedOrder.total_amount
                                                  ).toLocaleString("es-CO", {
                                                      minimumFractionDigits: 0,
                                                  })}`
                                                : "-"}
                                        </div>
                                    </div>
                                </div>

                                {/* Notas */}
                                {selectedOrder.notes && (
                                    <div
                                        style={{
                                            marginTop: "16px",
                                            padding: "16px",
                                            background: "#fff3cd",
                                            borderRadius: "12px",
                                            border: "1px solid #ffeaa7",
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: "12px",
                                                fontWeight: "700",
                                                color: "#856404",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.5px",
                                                marginBottom: "8px",
                                            }}
                                        >
                                            Notas
                                        </div>
                                        <div
                                            style={{
                                                fontSize: "14px",
                                                color: "#856404",
                                                lineHeight: "1.5",
                                            }}
                                        >
                                            {selectedOrder.notes}
                                        </div>
                                    </div>
                                )}
                            </div>
                            {/* Tabla de productos */}
                            <div
                                style={{
                                    background: "white",
                                    borderRadius: "16px",
                                    padding: "24px",
                                    marginBottom: "24px",
                                    boxShadow: "0 4px 16px rgba(44,62,80,0.08)",
                                    border: "1px solid #e9ecef",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "12px",
                                        marginBottom: "20px",
                                        paddingBottom: "16px",
                                        borderBottom: "2px solid #f8f9fa",
                                    }}
                                >
                                    <div
                                        style={{
                                            width: "40px",
                                            height: "40px",
                                            backgroundColor: "#e8f5e8",
                                            borderRadius: "10px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: "#27ae60",
                                            fontSize: "16px",
                                        }}
                                    >
                                        📦
                                    </div>
                                    <h3
                                        style={{
                                            fontWeight: "800",
                                            fontSize: "18px",
                                            margin: 0,
                                            color: "#2c3e50",
                                        }}
                                    >
                                        Productos de la orden
                                    </h3>
                                </div>
                                {Array.isArray(selectedOrder.items) &&
                                selectedOrder.items.length > 0 ? (
                                    <div
                                        style={{
                                            overflowX: "auto",
                                            borderRadius: "8px",
                                            border: "1px solid #e9ecef",
                                            boxShadow:
                                                "0 1px 4px rgba(0,0,0,0.04)",
                                        }}
                                    >
                                        <table
                                            style={{
                                                width: "100%",
                                                borderCollapse: "collapse",
                                                background: "white",
                                                minWidth: "350px",
                                            }}
                                        >
                                            <thead>
                                                <tr
                                                    style={{
                                                        background:
                                                            "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
                                                        borderBottom:
                                                            "1px solid #dee2e6",
                                                    }}
                                                >
                                                    <th
                                                        style={{
                                                            padding: "10px 8px",
                                                            textAlign: "left",
                                                            fontWeight: "700",
                                                            fontSize: "11px",
                                                            letterSpacing:
                                                                "0.5px",
                                                            textTransform:
                                                                "uppercase",
                                                            color: "#495057",
                                                        }}
                                                    >
                                                        Producto
                                                    </th>
                                                    <th
                                                        style={{
                                                            padding: "10px 8px",
                                                            textAlign: "center",
                                                            fontWeight: "700",
                                                            fontSize: "11px",
                                                            letterSpacing:
                                                                "0.5px",
                                                            textTransform:
                                                                "uppercase",
                                                            color: "#495057",
                                                        }}
                                                    >
                                                        Cant.
                                                    </th>
                                                    <th
                                                        style={{
                                                            padding: "10px 8px",
                                                            textAlign: "right",
                                                            fontWeight: "700",
                                                            fontSize: "11px",
                                                            letterSpacing:
                                                                "0.5px",
                                                            textTransform:
                                                                "uppercase",
                                                            color: "#495057",
                                                        }}
                                                    >
                                                        Precio
                                                    </th>
                                                    <th
                                                        style={{
                                                            padding: "10px 8px",
                                                            textAlign: "right",
                                                            fontWeight: "700",
                                                            fontSize: "11px",
                                                            letterSpacing:
                                                                "0.5px",
                                                            textTransform:
                                                                "uppercase",
                                                            color: "#495057",
                                                        }}
                                                    >
                                                        Total
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedOrder.items.map(
                                                    (item, idx) => (
                                                        <tr
                                                            key={idx}
                                                            style={{
                                                                borderBottom:
                                                                    "1px solid #f0f0f0",
                                                                backgroundColor:
                                                                    idx % 2 ===
                                                                    0
                                                                        ? "#fff"
                                                                        : "#f8f9fa",
                                                            }}
                                                        >
                                                            <td
                                                                style={{
                                                                    padding:
                                                                        "8px 6px",
                                                                    fontWeight:
                                                                        "600",
                                                                    fontSize:
                                                                        "12px",
                                                                    color: "#2c3e50",
                                                                    textAlign:
                                                                        "left",
                                                                }}
                                                            >
                                                                {item
                                                                    .purchase_option_details
                                                                    ?.product_name ||
                                                                    item.product_name ||
                                                                    item.product ||
                                                                    "-"}
                                                            </td>
                                                            <td
                                                                style={{
                                                                    padding:
                                                                        "8px 6px",
                                                                    fontSize:
                                                                        "12px",
                                                                    color: "#495057",
                                                                    textAlign:
                                                                        "center",
                                                                    fontWeight:
                                                                        "600",
                                                                }}
                                                            >
                                                                {item.quantity_requested ||
                                                                    item.quantity ||
                                                                    "-"}
                                                            </td>
                                                            <td
                                                                style={{
                                                                    padding:
                                                                        "8px 6px",
                                                                    fontSize:
                                                                        "12px",
                                                                    color: "#495057",
                                                                    textAlign:
                                                                        "right",
                                                                    fontWeight:
                                                                        "500",
                                                                }}
                                                            >
                                                                {item.unit_price
                                                                    ? `$${parseFloat(
                                                                          item.unit_price
                                                                      ).toLocaleString(
                                                                          "es-CO",
                                                                          {
                                                                              minimumFractionDigits: 0,
                                                                          }
                                                                      )}`
                                                                    : "-"}
                                                            </td>
                                                            <td
                                                                style={{
                                                                    padding:
                                                                        "8px 6px",
                                                                    color: "#27ae60",
                                                                    fontWeight:
                                                                        "700",
                                                                    fontSize:
                                                                        "12px",
                                                                    textAlign:
                                                                        "right",
                                                                }}
                                                            >
                                                                {item.line_total
                                                                    ? `$${parseFloat(
                                                                          item.line_total
                                                                      ).toLocaleString(
                                                                          "es-CO",
                                                                          {
                                                                              minimumFractionDigits: 0,
                                                                          }
                                                                      )}`
                                                                    : "-"}
                                                            </td>
                                                        </tr>
                                                    )
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div
                                        style={{
                                            color: "#6c757d",
                                            textAlign: "center",
                                            padding: "32px 16px",
                                            fontSize: "14px",
                                            fontStyle: "italic",
                                        }}
                                    >
                                        No hay productos en esta orden.
                                    </div>
                                )}
                            </div>

                            {/* Información adicional */}
                            <div
                                style={{
                                    background: "white",
                                    borderRadius: "16px",
                                    padding: "20px",
                                    boxShadow: "0 4px 16px rgba(44,62,80,0.08)",
                                    border: "1px solid #e9ecef",
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: "12px",
                                        fontWeight: "700",
                                        color: "#6c757d",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.5px",
                                        marginBottom: "12px",
                                    }}
                                >
                                    Información del Sistema
                                </div>
                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "1fr 1fr",
                                        gap: "12px",
                                        fontSize: "13px",
                                        color: "#495057",
                                    }}
                                >
                                    <div>
                                        <span style={{ fontWeight: "600" }}>
                                            ID interno:
                                        </span>{" "}
                                        {selectedOrder.id}
                                    </div>
                                    <div>
                                        <span style={{ fontWeight: "600" }}>
                                            Creado:
                                        </span>{" "}
                                        {selectedOrder.created_at
                                            ? new Date(
                                                  selectedOrder.created_at
                                              ).toLocaleDateString("es-ES", {
                                                  year: "numeric",
                                                  month: "short",
                                                  day: "numeric",
                                                  hour: "2-digit",
                                                  minute: "2-digit",
                                              })
                                            : "-"}
                                    </div>
                                    <div>
                                        <span style={{ fontWeight: "600" }}>
                                            Actualizado:
                                        </span>{" "}
                                        {selectedOrder.updated_at
                                            ? new Date(
                                                  selectedOrder.updated_at
                                              ).toLocaleDateString("es-ES", {
                                                  year: "numeric",
                                                  month: "short",
                                                  day: "numeric",
                                                  hour: "2-digit",
                                                  minute: "2-digit",
                                              })
                                            : "-"}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>
            )}
        </>
    );
};

export default OrdenesDeCompraPage;
