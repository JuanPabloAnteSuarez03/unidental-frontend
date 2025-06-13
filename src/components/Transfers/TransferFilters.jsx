import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import inventoryService from "../../services/inventoryService";

const TransferFilters = ({
    filters,
    handleFilterChange,
    applyFilters,
    clearFilters,
    estados,
    onProductSearchChange,
}) => {
    const { authToken } = useAuth();
    const [ubicaciones, setUbicaciones] = useState([]);
    const [isLoadingUbicaciones, setIsLoadingUbicaciones] = useState(false);
    const [productos, setProductos] = useState([]);
    const [isLoadingProductos, setIsLoadingProductos] = useState(false);
    const [productSearchTerm, setProductSearchTerm] = useState("");

    // Cargar ubicaciones reales desde la base de datos
    const loadUbicaciones = useCallback(async () => {
        if (!authToken) return;

        setIsLoadingUbicaciones(true);
        try {
            const data = await inventoryService.getLocations(authToken);
            setUbicaciones(data || []);

            if (!data || data.length === 0) {
                console.warn("No se encontraron ubicaciones disponibles");
            }
        } catch (error) {
            console.error("Error al cargar ubicaciones:", error);
            setUbicaciones([]);
        } finally {
            setIsLoadingUbicaciones(false);
        }
    }, [authToken]);

    // Cargar productos para la búsqueda
    const loadProductos = useCallback(
        async (searchTerm = "") => {
            if (!authToken) return;

            setIsLoadingProductos(true);
            try {
                const params = {};
                if (searchTerm.trim()) {
                    // Buscar por nombre
                    params.search = searchTerm.trim();
                }

                const data = await inventoryService.getAllProducts(
                    params,
                    authToken
                );
                setProductos(data || []);
            } catch (error) {
                console.error("Error al cargar productos:", error);
                setProductos([]);
            } finally {
                setIsLoadingProductos(false);
            }
        },
        [authToken]
    );

    // Cargar ubicaciones al montar el componente
    useEffect(() => {
        if (authToken) {
            loadUbicaciones();
        }
    }, [authToken, loadUbicaciones]);

    // Manejar cambio en la búsqueda de productos
    const handleProductSearchChange = (e) => {
        const value = e.target.value;
        setProductSearchTerm(value);

        // Notificar al componente padre sobre el cambio
        if (onProductSearchChange) {
            onProductSearchChange(value);
        }

        // Cargar productos que coincidan con la búsqueda
        if (value.length >= 2) {
            loadProductos(value);
        } else if (value.length === 0) {
            setProductos([]);
        }
    };

    // Manejar selección de producto de la lista
    const handleProductSelect = (product) => {
        setProductSearchTerm(product.name);
        if (onProductSearchChange) {
            onProductSearchChange(product.name);
        }
        setProductos([]); // Limpiar la lista después de seleccionar
    };

    return (
        <div
            style={{
                backgroundColor: "#fff",
                borderRadius: "12px",
                padding: "24px",
                marginBottom: "24px",
                border: "1px solid #e9ecef",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "24px",
                }}
            >
                <div
                    style={{
                        backgroundColor: "#f8f9fa",
                        borderRadius: "8px",
                        padding: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <span style={{ fontSize: "20px" }}>🔍</span>
                </div>
                <h3
                    style={{
                        fontSize: "20px",
                        fontWeight: "600",
                        margin: "0",
                        color: "#2c3e50",
                    }}
                >
                    Filtros de Búsqueda
                </h3>
            </div>

            {/* Búsqueda de productos */}
            <div style={{ marginBottom: "20px" }}>
                <label
                    htmlFor="productSearch"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        marginBottom: "6px",
                        fontWeight: "500",
                        fontSize: "14px",
                        color: "#495057",
                    }}
                >
                    🔎 Búsqueda de productos:
                </label>
                <div style={{ position: "relative", maxWidth: "100%" }}>
                    <input
                        type="text"
                        id="productSearch"
                        value={productSearchTerm}
                        onChange={handleProductSearchChange}
                        style={{
                            width: "100%",
                            maxWidth: "100%",
                            boxSizing: "border-box",
                            padding: "12px 16px",
                            borderRadius: "8px",
                            border: "2px solid #e9ecef",
                            fontSize: "14px",
                            fontWeight: "400",
                            transition: "all 0.2s ease",
                            outline: "none",
                        }}
                        placeholder="Buscar por nombre de producto..."
                        onFocus={(e) => {
                            e.target.style.borderColor = "#2c3e50";
                            e.target.style.boxShadow =
                                "0 0 0 3px rgba(44, 62, 80, 0.1)";
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor = "#e9ecef";
                            e.target.style.boxShadow = "none";
                        }}
                    />

                    {/* Loading indicator para productos */}
                    {isLoadingProductos && (
                        <div
                            style={{
                                position: "absolute",
                                right: "16px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                fontSize: "12px",
                                color: "#2c3e50",
                            }}
                        >
                            Buscando...
                        </div>
                    )}

                    {/* Lista de productos sugeridos */}
                    {productos.length > 0 && productSearchTerm.length >= 2 && (
                        <div
                            style={{
                                position: "absolute",
                                top: "100%",
                                left: 0,
                                right: 0,
                                backgroundColor: "#fff",
                                border: "2px solid #e9ecef",
                                borderTop: "none",
                                borderRadius: "0 0 8px 8px",
                                maxHeight: "200px",
                                overflowY: "auto",
                                zIndex: 1000,
                                boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                                width: "100%",
                                boxSizing: "border-box",
                            }}
                        >
                            {productos.slice(0, 10).map((product) => (
                                <div
                                    key={product.id}
                                    onClick={() => handleProductSelect(product)}
                                    style={{
                                        padding: "12px 16px",
                                        cursor: "pointer",
                                        borderBottom: "1px solid #f1f3f4",
                                        transition:
                                            "background-color 0.2s ease",
                                    }}
                                    onMouseOver={(e) => {
                                        e.target.style.backgroundColor =
                                            "#f8f9fa";
                                    }}
                                    onMouseOut={(e) => {
                                        e.target.style.backgroundColor =
                                            "transparent";
                                    }}
                                >
                                    <div
                                        style={{
                                            fontWeight: "500",
                                            color: "#2c3e50",
                                        }}
                                    >
                                        {product.name}
                                    </div>
                                    {product.sku && (
                                        <div
                                            style={{
                                                fontSize: "12px",
                                                color: "#6c757d",
                                            }}
                                        >
                                            SKU: {product.sku}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Filtros de fecha */}
            <div style={{ marginBottom: "20px" }}>
                <h4
                    style={{
                        fontSize: "16px",
                        fontWeight: "600",
                        color: "#495057",
                        marginBottom: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                    }}
                >
                    📅 Rango de Fechas
                </h4>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "16px",
                    }}
                >
                    <div>
                        <label
                            htmlFor="fechaDesde"
                            style={{
                                display: "block",
                                marginBottom: "6px",
                                fontWeight: "500",
                                fontSize: "14px",
                                color: "#495057",
                            }}
                        >
                            Desde:
                        </label>
                        <input
                            type="date"
                            id="fechaDesde"
                            name="fechaDesde"
                            value={filters.fechaDesde}
                            onChange={handleFilterChange}
                            style={{
                                width: "180px",
                                padding: "10px 14px",
                                borderRadius: "8px",
                                border: "2px solid #e9ecef",
                                fontSize: "14px",
                                fontWeight: "500",
                                transition: "all 0.2s ease",
                                outline: "none",
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = "#2c3e50";
                                e.target.style.boxShadow =
                                    "0 0 0 3px rgba(44, 62, 80, 0.1)";
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = "#e9ecef";
                                e.target.style.boxShadow = "none";
                            }}
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="fechaHasta"
                            style={{
                                display: "block",
                                marginBottom: "6px",
                                fontWeight: "500",
                                fontSize: "14px",
                                color: "#495057",
                            }}
                        >
                            Hasta:
                        </label>
                        <input
                            type="date"
                            id="fechaHasta"
                            name="fechaHasta"
                            value={filters.fechaHasta}
                            onChange={handleFilterChange}
                            style={{
                                width: "180px",
                                padding: "10px 14px",
                                borderRadius: "8px",
                                border: "2px solid #e9ecef",
                                fontSize: "14px",
                                fontWeight: "500",
                                transition: "all 0.2s ease",
                                outline: "none",
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = "#2c3e50";
                                e.target.style.boxShadow =
                                    "0 0 0 3px rgba(44, 62, 80, 0.1)";
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = "#e9ecef";
                                e.target.style.boxShadow = "none";
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Filtros de ubicación, estado y tipo */}
            <div style={{ marginBottom: "20px" }}>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fit, minmax(240px, 1fr))",
                        gap: "16px",
                    }}
                >
                    {/* Estado */}
                    <div>
                        <label
                            htmlFor="estado"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                marginBottom: "6px",
                                fontWeight: "500",
                                fontSize: "14px",
                                color: "#495057",
                            }}
                        >
                            📊 Estado:
                        </label>
                        <select
                            id="estado"
                            name="estado"
                            value={filters.estado}
                            onChange={handleFilterChange}
                            style={{
                                width: "100%",
                                padding: "12px 16px",
                                borderRadius: "8px",
                                border: "2px solid #e9ecef",
                                fontSize: "14px",
                                fontWeight: "500",
                                backgroundColor: "#fff",
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                outline: "none",
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = "#2c3e50";
                                e.target.style.boxShadow =
                                    "0 0 0 3px rgba(44, 62, 80, 0.1)";
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = "#e9ecef";
                                e.target.style.boxShadow = "none";
                            }}
                        >
                            <option value="">Todos los estados</option>
                            {estados.map((estado, index) => (
                                <option key={index} value={estado}>
                                    {estado}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Sede Origen */}
                    <div>
                        <label
                            htmlFor="sedeOrigen"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                marginBottom: "6px",
                                fontWeight: "500",
                                fontSize: "14px",
                                color: "#495057",
                            }}
                        >
                            📍 Sede Origen:
                        </label>
                        <select
                            id="sedeOrigen"
                            name="sedeOrigen"
                            value={filters.sedeOrigen}
                            onChange={handleFilterChange}
                            disabled={isLoadingUbicaciones}
                            style={{
                                width: "100%",
                                padding: "12px 16px",
                                borderRadius: "8px",
                                border: "2px solid #e9ecef",
                                fontSize: "14px",
                                fontWeight: "500",
                                backgroundColor: isLoadingUbicaciones
                                    ? "#f8f9fa"
                                    : "#fff",
                                cursor: isLoadingUbicaciones
                                    ? "not-allowed"
                                    : "pointer",
                                transition: "all 0.2s ease",
                                outline: "none",
                                opacity: isLoadingUbicaciones ? 0.7 : 1,
                            }}
                            onFocus={(e) => {
                                if (!isLoadingUbicaciones) {
                                    e.target.style.borderColor = "#2c3e50";
                                    e.target.style.boxShadow =
                                        "0 0 0 3px rgba(44, 62, 80, 0.1)";
                                }
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = "#e9ecef";
                                e.target.style.boxShadow = "none";
                            }}
                        >
                            <option value="">
                                {isLoadingUbicaciones
                                    ? "Cargando sedes..."
                                    : "Todas las sedes"}
                            </option>
                            {ubicaciones.map((ubicacion) => (
                                <option key={ubicacion.id} value={ubicacion.id}>
                                    {ubicacion.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Sede Destino */}
                    <div>
                        <label
                            htmlFor="sedeDestino"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                marginBottom: "6px",
                                fontWeight: "500",
                                fontSize: "14px",
                                color: "#495057",
                            }}
                        >
                            🎯 Sede Destino:
                        </label>
                        <select
                            id="sedeDestino"
                            name="sedeDestino"
                            value={filters.sedeDestino}
                            onChange={handleFilterChange}
                            disabled={isLoadingUbicaciones}
                            style={{
                                width: "100%",
                                padding: "12px 16px",
                                borderRadius: "8px",
                                border: "2px solid #e9ecef",
                                fontSize: "14px",
                                fontWeight: "500",
                                backgroundColor: isLoadingUbicaciones
                                    ? "#f8f9fa"
                                    : "#fff",
                                cursor: isLoadingUbicaciones
                                    ? "not-allowed"
                                    : "pointer",
                                transition: "all 0.2s ease",
                                outline: "none",
                                opacity: isLoadingUbicaciones ? 0.7 : 1,
                            }}
                            onFocus={(e) => {
                                if (!isLoadingUbicaciones) {
                                    e.target.style.borderColor = "#2c3e50";
                                    e.target.style.boxShadow =
                                        "0 0 0 3px rgba(44, 62, 80, 0.1)";
                                }
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = "#e9ecef";
                                e.target.style.boxShadow = "none";
                            }}
                        >
                            <option value="">
                                {isLoadingUbicaciones
                                    ? "Cargando sedes..."
                                    : "Todas las sedes"}
                            </option>
                            {ubicaciones.map((ubicacion) => (
                                <option key={ubicacion.id} value={ubicacion.id}>
                                    {ubicacion.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Tipo de Transferencia */}
                    <div>
                        <label
                            htmlFor="tipoTransferencia"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                marginBottom: "6px",
                                fontWeight: "500",
                                fontSize: "14px",
                                color: "#495057",
                            }}
                        >
                            🔄 Tipo de Transferencia:
                        </label>
                        <select
                            id="tipoTransferencia"
                            name="tipoTransferencia"
                            value={filters.tipoTransferencia}
                            onChange={handleFilterChange}
                            style={{
                                width: "100%",
                                padding: "12px 16px",
                                borderRadius: "8px",
                                border: "2px solid #e9ecef",
                                fontSize: "14px",
                                fontWeight: "500",
                                backgroundColor: "#fff",
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                outline: "none",
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = "#2c3e50";
                                e.target.style.boxShadow =
                                    "0 0 0 3px rgba(44, 62, 80, 0.1)";
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = "#e9ecef";
                                e.target.style.boxShadow = "none";
                            }}
                        >
                            <option value="">Todos los tipos</option>
                            <option value="pull">
                                Pull (Destino solicita a Origen)
                            </option>
                            <option value="push">
                                Push (Origen envía a Destino)
                            </option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Botones de acción */}
            <div
                style={{
                    display: "flex",
                    gap: "12px",
                    justifyContent: "flex-end",
                    paddingTop: "16px",
                    borderTop: "1px solid #e9ecef",
                }}
            >
                <button
                    onClick={clearFilters}
                    style={{
                        backgroundColor: "#f8f9fa",
                        color: "#6c757d",
                        border: "2px solid #e9ecef",
                        borderRadius: "8px",
                        padding: "10px 20px",
                        fontSize: "14px",
                        cursor: "pointer",
                        fontWeight: "500",
                        transition: "all 0.2s ease",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.backgroundColor = "#e9ecef";
                        e.target.style.borderColor = "#ced4da";
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.backgroundColor = "#f8f9fa";
                        e.target.style.borderColor = "#e9ecef";
                    }}
                >
                    🗑️ Limpiar Filtros
                </button>
                <button
                    onClick={applyFilters}
                    style={{
                        backgroundColor: "#2c3e50",
                        color: "white",
                        border: "2px solid #2c3e50",
                        borderRadius: "8px",
                        padding: "10px 20px",
                        fontSize: "14px",
                        cursor: "pointer",
                        fontWeight: "500",
                        transition: "all 0.2s ease",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.backgroundColor = "#34495e";
                        e.target.style.borderColor = "#34495e";
                        e.target.style.transform = "translateY(-1px)";
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.backgroundColor = "#2c3e50";
                        e.target.style.borderColor = "#2c3e50";
                        e.target.style.transform = "translateY(0)";
                    }}
                >
                    ✅ Aplicar Filtros
                </button>
            </div>
        </div>
    );
};

export default TransferFilters;
