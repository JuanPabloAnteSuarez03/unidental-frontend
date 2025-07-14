import React, { useEffect, useState, useRef } from "react";
import { getSales, getSalesInDateRange } from "../services/salesService";
import { getLocations } from "../services/inventoryService";
import { useAuth } from "../context/AuthContext";
import Pagination from "../components/Common/Pagination";

const PAGE_SIZE = 25;

// Constantes para cache persistente
const TOTAL_VENTAS_CACHE_STORAGE_KEY = "totalVentas_cache_data";
const TOTAL_VENTAS_CACHE_EXPIRY_TIME = 60 * 60 * 1000; // 60 minutos (1 hora) en milisegundos

const TotalVentasPage = () => {
    const { authToken } = useAuth();

    // Funciones de gestión de cache para localStorage
    const cargarCacheTotalVentasDesdeStorage = () => {
        try {
            const cacheData = localStorage.getItem(
                TOTAL_VENTAS_CACHE_STORAGE_KEY
            );
            if (cacheData) {
                const parsedData = JSON.parse(cacheData);
                const now = new Date().getTime();
                if (
                    parsedData.timestamp &&
                    now - parsedData.timestamp < TOTAL_VENTAS_CACHE_EXPIRY_TIME
                ) {
                    return parsedData;
                } else {
                    // Cache expirado, limpiar
                    localStorage.removeItem(TOTAL_VENTAS_CACHE_STORAGE_KEY);
                }
            }
        } catch (error) {
            console.error("Error cargando cache de total ventas:", error);
            localStorage.removeItem(TOTAL_VENTAS_CACHE_STORAGE_KEY);
        }
        return null;
    };

    const guardarCacheTotalVentasEnStorage = (allSales, locations) => {
        try {
            const cacheData = {
                allSales,
                locations,
                timestamp: new Date().getTime(),
            };
            localStorage.setItem(
                TOTAL_VENTAS_CACHE_STORAGE_KEY,
                JSON.stringify(cacheData)
            );
        } catch (error) {
            console.error("Error guardando cache de total ventas:", error);
        }
    };

    const limpiarCacheTotalVentasStorage = () => {
        try {
            localStorage.removeItem(TOTAL_VENTAS_CACHE_STORAGE_KEY);
        } catch (error) {
            console.error("Error limpiando cache de total ventas:", error);
        }
    };

    const obtenerInfoCacheTotalVentas = () => {
        const cacheData = cargarCacheTotalVentasDesdeStorage();
        if (cacheData) {
            const tiempoRestante =
                TOTAL_VENTAS_CACHE_EXPIRY_TIME -
                (new Date().getTime() - cacheData.timestamp);
            const minutosRestantes = Math.ceil(tiempoRestante / (60 * 1000));
            return {
                tieneCache: true,
                minutosRestantes: minutosRestantes > 0 ? minutosRestantes : 0,
                fechaCache: new Date(cacheData.timestamp),
            };
        }
        return { tieneCache: false };
    };

    // Estados principales con inicialización desde cache
    const cacheInicial = cargarCacheTotalVentasDesdeStorage();
    const [allSalesData, setAllSalesData] = useState(
        cacheInicial?.allSales || []
    );
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(!cacheInicial);
    const [error, setError] = useState(null);

    const [totalAmount, setTotalAmount] = useState(0);
    const [totalSales, setTotalSales] = useState(0);

    // Estados para paginación
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const dateFromRef = useRef();
    const dateToRef = useRef();

    const [locationList, setLocationList] = useState(
        cacheInicial?.locations || []
    );
    const [selectedLocation, setSelectedLocation] = useState("");

    // Función para cargar todos los datos desde API
    const cargarTodosLosDatosTotalVentas = async (forceRefresh = false) => {
        if (!authToken) return;

        // Si no es refresh forzado y tenemos cache válido, usar cache
        if (!forceRefresh) {
            const cacheData = cargarCacheTotalVentasDesdeStorage();
            if (cacheData) {
                setAllSalesData(cacheData.allSales);
                setLocationList(cacheData.locations);
                return;
            }
        }

        setLoading(true);
        setError(null);

        try {
            // Cargar sedes
            const locations = await getLocations(authToken);
            setLocationList(locations);

            // Cargar ventas (muchas páginas para tener datos suficientes)
            const allPages = [];
            let page = 1;
            let keepGoing = true;

            while (keepGoing && page <= 20) {
                // hasta 2000 ventas máx
                const salesData = await getSales(
                    { page, page_size: 100 },
                    authToken
                );
                const salesList = salesData.results || [];
                allPages.push(...salesList);
                if (!salesData.next || salesList.length === 0)
                    keepGoing = false;
                page++;
            }

            setAllSalesData(allPages);
            guardarCacheTotalVentasEnStorage(allPages, locations);
        } catch (err) {
            setError("Error al cargar las ventas");
            console.error("Error cargando datos total ventas:", err);
        } finally {
            setLoading(false);
        }
    };

    // Función para filtrar y paginar datos desde cache
    const filtrarYPaginarDatos = () => {
        let filtered = [...allSalesData];

        // Filtrar por fechas si hay filtros de fecha específicos
        if (dateFrom || dateTo) {
            filtered = filtered.filter((sale) => {
                if (!sale.sale_date) return false;
                const saleDate = new Date(sale.sale_date)
                    .toISOString()
                    .split("T")[0];

                if (dateFrom && saleDate < dateFrom) return false;
                if (dateTo && saleDate > dateTo) return false;
                return true;
            });
        }

        // Filtrar por sede
        if (selectedLocation) {
            filtered = filtered.filter(
                (sale) =>
                    sale.location_details &&
                    String(sale.location_details.id) ===
                        String(selectedLocation)
            );
        }

        // Configurar paginación
        setTotalCount(filtered.length);
        setTotalPages(Math.ceil(filtered.length / PAGE_SIZE) || 1);

        const start = (currentPage - 1) * PAGE_SIZE;
        const end = start + PAGE_SIZE;
        const pageSales = filtered.slice(start, end);

        setSales(pageSales);

        // Calcular totales de la página actual
        const total = pageSales.reduce(
            (sum, sale) => sum + (parseFloat(sale.total_net) || 0),
            0
        );
        setTotalAmount(total);
        setTotalSales(pageSales.length);
    };

    // Función para actualizar manualmente
    const actualizarDatosTotalVentas = () => {
        limpiarCacheTotalVentasStorage();
        setAllSalesData([]);
        cargarTodosLosDatosTotalVentas(true);
    };

    // Cargar datos al montar (solo si no hay cache)
    useEffect(() => {
        if (!cacheInicial) {
            cargarTodosLosDatosTotalVentas();
        }
    }, [authToken]);

    // Filtrar y paginar cuando cambien los filtros o la página
    useEffect(() => {
        if (allSalesData.length > 0) {
            filtrarYPaginarDatos();
        }
    }, [allSalesData, currentPage, dateFrom, dateTo, selectedLocation]);

    const formatCOP = (value) => {
        return new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
            minimumFractionDigits: 0,
        }).format(value);
    };

    return (
        <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
            {/* Banner Header */}
            <div
                style={{
                    background:
                        "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)",
                    borderRadius: "12px",
                    padding: "32px",
                    marginBottom: "24px",
                    boxShadow: "0 4px 16px rgba(44,62,80,0.15)",
                    border: "1px solid #2c3e50",
                    color: "white",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "24px",
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
                                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
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
                                Total de Ventas
                            </h1>
                            <p
                                style={{
                                    color: "rgba(255,255,255,0.8)",
                                    margin: "8px 0 0 0",
                                    fontSize: "16px",
                                    fontWeight: "500",
                                }}
                            >
                                Resumen general de todas las ventas realizadas
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contenido principal */}
            <div
                style={{
                    background: "#fff",
                    borderRadius: "12px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    padding: "24px",
                    marginBottom: "24px",
                }}
            >
                {loading ? (
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "40px",
                            color: "#6c757d",
                            fontSize: "16px",
                            fontWeight: "500",
                        }}
                    >
                        <div style={{ marginRight: "12px" }}>⏳</div>
                        Cargando datos de ventas...
                    </div>
                ) : error ? (
                    <div
                        style={{
                            background: "#f8d7da",
                            color: "#721c24",
                            padding: "16px",
                            borderRadius: "12px",
                            border: "1px solid #f5c6cb",
                            fontSize: "14px",
                            fontWeight: "500",
                            textAlign: "center",
                        }}
                    >
                        ❌ {error}
                    </div>
                ) : (
                    <div>
                        {/* Tarjetas de ventas totales */}
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns:
                                    "repeat(auto-fit, minmax(250px, 1fr))",
                                gap: "20px",
                                marginBottom: "32px",
                            }}
                        >
                            <div
                                style={{
                                    background:
                                        "linear-gradient(135deg, #28a745 0%, #20c997 100%)",
                                    color: "white",
                                    padding: "24px",
                                    borderRadius: "12px",
                                    boxShadow:
                                        "0 4px 12px rgba(40, 167, 69, 0.3)",
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: "14px",
                                        opacity: 0.9,
                                        marginBottom: "8px",
                                    }}
                                >
                                    Total de Ventas
                                </div>
                                <div
                                    style={{
                                        fontSize: "32px",
                                        fontWeight: "700",
                                    }}
                                >
                                    {totalSales.toLocaleString()}
                                </div>
                                <div
                                    style={{
                                        fontSize: "12px",
                                        opacity: 0.8,
                                        marginTop: "4px",
                                    }}
                                >
                                    ventas realizadas
                                </div>
                            </div>

                            <div
                                style={{
                                    background:
                                        "linear-gradient(135deg, #007bff 0%, #0056b3 100%)",
                                    color: "white",
                                    padding: "24px",
                                    borderRadius: "12px",
                                    boxShadow:
                                        "0 4px 12px rgba(0, 123, 255, 0.3)",
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: "14px",
                                        opacity: 0.9,
                                        marginBottom: "8px",
                                    }}
                                >
                                    Monto Total
                                </div>
                                <div
                                    style={{
                                        fontSize: "32px",
                                        fontWeight: "700",
                                    }}
                                >
                                    {formatCOP(totalAmount)}
                                </div>
                                <div
                                    style={{
                                        fontSize: "12px",
                                        opacity: 0.8,
                                        marginTop: "4px",
                                    }}
                                >
                                    valor total vendido
                                </div>
                            </div>

                            <div
                                style={{
                                    background:
                                        "linear-gradient(135deg, #ffc107 0%, #e0a800 100%)",
                                    color: "white",
                                    padding: "24px",
                                    borderRadius: "12px",
                                    boxShadow:
                                        "0 4px 12px rgba(255, 193, 7, 0.3)",
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: "14px",
                                        opacity: 0.9,
                                        marginBottom: "8px",
                                    }}
                                >
                                    Promedio por Venta
                                </div>
                                <div
                                    style={{
                                        fontSize: "32px",
                                        fontWeight: "700",
                                    }}
                                >
                                    {totalSales > 0
                                        ? formatCOP(totalAmount / totalSales)
                                        : formatCOP(0)}
                                </div>
                                <div
                                    style={{
                                        fontSize: "12px",
                                        opacity: 0.8,
                                        marginTop: "4px",
                                    }}
                                >
                                    promedio por transacción
                                </div>
                            </div>
                        </div>

                        {/* Filtros de fecha y sede mejorados visualmente */}
                        <div
                            style={{
                                display: "flex",
                                gap: "40px",
                                alignItems: "flex-end",
                                marginBottom: "28px",
                                background:
                                    "linear-gradient(90deg, #e3f2fd 0%, #f8f9fa 100%)",
                                padding: "20px 32px",
                                borderRadius: "14px",
                                border: "1.5px solid #bbdefb",
                                boxShadow: "0 2px 8px rgba(33, 150, 243, 0.07)",
                                position: "relative",
                                flexWrap: "wrap",
                            }}
                        >
                            {/* Desde */}
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "flex-start",
                                    gap: 6,
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: 18,
                                        color: "#1976d2",
                                        marginBottom: 2,
                                    }}
                                >
                                    📅
                                </span>
                                <label
                                    style={{
                                        fontWeight: 600,
                                        color: "#1976d2",
                                        fontSize: 15,
                                        marginBottom: 4,
                                    }}
                                >
                                    Desde
                                </label>
                                <input
                                    type="date"
                                    value={dateFrom}
                                    ref={dateFromRef}
                                    onChange={(e) => {
                                        setDateFrom(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    style={{
                                        padding: "8px 14px",
                                        border: "1.5px solid #90caf9",
                                        borderRadius: "6px",
                                        fontSize: "15px",
                                        color: "#1976d2",
                                        background: "#fff",
                                        outline: "none",
                                        boxShadow: dateFrom
                                            ? "0 0 0 2px #1976d222"
                                            : "none",
                                        transition:
                                            "box-shadow 0.2s, border-color 0.2s",
                                    }}
                                    max={dateTo || undefined}
                                />
                            </div>
                            {/* Hasta */}
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "flex-start",
                                    gap: 6,
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: 18,
                                        color: "#1976d2",
                                        marginBottom: 2,
                                    }}
                                >
                                    📅
                                </span>
                                <label
                                    style={{
                                        fontWeight: 600,
                                        color: "#1976d2",
                                        fontSize: 15,
                                        marginBottom: 4,
                                    }}
                                >
                                    Hasta
                                </label>
                                <input
                                    type="date"
                                    value={dateTo}
                                    ref={dateToRef}
                                    onChange={(e) => {
                                        setDateTo(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    style={{
                                        padding: "8px 14px",
                                        border: "1.5px solid #90caf9",
                                        borderRadius: "6px",
                                        fontSize: "15px",
                                        color: "#1976d2",
                                        background: "#fff",
                                        outline: "none",
                                        boxShadow: dateTo
                                            ? "0 0 0 2px #1976d222"
                                            : "none",
                                        transition:
                                            "box-shadow 0.2s, border-color 0.2s",
                                    }}
                                    min={dateFrom || undefined}
                                />
                            </div>
                            {/* Sede */}
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "flex-start",
                                    gap: 6,
                                    minWidth: 200,
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: 18,
                                        color: "#1976d2",
                                        marginBottom: 2,
                                    }}
                                >
                                    🏢
                                </span>
                                <label
                                    htmlFor="location-select"
                                    style={{
                                        fontWeight: 600,
                                        color: "#1976d2",
                                        fontSize: 15,
                                        marginBottom: 4,
                                    }}
                                >
                                    Sede
                                </label>
                                <select
                                    id="location-select"
                                    value={selectedLocation}
                                    onChange={(e) => {
                                        setSelectedLocation(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    style={{
                                        padding: "8px 16px",
                                        border: "1.5px solid #90caf9",
                                        borderRadius: "6px",
                                        fontSize: "15px",
                                        color: "#1976d2",
                                        background: "#fff",
                                        outline: "none",
                                        minWidth: 180,
                                        boxShadow: selectedLocation
                                            ? "0 0 0 2px #1976d222"
                                            : "none",
                                        transition:
                                            "box-shadow 0.2s, border-color 0.2s",
                                        cursor: "pointer",
                                    }}
                                >
                                    <option value="">Todas las sedes</option>
                                    {locationList.map((loc) => (
                                        <option key={loc.id} value={loc.id}>
                                            {loc.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {/* Limpiar filtro */}
                            {(dateFrom || dateTo || selectedLocation) && (
                                <button
                                    onClick={() => {
                                        setDateFrom("");
                                        setDateTo("");
                                        setSelectedLocation("");
                                        setCurrentPage(1);
                                    }}
                                    style={{
                                        marginLeft: 24,
                                        padding: "8px 22px",
                                        background:
                                            "linear-gradient(90deg, #e57373 0%, #f06292 100%)",
                                        border: "none",
                                        borderRadius: "6px",
                                        color: "#fff",
                                        fontWeight: 700,
                                        fontSize: "15px",
                                        boxShadow:
                                            "0 2px 8px rgba(244, 67, 54, 0.08)",
                                        cursor: "pointer",
                                        transition:
                                            "background 0.2s, box-shadow 0.2s",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                    }}
                                >
                                    <span style={{ fontSize: 18 }}>✖️</span>{" "}
                                    Limpiar filtro
                                </button>
                            )}
                        </div>

                        {/* Tabla de ventas */}
                        <div
                            style={{
                                background: "#f8f9fa",
                                borderRadius: "12px",
                                overflow: "hidden",
                                border: "1px solid #dee2e6",
                            }}
                        >
                            <div style={{ overflowX: "auto" }}>
                                <table
                                    style={{
                                        width: "100%",
                                        borderCollapse: "collapse",
                                        fontSize: "14px",
                                    }}
                                >
                                    <thead>
                                        <tr
                                            style={{
                                                background: "#e9ecef",
                                            }}
                                        >
                                            <th
                                                style={{
                                                    padding: "16px 12px",
                                                    textAlign: "left",
                                                    color: "#495057",
                                                    fontWeight: "700",
                                                    fontSize: "13px",
                                                    textTransform: "uppercase",
                                                    letterSpacing: "0.5px",
                                                    borderBottom:
                                                        "2px solid #dee2e6",
                                                }}
                                            >
                                                ID
                                            </th>
                                            <th
                                                style={{
                                                    padding: "16px 12px",
                                                    textAlign: "left",
                                                    color: "#495057",
                                                    fontWeight: "700",
                                                    fontSize: "13px",
                                                    textTransform: "uppercase",
                                                    letterSpacing: "0.5px",
                                                    borderBottom:
                                                        "2px solid #dee2e6",
                                                }}
                                            >
                                                Cliente
                                            </th>
                                            <th
                                                style={{
                                                    padding: "16px 12px",
                                                    textAlign: "left",
                                                    color: "#495057",
                                                    fontWeight: "700",
                                                    fontSize: "13px",
                                                    textTransform: "uppercase",
                                                    letterSpacing: "0.5px",
                                                    borderBottom:
                                                        "2px solid #dee2e6",
                                                }}
                                            >
                                                Sede
                                            </th>
                                            <th
                                                style={{
                                                    padding: "16px 12px",
                                                    textAlign: "left",
                                                    color: "#495057",
                                                    fontWeight: "700",
                                                    fontSize: "13px",
                                                    textTransform: "uppercase",
                                                    letterSpacing: "0.5px",
                                                    borderBottom:
                                                        "2px solid #dee2e6",
                                                }}
                                            >
                                                Fecha
                                            </th>
                                            <th
                                                style={{
                                                    padding: "16px 12px",
                                                    textAlign: "left",
                                                    color: "#495057",
                                                    fontWeight: "700",
                                                    fontSize: "13px",
                                                    textTransform: "uppercase",
                                                    letterSpacing: "0.5px",
                                                    borderBottom:
                                                        "2px solid #dee2e6",
                                                }}
                                            >
                                                Monto
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sales.map((sale, index) => (
                                            <tr
                                                key={sale.id}
                                                style={{
                                                    background:
                                                        index % 2 === 0
                                                            ? "#ffffff"
                                                            : "#f8f9fa",
                                                    transition: "all 0.2s ease",
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.target.parentElement.style.background =
                                                        "#e3f2fd";
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.target.parentElement.style.background =
                                                        index % 2 === 0
                                                            ? "#ffffff"
                                                            : "#f8f9fa";
                                                }}
                                            >
                                                <td
                                                    style={{
                                                        padding: "14px 12px",
                                                        color: "#495057",
                                                        fontWeight: "600",
                                                        borderBottom:
                                                            "1px solid #dee2e6",
                                                    }}
                                                >
                                                    #{sale.id}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "14px 12px",
                                                        color: "#495057",
                                                        fontWeight: "500",
                                                        borderBottom:
                                                            "1px solid #dee2e6",
                                                    }}
                                                >
                                                    {sale.customer_details
                                                        ?.name ||
                                                        "Cliente no especificado"}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "14px 12px",
                                                        color: "#495057",
                                                        fontWeight: "500",
                                                        borderBottom:
                                                            "1px solid #dee2e6",
                                                    }}
                                                >
                                                    {sale.location_details
                                                        ?.name ||
                                                        "Sede no especificada"}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "14px 12px",
                                                        color: "#6c757d",
                                                        fontWeight: "500",
                                                        borderBottom:
                                                            "1px solid #dee2e6",
                                                    }}
                                                >
                                                    {sale.sale_date
                                                        ? new Date(
                                                              sale.sale_date
                                                          ).toLocaleDateString(
                                                              "es-CO",
                                                              {
                                                                  year: "numeric",
                                                                  month: "short",
                                                                  day: "numeric",
                                                                  hour: "2-digit",
                                                                  minute: "2-digit",
                                                              }
                                                          )
                                                        : "-"}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "14px 12px",
                                                        color: "#28a745",
                                                        fontWeight: "700",
                                                        borderBottom:
                                                            "1px solid #dee2e6",
                                                    }}
                                                >
                                                    {formatCOP(
                                                        sale.total_net || 0
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        {/* Paginador */}
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                            totalCount={totalCount}
                            itemsPerPage={PAGE_SIZE}
                            label="ventas"
                            showGoTo={true}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default TotalVentasPage;
