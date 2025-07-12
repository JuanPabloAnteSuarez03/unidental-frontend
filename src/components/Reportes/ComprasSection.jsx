import React, { useState, useEffect } from "react";
import { useReportes } from "../../context/ReportesContext";
import { useAuth } from "../../context/AuthContext";
import inventoryService from "../../services/inventoryService";
import ReportesFilters from "./ReportesFilters";
import ReportesTable from "./ReportesTable";
import ReportesInfo from "./ReportesInfo";

const ComprasSection = () => {
    const {
        purchasesCache,
        isLoadingPurchases,
        purchasesError,
        loadPurchasesData,
        getPurchasesCacheInfo,
    } = useReportes();

    const { authToken } = useAuth();

    // Función para obtener la fecha actual en formato YYYY-MM-DD
    const getCurrentDate = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        const currentDate = `${year}-${month}-${day}`;
        console.log("📅 Fecha actual generada:", currentDate);
        return currentDate;
    };

    // Función para debuggear fechas
    const debugDate = (dateString, label = "Fecha") => {
        if (!dateString) {
            console.log(`🔍 ${label}: null/undefined`);
            return;
        }

        try {
            const date = new Date(dateString);
            const utcString = date.toISOString();
            const localString = date.toLocaleDateString();
            const utcDateOnly = utcString.split("T")[0];
            const localDateOnly = `${date.getFullYear()}-${String(
                date.getMonth() + 1
            ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

            console.log(`🔍 ${label}:`, {
                original: dateString,
                utc: utcString,
                local: localString,
                utcDateOnly,
                localDateOnly,
                timestamp: date.getTime(),
            });
        } catch (error) {
            console.error(`❌ Error debuggeando ${label}:`, dateString, error);
        }
    };

    const [filteredData, setFilteredData] = useState([]);
    const [selectedDate, setSelectedDate] = useState(() => {
        // Establecer la fecha actual por defecto
        return getCurrentDate();
    });
    const [appliedDate, setAppliedDate] = useState(() => {
        // Fecha aplicada (inicialmente la fecha actual)
        return getCurrentDate();
    });
    const [filters, setFilters] = useState({
        type: "purchase",
        startDate: "",
        endDate: "",
        sede: "all", // Nuevo filtro por sede
        supplier: "all", // Nuevo filtro por proveedor
    });

    // Estados para ubicaciones
    const [locations, setLocations] = useState([]);
    const [isLoadingLocations, setIsLoadingLocations] = useState(false);

    // Estados para proveedores
    const [suppliers, setSuppliers] = useState([]);
    const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(false);

    // Cargar ubicaciones al montar el componente
    useEffect(() => {
        const loadLocations = async () => {
            if (!authToken) return;

            setIsLoadingLocations(true);
            try {
                const data = await inventoryService.getLocations(authToken);
                // Filtrar solo sedes (type: "sede") si aplica
                const sedes = Array.isArray(data)
                    ? data.filter((loc) => loc.type === "sede")
                    : data || [];
                setLocations(sedes);
                console.log("📍 Ubicaciones cargadas:", sedes);
            } catch (error) {
                console.error("❌ Error al cargar ubicaciones:", error);
                setLocations([]);
            } finally {
                setIsLoadingLocations(false);
            }
        };

        loadLocations();
    }, [authToken]);

    // Cargar proveedores al montar el componente
    useEffect(() => {
        const loadSuppliers = async () => {
            if (!authToken) return;

            setIsLoadingSuppliers(true);
            try {
                // Importar el servicio de proveedores dinámicamente
                const { getAllSuppliers } = await import(
                    "../../services/suppliersService"
                );
                const data = await getAllSuppliers(authToken);
                setSuppliers(data || []);
                console.log("🏢 Proveedores cargados:", data);
            } catch (error) {
                console.error("❌ Error al cargar proveedores:", error);
                setSuppliers([]);
            } finally {
                setIsLoadingSuppliers(false);
            }
        };

        loadSuppliers();
    }, [authToken]);

    // Cargar datos de compras del día actual al montar el componente
    useEffect(() => {
        // Solo cargar si no hay datos en caché
        if (purchasesCache.length === 0) {
            const today = getCurrentDate();
            console.log("🔄 Cargando compras del día actual:", today);

            const params = {
                order_date_from: today,
                order_date_to: today,
            };

            loadPurchasesData(false, params);
        } else {
            console.log("📦 Usando datos de compras del caché");
            // Debuggear las fechas de los datos en caché
            purchasesCache.forEach((item, index) => {
                debugDate(item.date, `Compra ${item.id} - date`);
                debugDate(item.order_date, `Compra ${item.id} - order_date`);
                debugDate(item.created_at, `Compra ${item.id} - created_at`);
            });
        }
    }, []); // Solo ejecutar al montar el componente

    // Efecto para recargar datos cuando cambian los filtros de rango de fechas
    useEffect(() => {
        // Solo recargar si hay filtros de rango de fechas activos
        if (filters.startDate || filters.endDate) {
            const params = {};

            if (filters.startDate) {
                params.order_date_from = filters.startDate;
            }
            if (filters.endDate) {
                params.order_date_to = filters.endDate;
            }

            console.log("📋 Recargando compras con filtros de rango:", params);
            loadPurchasesData(true, params);
        }
    }, [filters.startDate, filters.endDate]); // Remover loadPurchasesData de las dependencias

    // Aplicar filtros adicionales (sede y proveedor)
    useEffect(() => {
        if (purchasesCache.length === 0) {
            setFilteredData([]);
            return;
        }

        console.log(`🔄 Aplicando filtros adicionales - Filtros:`, filters);
        console.log(
            `📅 Datos de compras disponibles:`,
            purchasesCache.map((item) => ({
                id: item.id,
                date: item.date,
                order_date: item.order_date,
                created_at: item.created_at,
            }))
        );

        let filtered = [...purchasesCache];

        // 1. Filtro por tipo (solo compras por ahora)
        if (filters.type !== "purchase" && filters.type !== "all") {
            filtered = [];
        }

        // 2. Filtro por sede
        if (filters.sede && filters.sede !== "all") {
            filtered = filtered.filter((item) => {
                // Buscar en destination_name o en rawData.destination_details.name
                const destinationName =
                    item.destination_name ||
                    item.rawData?.destination_details?.name ||
                    item.destination ||
                    "";

                return (
                    destinationName
                        .toLowerCase()
                        .includes(filters.sede.toLowerCase()) ||
                    destinationName === filters.sede
                );
            });
            console.log(
                `✅ Compras filtradas por sede "${filters.sede}": ${filtered.length}`
            );
        }

        // 3. Filtro por proveedor
        if (filters.supplier && filters.supplier !== "all") {
            filtered = filtered.filter((item) => {
                // Buscar en supplier_name o en rawData.supplier_details.name
                const supplierName =
                    item.supplier_name ||
                    item.rawData?.supplier_details?.name ||
                    item.supplier ||
                    "";

                return (
                    supplierName
                        .toLowerCase()
                        .includes(filters.supplier.toLowerCase()) ||
                    supplierName === filters.supplier
                );
            });
            console.log(
                `✅ Compras filtradas por proveedor "${filters.supplier}": ${filtered.length}`
            );
        }

        console.log(
            `✅ Compras finales después de todos los filtros: ${filtered.length}`
        );
        setFilteredData(filtered);
    }, [purchasesCache, filters]);

    // Calcular estadísticas
    const stats = {
        totalPurchases: filteredData.length,
        totalSpent: filteredData.reduce(
            (sum, item) => sum + (item.total || 0),
            0
        ),
        averagePurchase:
            filteredData.length > 0
                ? filteredData.reduce(
                      (sum, item) => sum + (item.total || 0),
                      0
                  ) / filteredData.length
                : 0,
        uniqueSuppliers: new Set(filteredData.map((item) => item.supplier_name))
            .size,
    };

    // Manejar cambio de fecha en el input
    const handleDateChange = (e) => {
        const newDate = e.target.value;
        setSelectedDate(newDate);
    };

    // Aplicar el filtro de fecha
    const handleApplyDate = () => {
        console.log(`🔄 Aplicando filtro de fecha: ${selectedDate}`);
        setAppliedDate(selectedDate);

        // Recargar datos con filtro de fecha específica
        const params = {
            order_date_from: selectedDate,
            order_date_to: selectedDate,
        };
        console.log("📋 Recargando compras con parámetros:", params);
        loadPurchasesData(true, params);
    };

    // Función para limpiar todos los filtros
    const handleClearFilters = () => {
        const today = getCurrentDate();
        setSelectedDate(today);
        setAppliedDate(today);
        setFilters({
            type: "purchase",
            startDate: "",
            endDate: "",
            sede: "all", // Limpiar también el filtro de sede
            supplier: "all", // Limpiar también el filtro de proveedor
        });
        console.log("🧹 Filtros limpiados - volviendo a fecha actual");

        // Recargar datos del día actual
        const params = {
            order_date_from: today,
            order_date_to: today,
        };
        loadPurchasesData(true, params);
    };

    // Función para mostrar la fecha corregida (un día más) como en TotalVentasPage
    const getDisplayDate = (dateString) => {
        const date = new Date(dateString);
        date.setDate(date.getDate() + 1);
        return date;
    };

    return (
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: 24 }}>
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
                Reporte de Compras
            </h1>

            <p
                style={{
                    textAlign: "center",
                    color: "#666",
                    fontSize: "16px",
                    margin: "0 0 40px 0",
                }}
            >
                Análisis detallado de todas las órdenes de compra del sistema
            </p>

            {/* Información - Estadísticas */}
            <ReportesInfo stats={stats} />

            {/* Filtros */}
            <div
                style={{
                    padding: "24px",
                    background:
                        "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
                    borderRadius: "16px",
                    marginBottom: "24px",
                    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
                    color: "#495057",
                    border: "1px solid #dee2e6",
                }}
            >
                <h3
                    style={{
                        margin: "0 0 20px 0",
                        color: "#2c3e50",
                        fontSize: "20px",
                        fontWeight: "700",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                    }}
                >
                    🔍 Filtros de Búsqueda
                </h3>
                <div
                    style={{
                        display: "flex",
                        gap: 16,
                        alignItems: "flex-end",
                        flexWrap: "wrap",
                    }}
                >
                    {/* Filtro de fecha específica */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 6,
                            minWidth: "280px",
                        }}
                    >
                        <label
                            style={{
                                fontWeight: "600",
                                color: "#495057",
                                fontSize: "14px",
                            }}
                        >
                            Fecha Específica
                        </label>
                        <div style={{ display: "flex", gap: 8 }}>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) =>
                                    setSelectedDate(e.target.value)
                                }
                                disabled={filters.startDate || filters.endDate}
                                style={{
                                    padding: "12px 16px",
                                    border: "1px solid #ced4da",
                                    borderRadius: "8px",
                                    fontSize: "14px",
                                    backgroundColor: "white",
                                    color: "#2c3e50",
                                    fontWeight: "500",
                                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                                    transition: "all 0.2s ease",
                                    flex: 1,
                                    minWidth: "140px",
                                    opacity:
                                        filters.startDate || filters.endDate
                                            ? 0.7
                                            : 1,
                                }}
                                onFocus={(e) => {
                                    if (
                                        !(filters.startDate || filters.endDate)
                                    ) {
                                        e.target.style.borderColor = "#6c757d";
                                        e.target.style.boxShadow =
                                            "0 2px 8px rgba(0, 0, 0, 0.1)";
                                    }
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = "#ced4da";
                                    e.target.style.boxShadow =
                                        "0 2px 4px rgba(0, 0, 0, 0.05)";
                                }}
                            />
                            <button
                                onClick={handleApplyDate}
                                disabled={filters.startDate || filters.endDate}
                                style={{
                                    padding: "12px 16px",
                                    background: "#007bff",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    whiteSpace: "nowrap",
                                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                                    transition: "all 0.2s ease",
                                    opacity:
                                        filters.startDate || filters.endDate
                                            ? 0.7
                                            : 1,
                                }}
                                onMouseOver={(e) => {
                                    if (
                                        !(filters.startDate || filters.endDate)
                                    ) {
                                        e.target.style.backgroundColor =
                                            "#0056b3";
                                        e.target.style.boxShadow =
                                            "0 2px 8px rgba(0, 0, 0, 0.15)";
                                    }
                                }}
                                onMouseOut={(e) => {
                                    e.target.style.backgroundColor = "#007bff";
                                    e.target.style.boxShadow =
                                        "0 2px 4px rgba(0, 0, 0, 0.1)";
                                }}
                            >
                                Aplicar
                            </button>
                        </div>
                    </div>

                    {/* Filtro por sede */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 6,
                            minWidth: "200px",
                        }}
                    >
                        <label
                            style={{
                                fontWeight: "600",
                                color: "#495057",
                                fontSize: "14px",
                            }}
                        >
                            🏢 Sede
                        </label>
                        <select
                            value={filters.sede}
                            onChange={(e) =>
                                setFilters((prev) => ({
                                    ...prev,
                                    sede: e.target.value,
                                }))
                            }
                            style={{
                                padding: "12px 16px",
                                border: "1px solid #ced4da",
                                borderRadius: "8px",
                                fontSize: "14px",
                                backgroundColor: "white",
                                color: "#2c3e50",
                                fontWeight: "500",
                                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                                transition: "all 0.2s ease",
                                cursor: "pointer",
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = "#6c757d";
                                e.target.style.boxShadow =
                                    "0 2px 8px rgba(0, 0, 0, 0.1)";
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = "#ced4da";
                                e.target.style.boxShadow =
                                    "0 2px 4px rgba(0, 0, 0, 0.05)";
                            }}
                        >
                            <option value="all">Todas las sedes</option>
                            {isLoadingLocations ? (
                                <option value="" disabled>
                                    Cargando sedes...
                                </option>
                            ) : (
                                locations.map((location) => (
                                    <option
                                        key={location.id}
                                        value={location.name}
                                    >
                                        {location.name}
                                    </option>
                                ))
                            )}
                        </select>
                    </div>

                    {/* Filtro por proveedor */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 6,
                            minWidth: "200px",
                        }}
                    >
                        <label
                            style={{
                                fontWeight: "600",
                                color: "#495057",
                                fontSize: "14px",
                            }}
                        >
                            🏢 Proveedor
                        </label>
                        <select
                            value={filters.supplier}
                            onChange={(e) =>
                                setFilters((prev) => ({
                                    ...prev,
                                    supplier: e.target.value,
                                }))
                            }
                            style={{
                                padding: "12px 16px",
                                border: "1px solid #ced4da",
                                borderRadius: "8px",
                                fontSize: "14px",
                                backgroundColor: "white",
                                color: "#2c3e50",
                                fontWeight: "500",
                                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                                transition: "all 0.2s ease",
                                cursor: "pointer",
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = "#6c757d";
                                e.target.style.boxShadow =
                                    "0 2px 8px rgba(0, 0, 0, 0.1)";
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = "#ced4da";
                                e.target.style.boxShadow =
                                    "0 2px 4px rgba(0, 0, 0, 0.05)";
                            }}
                        >
                            <option value="all">Todos los proveedores</option>
                            {isLoadingSuppliers ? (
                                <option value="" disabled>
                                    Cargando proveedores...
                                </option>
                            ) : (
                                suppliers.map((supplier) => (
                                    <option
                                        key={supplier.id}
                                        value={supplier.name}
                                    >
                                        {supplier.name}
                                    </option>
                                ))
                            )}
                        </select>
                    </div>

                    {/* Filtro de rango de fechas */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 6,
                            minWidth: "320px",
                        }}
                    >
                        <label
                            style={{
                                fontWeight: "600",
                                color: "#495057",
                                fontSize: "14px",
                            }}
                        >
                            Rango de Fechas
                        </label>
                        <div style={{ display: "flex", gap: 40 }}>
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 4,
                                    flex: 1,
                                    minWidth: "140px",
                                }}
                            >
                                <label
                                    style={{
                                        fontSize: "12px",
                                        color: "#6c757d",
                                    }}
                                >
                                    Desde
                                </label>
                                <input
                                    type="date"
                                    value={filters.startDate}
                                    onChange={(e) =>
                                        setFilters((prev) => ({
                                            ...prev,
                                            startDate: e.target.value,
                                        }))
                                    }
                                    style={{
                                        padding: "12px 16px",
                                        border: "1px solid #ced4da",
                                        borderRadius: "8px",
                                        fontSize: "14px",
                                        backgroundColor: "white",
                                        color: "#2c3e50",
                                        fontWeight: "500",
                                        boxShadow:
                                            "0 2px 4px rgba(0, 0, 0, 0.05)",
                                        transition: "all 0.2s ease",
                                        width: "100%",
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = "#6c757d";
                                        e.target.style.boxShadow =
                                            "0 2px 8px rgba(0, 0, 0, 0.1)";
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = "#ced4da";
                                        e.target.style.boxShadow =
                                            "0 2px 4px rgba(0, 0, 0, 0.05)";
                                    }}
                                />
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 4,
                                    flex: 1,
                                    minWidth: "140px",
                                }}
                            >
                                <label
                                    style={{
                                        fontSize: "12px",
                                        color: "#6c757d",
                                    }}
                                >
                                    Hasta
                                </label>
                                <input
                                    type="date"
                                    value={filters.endDate}
                                    onChange={(e) =>
                                        setFilters((prev) => ({
                                            ...prev,
                                            endDate: e.target.value,
                                        }))
                                    }
                                    style={{
                                        padding: "12px 16px",
                                        border: "1px solid #ced4da",
                                        borderRadius: "8px",
                                        fontSize: "14px",
                                        backgroundColor: "white",
                                        color: "#2c3e50",
                                        fontWeight: "500",
                                        boxShadow:
                                            "0 2px 4px rgba(0, 0, 0, 0.05)",
                                        transition: "all 0.2s ease",
                                        width: "100%",
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = "#6c757d";
                                        e.target.style.boxShadow =
                                            "0 2px 8px rgba(0, 0, 0, 0.1)";
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = "#ced4da";
                                        e.target.style.boxShadow =
                                            "0 2px 4px rgba(0, 0, 0, 0.05)";
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Botón para limpiar filtros - Movido más a la derecha */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 6,
                            marginLeft: "auto", // Empuja el botón hacia la derecha
                        }}
                    >
                        <label
                            style={{
                                fontWeight: "600",
                                color: "#495057",
                                fontSize: "14px",
                                opacity: 0, // Invisible label para alineación
                            }}
                        >
                            Acciones
                        </label>
                        <button
                            onClick={handleClearFilters}
                            style={{
                                padding: "12px 16px",
                                background: "#dc3545",
                                color: "white",
                                border: "none",
                                borderRadius: "8px",
                                cursor: "pointer",
                                fontSize: "14px",
                                fontWeight: "600",
                                whiteSpace: "nowrap",
                                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                                transition: "all 0.2s ease",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                            }}
                            onMouseOver={(e) => {
                                e.target.style.backgroundColor = "#c82333";
                                e.target.style.boxShadow =
                                    "0 2px 8px rgba(0, 0, 0, 0.15)";
                            }}
                            onMouseOut={(e) => {
                                e.target.style.backgroundColor = "#dc3545";
                                e.target.style.boxShadow =
                                    "0 2px 4px rgba(0, 0, 0, 0.1)";
                            }}
                        >
                            🧹 Limpiar Filtros
                        </button>
                    </div>
                </div>

                {/* Mensaje de filtro activo */}
                {(filters.startDate ||
                    filters.endDate ||
                    filters.sede !== "all" ||
                    filters.supplier !== "all") && (
                    <div
                        style={{
                            marginTop: 16,
                            padding: "12px 16px",
                            backgroundColor: "#e3f2fd",
                            borderRadius: "8px",
                            fontSize: "14px",
                            color: "#1976d2",
                            border: "1px solid #bbdefb",
                        }}
                    >
                        🔍 <strong>Filtros activos:</strong>
                        {filters.startDate || filters.endDate ? (
                            <span>
                                {" "}
                                📅 Rango: {filters.startDate ||
                                    "sin límite"} -{" "}
                                {filters.endDate || "sin límite"}
                            </span>
                        ) : null}
                        {filters.sede !== "all" ? (
                            <span> 🏢 Sede: {filters.sede}</span>
                        ) : null}
                        {filters.supplier !== "all" ? (
                            <span> 📦 Proveedor: {filters.supplier}</span>
                        ) : null}
                    </div>
                )}
            </div>

            {/* Tabla */}
            <ReportesTable
                filteredData={filteredData}
                isLoading={isLoadingPurchases}
                error={purchasesError}
                onRefresh={() => {
                    const today = getCurrentDate();
                    const params = {
                        order_date_from: today,
                        order_date_to: today,
                    };
                    loadPurchasesData(true, params);
                }}
            />
        </div>
    );
};

export default ComprasSection;
