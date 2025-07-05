import React, { useEffect, useState } from "react";
import { getSales } from "../services/salesService";
import { useAuth } from "../context/AuthContext";

const TotalVentasPage = () => {
    const { authToken } = useAuth();
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Estado para el filtro de fecha
    const [selectedDate, setSelectedDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split("T")[0]; // Formato YYYY-MM-DD
    });

    // Filtrar ventas del día seleccionado
    const todaySales = sales.filter((sale) => {
        if (!sale.sale_date) return false;
        const saleDate = new Date(sale.sale_date);
        const selectedDateObj = new Date(selectedDate + "T00:00:00");

        // Comparar strings de fecha local (más robusto para zonas horarias)
        const saleDateString = saleDate.toLocaleDateString("en-CA"); // formato YYYY-MM-DD
        const selectedDateString = selectedDateObj.toLocaleDateString("en-CA");

        return saleDateString === selectedDateString;
    });

    // Calcular totales del día seleccionado
    const dailyAmount = todaySales.reduce(
        (sum, sale) => sum + (parseFloat(sale.total_net) || 0),
        0
    );
    const dailySales = todaySales.length;

    // Función para mostrar la fecha corregida (un día más)
    const getDisplayDate = (dateString) => {
        const date = new Date(dateString);
        date.setDate(date.getDate() + 1);
        return date;
    };
    const [totalAmount, setTotalAmount] = useState(0);
    const [totalSales, setTotalSales] = useState(0);
    const [section, setSection] = useState("dia"); // "dia" o "total"

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const salesData = await getSales({}, authToken);
                const salesList = salesData.results || salesData || [];
                setSales(salesList);

                // Calcular totales generales
                const total = salesList.reduce((sum, sale) => {
                    return sum + (parseFloat(sale.total_net) || 0);
                }, 0);
                setTotalAmount(total);
                setTotalSales(salesList.length);
            } catch (err) {
                setError("Error al cargar las ventas");
            } finally {
                setLoading(false);
            }
        };
        if (authToken) fetchData();
    }, [authToken]);

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

            {/* Selector de secciones */}
            <div style={{ marginBottom: 24, display: "flex", gap: 12 }}>
                <button
                    onClick={() => setSection("dia")}
                    style={{
                        padding: "12px 24px",
                        borderRadius: 8,
                        border: "1px solid #1976d2",
                        background: section === "dia" ? "#1976d2" : "#f5f5f5",
                        color: section === "dia" ? "white" : "#1976d2",
                        fontWeight: "600",
                        fontSize: "14px",
                        cursor: section === "dia" ? "default" : "pointer",
                        boxShadow:
                            section === "dia" ? "0 2px 8px #1976d233" : "none",
                        transition: "all 0.2s ease",
                        minWidth: "120px",
                    }}
                    onMouseEnter={(e) => {
                        if (section !== "dia") {
                            e.target.style.background = "#e3f2fd";
                            e.target.style.borderColor = "#1976d2";
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (section !== "dia") {
                            e.target.style.background = "#f5f5f5";
                            e.target.style.borderColor = "#1976d2";
                        }
                    }}
                >
                    📅 Ventas del Día
                </button>
                <button
                    onClick={() => setSection("total")}
                    style={{
                        padding: "12px 24px",
                        borderRadius: 8,
                        border: "1px solid #1976d2",
                        background: section === "total" ? "#1976d2" : "#f5f5f5",
                        color: section === "total" ? "white" : "#1976d2",
                        fontWeight: "600",
                        fontSize: "14px",
                        cursor: section === "total" ? "default" : "pointer",
                        boxShadow:
                            section === "total"
                                ? "0 2px 8px #1976d233"
                                : "none",
                        transition: "all 0.2s ease",
                        minWidth: "120px",
                    }}
                    onMouseEnter={(e) => {
                        if (section !== "total") {
                            e.target.style.background = "#e3f2fd";
                            e.target.style.borderColor = "#1976d2";
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (section !== "total") {
                            e.target.style.background = "#f5f5f5";
                            e.target.style.borderColor = "#1976d2";
                        }
                    }}
                >
                    📊 Ventas Totales
                </button>
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
                ) : section === "dia" ? (
                    <div>
                        {/* Tarjetas de resumen */}
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
                                    Ventas del Día
                                </div>
                                <div
                                    style={{
                                        fontSize: "32px",
                                        fontWeight: "700",
                                    }}
                                >
                                    {dailySales}
                                </div>
                                <div
                                    style={{
                                        fontSize: "12px",
                                        opacity: 0.8,
                                        marginTop: "4px",
                                    }}
                                >
                                    ventas realizadas hoy
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
                                    Monto del Día
                                </div>
                                <div
                                    style={{
                                        fontSize: "32px",
                                        fontWeight: "700",
                                    }}
                                >
                                    {formatCOP(dailyAmount)}
                                </div>
                                <div
                                    style={{
                                        fontSize: "12px",
                                        opacity: 0.8,
                                        marginTop: "4px",
                                    }}
                                >
                                    valor vendido hoy
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
                                    Promedio del Día
                                </div>
                                <div
                                    style={{
                                        fontSize: "32px",
                                        fontWeight: "700",
                                    }}
                                >
                                    {dailySales > 0
                                        ? formatCOP(dailyAmount / dailySales)
                                        : formatCOP(0)}
                                </div>
                                <div
                                    style={{
                                        fontSize: "12px",
                                        opacity: 0.8,
                                        marginTop: "4px",
                                    }}
                                >
                                    promedio por venta hoy
                                </div>
                            </div>
                        </div>

                        {/* Filtro de fecha */}
                        <div
                            style={{
                                background: "#f8f9fa",
                                padding: "20px",
                                borderRadius: "12px",
                                border: "1px solid #e9ecef",
                                marginBottom: "24px",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "16px",
                                    flexWrap: "wrap",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: "16px",
                                            color: "#495057",
                                            fontWeight: "600",
                                        }}
                                    >
                                        📅
                                    </span>
                                    <label
                                        htmlFor="date-filter"
                                        style={{
                                            fontSize: "14px",
                                            fontWeight: "600",
                                            color: "#495057",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        Seleccionar fecha:
                                    </label>
                                </div>
                                <input
                                    id="date-filter"
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) =>
                                        setSelectedDate(e.target.value)
                                    }
                                    style={{
                                        padding: "10px 16px",
                                        borderRadius: "8px",
                                        border: "2px solid #dee2e6",
                                        fontSize: "14px",
                                        fontWeight: "500",
                                        color: "#495057",
                                        background: "#fff",
                                        cursor: "pointer",
                                        transition: "all 0.2s ease",
                                        minWidth: "180px",
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = "#1976d2";
                                        e.target.style.boxShadow =
                                            "0 0 0 3px rgba(25, 118, 210, 0.1)";
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = "#dee2e6";
                                        e.target.style.boxShadow = "none";
                                    }}
                                />
                                <button
                                    onClick={() => {
                                        const today = new Date();
                                        setSelectedDate(
                                            today.toISOString().split("T")[0]
                                        );
                                    }}
                                    style={{
                                        padding: "10px 16px",
                                        borderRadius: "8px",
                                        border: "1px solid #28a745",
                                        background: "#28a745",
                                        color: "white",
                                        fontSize: "14px",
                                        fontWeight: "600",
                                        cursor: "pointer",
                                        transition: "all 0.2s ease",
                                        whiteSpace: "nowrap",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.background = "#218838";
                                        e.target.style.borderColor = "#218838";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.background = "#28a745";
                                        e.target.style.borderColor = "#28a745";
                                    }}
                                >
                                    🕐 Hoy
                                </button>
                            </div>
                            <div
                                style={{
                                    marginTop: "12px",
                                    fontSize: "13px",
                                    color: "#6c757d",
                                    fontStyle: "italic",
                                }}
                            >
                                Mostrando ventas del{" "}
                                {getDisplayDate(
                                    selectedDate
                                ).toLocaleDateString("es-CO", {
                                    weekday: "long",
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                })}
                            </div>
                        </div>

                        {/* Tabla de ventas del día */}
                        <div
                            style={{
                                background: "#fff",
                                borderRadius: "12px",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                overflow: "hidden",
                                border: "1px solid #e9ecef",
                            }}
                        >
                            <div
                                style={{
                                    padding: "20px 24px",
                                    borderBottom: "1px solid #e9ecef",
                                    background: "#f8f9fa",
                                }}
                            >
                                <h3
                                    style={{
                                        margin: "0",
                                        fontSize: "18px",
                                        fontWeight: "700",
                                        color: "#495057",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                    }}
                                >
                                    📅 Ventas del{" "}
                                    {getDisplayDate(
                                        selectedDate
                                    ).toLocaleDateString("es-CO", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                    })}
                                    <span
                                        style={{
                                            background: "#28a745",
                                            color: "white",
                                            padding: "2px 8px",
                                            borderRadius: "12px",
                                            fontSize: "12px",
                                            fontWeight: "600",
                                        }}
                                    >
                                        {dailySales}
                                    </span>
                                </h3>
                                <p
                                    style={{
                                        margin: "8px 0 0 0",
                                        fontSize: "14px",
                                        color: "#6c757d",
                                    }}
                                >
                                    Lista detallada de todas las ventas
                                    realizadas el{" "}
                                    {getDisplayDate(
                                        selectedDate
                                    ).toLocaleDateString("es-CO", {
                                        weekday: "long",
                                        day: "numeric",
                                        month: "long",
                                        year: "numeric",
                                    })}
                                </p>
                            </div>

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
                                                background: "#f8f9fa",
                                                borderBottom:
                                                    "2px solid #dee2e6",
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
                                                Hora
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
                                        {todaySales.length > 0 ? (
                                            todaySales.map((sale, index) => (
                                                <tr
                                                    key={sale.id}
                                                    style={{
                                                        background:
                                                            index % 2 === 0
                                                                ? "#ffffff"
                                                                : "#f8f9fa",
                                                        transition:
                                                            "all 0.2s ease",
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
                                                            padding:
                                                                "14px 12px",
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
                                                            padding:
                                                                "14px 12px",
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
                                                            padding:
                                                                "14px 12px",
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
                                                            padding:
                                                                "14px 12px",
                                                            color: "#6c757d",
                                                            fontWeight: "500",
                                                            borderBottom:
                                                                "1px solid #dee2e6",
                                                        }}
                                                    >
                                                        {sale.sale_date
                                                            ? new Date(
                                                                  sale.sale_date
                                                              ).toLocaleTimeString(
                                                                  "es-CO",
                                                                  {
                                                                      hour: "2-digit",
                                                                      minute: "2-digit",
                                                                  }
                                                              )
                                                            : "-"}
                                                    </td>
                                                    <td
                                                        style={{
                                                            padding:
                                                                "14px 12px",
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
                                            ))
                                        ) : (
                                            <tr>
                                                <td
                                                    colSpan="5"
                                                    style={{
                                                        padding: "40px 20px",
                                                        textAlign: "center",
                                                        color: "#6c757d",
                                                        fontSize: "16px",
                                                        fontStyle: "italic",
                                                    }}
                                                >
                                                    📅 No hay ventas registradas
                                                    el{" "}
                                                    {getDisplayDate(
                                                        selectedDate
                                                    ).toLocaleDateString(
                                                        "es-CO",
                                                        {
                                                            day: "numeric",
                                                            month: "long",
                                                            year: "numeric",
                                                        }
                                                    )}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
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

                        {/* Mensaje informativo */}
                        <div
                            style={{
                                background: "#e3f2fd",
                                color: "#1976d2",
                                padding: "16px",
                                borderRadius: "8px",
                                border: "1px solid #bbdefb",
                                textAlign: "center",
                                fontSize: "14px",
                                marginBottom: "24px",
                            }}
                        >
                            📊 Esta sección muestra el resumen general de todas
                            las ventas registradas en el sistema.
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
                    </div>
                )}
            </div>
        </div>
    );
};

export default TotalVentasPage;
