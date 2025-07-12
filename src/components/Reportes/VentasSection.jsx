import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import {
    getSalesStatisticsByDays,
    getSalesByLocation,
    getTopProductsByDays,
    getTodaySales,
    getSalesInDateRange,
} from "../../services/salesService";
import ReportesFilters from "./ReportesFilters";
import SaleDetailModal from "./SaleDetailModal";

const VentasSection = () => {
    const { authToken } = useAuth();

    // Estados para datos
    const [salesStats, setSalesStats] = useState(null);
    const [salesByLocation, setSalesByLocation] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [detailedSales, setDetailedSales] = useState([]);

    // Estados de carga y errores
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    // Estados para el modal de detalle
    const [selectedSaleData, setSelectedSaleData] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Filtros
    const [filters, setFilters] = useState({
        type: "sale",
        days: "", // Por defecto mostrar "Selecciona uno"
        specificDate: new Date().toISOString().split("T")[0], // Por defecto mostrar ventas de hoy
        startDate: "",
        endDate: "",
        sede: "all",
    });

    // Función para cargar datos usando API de estadísticas
    const loadSalesDataByDays = async (days) => {
        if (!authToken) return;

        setIsLoading(true);
        setError("");

        try {
            console.log(
                `🔄 Cargando datos de ventas para últimos ${days} días`
            );

            // Cargar datos en paralelo
            const [statsData, locationData, productsData] = await Promise.all([
                getSalesStatisticsByDays(days, authToken),
                getSalesByLocation(days, authToken),
                getTopProductsByDays(days, 10, authToken),
            ]);

            console.log("📊 Datos de estadísticas recibidos:", statsData);
            console.log("📍 Datos de ubicaciones recibidos:", locationData);
            console.log("🔥 Datos de productos recibidos:", productsData);

            // Agregar logging detallado para debug de totales por sede
            if (locationData && locationData.length > 0) {
                console.log("🏢 DETALLE DE VENTAS POR SEDE:");
                locationData.forEach((location, index) => {
                    console.log(
                        `  ${index + 1}. ${
                            location.location_name || "Sin nombre"
                        }:`
                    );
                    console.log(`     - ID: ${location.location_id}`);
                    console.log(
                        `     - Total Sales: ${location.total_sales || 0}`
                    );
                    console.log(
                        `     - Total Amount: ${
                            location.total_amount || 0
                        } (ESTE ES EL TOTAL DE DINERO)`
                    );
                    console.log(
                        `     - Average Sale: ${
                            location.average_sale || 0
                        } (ESTE ES EL PROMEDIO)`
                    );
                    console.log(
                        `     - Total Revenue: ${
                            location.total_revenue || "No disponible"
                        }`
                    );
                });
            }

            setSalesStats(statsData);
            setSalesByLocation(locationData);
            setTopProducts(productsData);

            console.log("✅ Datos de estadísticas cargados exitosamente");
        } catch (error) {
            console.error("❌ Error cargando estadísticas:", error);
            setError("Error al cargar estadísticas: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Función para cargar ventas detalladas (para fecha específica)
    const loadDetailedSales = async (specificDate) => {
        if (!authToken) return;

        setIsLoading(true);
        setError("");

        try {
            console.log(`🔄 Cargando ventas detalladas para ${specificDate}`);

            let salesData = [];

            // Si es hoy, usar endpoint específico
            const today = new Date().toISOString().split("T")[0];
            if (specificDate === today) {
                console.log("📅 Usando endpoint de ventas de hoy");
                const todayData = await getTodaySales({}, authToken);
                salesData = todayData.results || todayData || [];
            } else {
                console.log("📅 Usando filtrado local para fecha específica");
                salesData = await getSalesInDateRange(
                    specificDate,
                    specificDate,
                    authToken
                );
            }

            // Procesar datos para compatibilidad
            const processedData = salesData.map((sale) => ({
                id: sale.id,
                date: sale.sale_date,
                total: parseFloat(sale.total_net) || 0,
                sale_type: sale.sale_type,
                customer_name: sale.customer_details?.name || "Sin cliente",
                customer_id: sale.customer_details?.id || null,
                location: sale.location_details?.name || "Sin sede",
                sede: sale.location_details?.name || "Sin sede",
                items_count: sale.items?.length || 0,
                created_at: sale.sale_date,
                ...sale,
            }));

            setDetailedSales(processedData);

            // Limpiar estadísticas cuando se ven ventas detalladas
            setSalesStats(null);
            setSalesByLocation([]);
            setTopProducts([]);

            console.log(
                `✅ Ventas detalladas cargadas: ${processedData.length} registros`
            );
        } catch (error) {
            console.error("❌ Error cargando ventas detalladas:", error);
            setError("Error al cargar ventas: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Efecto para cargar datos iniciales cuando el componente se monta
    useEffect(() => {
        // Cargar ventas de hoy por defecto
        if (authToken) {
            const today = new Date().toISOString().split("T")[0];
            loadDetailedSales(today);
        }
    }, [authToken]);

    // Efecto para cargar datos cuando cambien los filtros
    useEffect(() => {
        if (filters.specificDate) {
            // Si hay fecha específica, cargar ventas detalladas
            loadDetailedSales(filters.specificDate);
        } else if (filters.days) {
            // Si hay filtro de días, cargar estadísticas
            loadSalesDataByDays(filters.days);
            setDetailedSales([]); // Limpiar ventas detalladas
        }
    }, [filters.days, filters.specificDate, authToken]);

    // Filtrar datos por sede si es necesario
    const getFilteredData = (data) => {
        if (!data || filters.sede === "all") return data;

        if (Array.isArray(data)) {
            return data.filter((item) => {
                const itemSede =
                    item.sede || item.location || item.location_name || "";
                return itemSede === filters.sede;
            });
        }

        return data;
    };

    const filteredDetailedSales = getFilteredData(detailedSales);
    const filteredSalesByLocation = getFilteredData(salesByLocation);

    // Función para validar y corregir datos de ventas por sede
    const validateAndCorrectLocationData = useCallback((locationData) => {
        if (!locationData || !Array.isArray(locationData)) return locationData;

        return locationData.map((location) => {
            let correctedLocation = { ...location };

            // Si total_amount es 0 o undefined, pero tenemos total_sales > 0 y average_sale > 0
            // Podemos calcular el total: total_sales * average_sale
            if (
                (!location.total_amount || location.total_amount === 0) &&
                location.total_sales > 0 &&
                location.average_sale > 0
            ) {
                const calculatedTotal =
                    location.total_sales * location.average_sale;
                correctedLocation.total_amount = calculatedTotal;

                console.log(`🔧 CORRECCIÓN: Sede ${location.location_name}:`);
                console.log(`   Total original: ${location.total_amount}`);
                console.log(
                    `   Total calculado: ${calculatedTotal} (${location.total_sales} ventas × $${location.average_sale} promedio)`
                );
            }

            // También verificar si tenemos total_revenue como alternativa
            if (
                (!correctedLocation.total_amount ||
                    correctedLocation.total_amount === 0) &&
                location.total_revenue &&
                location.total_revenue > 0
            ) {
                correctedLocation.total_amount = location.total_revenue;
                console.log(
                    `🔧 CORRECCIÓN: Usando total_revenue para sede ${location.location_name}: $${location.total_revenue}`
                );
            }

            return correctedLocation;
        });
    }, []);

    // Aplicar validación y corrección a los datos filtrados
    const validatedSalesByLocation = validateAndCorrectLocationData(
        filteredSalesByLocation
    );

    // Funciones para manejar el modal de detalle
    const handleSaleClick = (saleData) => {
        console.log(`🔍 Abriendo detalle de venta ${saleData.id}`, saleData);
        setSelectedSaleData(saleData);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedSaleData(null);
    };

    return (
        <div style={{ padding: "24px" }}>
            {/* Filtros */}
            <ReportesFilters
                filters={filters}
                setFilters={setFilters}
                activeView="ventas"
            />

            {/* Indicador de carga */}
            {isLoading && (
                <div
                    style={{
                        padding: "24px",
                        textAlign: "center",
                        backgroundColor: "#f8f9fa",
                        borderRadius: "12px",
                        margin: "24px 0",
                    }}
                >
                    <div
                        style={{
                            display: "inline-block",
                            width: "40px",
                            height: "40px",
                            border: "4px solid #e3e3e3",
                            borderTop: "4px solid #007bff",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite",
                            marginBottom: "16px",
                        }}
                    ></div>
                    <p style={{ color: "#666", fontSize: "16px" }}>
                        Cargando datos de ventas...
                    </p>
                </div>
            )}

            {/* Error */}
            {error && (
                <div
                    style={{
                        padding: "16px",
                        backgroundColor: "#f8d7da",
                        color: "#721c24",
                        borderRadius: "8px",
                        border: "1px solid #f5c6cb",
                        margin: "24px 0",
                    }}
                >
                    ⚠️ {error}
                </div>
            )}

            {/* Estadísticas del día actual */}
            {filteredDetailedSales.length > 0 && !isLoading && (
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fit, minmax(300px, 1fr))",
                        gap: "24px",
                        marginBottom: "32px",
                    }}
                >
                    {/* Total de ventas del día */}
                    <div
                        style={{
                            padding: "24px",
                            backgroundColor: "white",
                            borderRadius: "16px",
                            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
                            border: "1px solid #e9ecef",
                        }}
                    >
                        <div
                            style={{
                                fontSize: "32px",
                                fontWeight: "800",
                                marginBottom: "8px",
                                color: "#28a745",
                            }}
                        >
                            $
                            {filteredDetailedSales
                                .reduce(
                                    (total, sale) =>
                                        total +
                                        parseFloat(
                                            sale.total_net ||
                                                sale.total_gross ||
                                                sale.total ||
                                                0
                                        ),
                                    0
                                )
                                .toLocaleString()}
                        </div>
                        <div
                            style={{
                                fontSize: "16px",
                                fontWeight: "600",
                                color: "#6c757d",
                            }}
                        >
                            Total del Día
                        </div>
                        <div
                            style={{
                                fontSize: "14px",
                                color: "#6c757d",
                                marginTop: "4px",
                            }}
                        >
                            {filters.specificDate}
                        </div>
                    </div>

                    {/* Número de ventas del día */}
                    <div
                        style={{
                            padding: "24px",
                            backgroundColor: "white",
                            borderRadius: "16px",
                            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
                            border: "1px solid #e9ecef",
                        }}
                    >
                        <div
                            style={{
                                fontSize: "32px",
                                fontWeight: "800",
                                marginBottom: "8px",
                                color: "#007bff",
                            }}
                        >
                            {filteredDetailedSales.length}
                        </div>
                        <div
                            style={{
                                fontSize: "16px",
                                fontWeight: "600",
                                color: "#6c757d",
                            }}
                        >
                            Ventas del Día
                        </div>
                        <div
                            style={{
                                fontSize: "14px",
                                color: "#6c757d",
                                marginTop: "4px",
                            }}
                        >
                            {filters.specificDate}
                        </div>
                    </div>

                    {/* Promedio por venta del día */}
                    <div
                        style={{
                            padding: "24px",
                            backgroundColor: "white",
                            borderRadius: "16px",
                            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
                            border: "1px solid #e9ecef",
                        }}
                    >
                        <div
                            style={{
                                fontSize: "32px",
                                fontWeight: "800",
                                marginBottom: "8px",
                                color: "#fd7e14",
                            }}
                        >
                            $
                            {filteredDetailedSales.length > 0
                                ? (
                                      filteredDetailedSales.reduce(
                                          (total, sale) =>
                                              total +
                                              parseFloat(
                                                  sale.total_net ||
                                                      sale.total_gross ||
                                                      sale.total ||
                                                      0
                                              ),
                                          0
                                      ) / filteredDetailedSales.length
                                  ).toFixed(0)
                                : "0"}
                        </div>
                        <div
                            style={{
                                fontSize: "16px",
                                fontWeight: "600",
                                color: "#6c757d",
                            }}
                        >
                            Promedio por Venta
                        </div>
                        <div
                            style={{
                                fontSize: "14px",
                                color: "#6c757d",
                                marginTop: "4px",
                            }}
                        >
                            {filters.specificDate}
                        </div>
                    </div>
                </div>
            )}

            {/* Estadísticas generales (cuando se usan días) */}
            {salesStats && !isLoading && (
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fit, minmax(300px, 1fr))",
                        gap: "24px",
                        marginBottom: "32px",
                    }}
                >
                    {/* Total de ventas */}
                    <div
                        style={{
                            padding: "24px",
                            backgroundColor: "white",
                            borderRadius: "16px",
                            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
                            border: "1px solid #e9ecef",
                        }}
                    >
                        <div
                            style={{
                                fontSize: "32px",
                                fontWeight: "800",
                                marginBottom: "8px",
                                color: "#28a745",
                            }}
                        >
                            $
                            {parseFloat(
                                salesStats.total_revenue ||
                                    salesStats.total_amount ||
                                    0
                            ).toLocaleString()}
                        </div>
                        <div
                            style={{
                                fontSize: "16px",
                                fontWeight: "600",
                                color: "#6c757d",
                            }}
                        >
                            Total en Ventas
                        </div>
                        <div
                            style={{
                                fontSize: "14px",
                                color: "#6c757d",
                                marginTop: "4px",
                            }}
                        >
                            Últimos {filters.days} días
                        </div>
                    </div>

                    {/* Número de ventas */}
                    <div
                        style={{
                            padding: "24px",
                            backgroundColor: "white",
                            borderRadius: "16px",
                            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
                            border: "1px solid #e9ecef",
                        }}
                    >
                        <div
                            style={{
                                fontSize: "32px",
                                fontWeight: "800",
                                marginBottom: "8px",
                                color: "#007bff",
                            }}
                        >
                            {parseInt(salesStats.total_sales || 0)}
                        </div>
                        <div
                            style={{
                                fontSize: "16px",
                                fontWeight: "600",
                                color: "#6c757d",
                            }}
                        >
                            Ventas Realizadas
                        </div>
                        <div
                            style={{
                                fontSize: "14px",
                                color: "#6c757d",
                                marginTop: "4px",
                            }}
                        >
                            Últimos {filters.days} días
                        </div>
                    </div>

                    {/* Ventas por día */}
                    <div
                        style={{
                            padding: "24px",
                            backgroundColor: "white",
                            borderRadius: "16px",
                            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
                            border: "1px solid #e9ecef",
                        }}
                    >
                        <div
                            style={{
                                fontSize: "32px",
                                fontWeight: "800",
                                marginBottom: "8px",
                                color: "#6f42c1",
                            }}
                        >
                            {parseInt(salesStats.total_sales || 0) > 0
                                ? (
                                      parseInt(salesStats.total_sales || 0) /
                                      parseInt(filters.days || 1)
                                  ).toFixed(1)
                                : "0.0"}
                        </div>
                        <div
                            style={{
                                fontSize: "16px",
                                fontWeight: "600",
                                color: "#6c757d",
                            }}
                        >
                            Ventas por Día
                        </div>
                        <div
                            style={{
                                fontSize: "14px",
                                color: "#6c757d",
                                marginTop: "4px",
                            }}
                        >
                            Promedio últimos {filters.days} días
                        </div>
                    </div>
                </div>
            )}

            {/* Productos más vendidos */}
            {topProducts.length > 0 && !isLoading && (
                <div
                    style={{
                        backgroundColor: "white",
                        borderRadius: "16px",
                        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
                        border: "1px solid #e9ecef",
                        marginBottom: "32px",
                        overflow: "hidden",
                    }}
                >
                    <div
                        style={{
                            padding: "24px",
                            borderBottom: "1px solid #e9ecef",
                            backgroundColor: "#f8f9fa",
                        }}
                    >
                        <h3
                            style={{
                                margin: 0,
                                fontSize: "20px",
                                fontWeight: "700",
                                color: "#2c3e50",
                            }}
                        >
                            🔥 Productos Más Vendidos
                        </h3>
                        <p style={{ margin: "8px 0 0 0", color: "#6c757d" }}>
                            Últimos {filters.days} días
                        </p>
                    </div>
                    <div style={{ padding: "0" }}>
                        {topProducts.slice(0, 10).map((product, index) => (
                            <div
                                key={product.product_id || index}
                                style={{
                                    padding: "16px 24px",
                                    borderBottom:
                                        index < topProducts.length - 1
                                            ? "1px solid #f1f3f4"
                                            : "none",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                }}
                            >
                                <div style={{ flex: 1 }}>
                                    <div
                                        style={{
                                            fontWeight: "600",
                                            color: "#2c3e50",
                                            marginBottom: "4px",
                                        }}
                                    >
                                        #{index + 1}.{" "}
                                        {product.product_name ||
                                            "Producto sin nombre"}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "14px",
                                            color: "#6c757d",
                                        }}
                                    >
                                        SKU: {product.product_sku || "N/A"}
                                    </div>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    <div
                                        style={{
                                            fontSize: "18px",
                                            fontWeight: "700",
                                            color: "#28a745",
                                        }}
                                    >
                                        {product.total_quantity || 0} vendidos
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "14px",
                                            color: "#6c757d",
                                        }}
                                    >
                                        $
                                        {(
                                            product.total_revenue || 0
                                        ).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Ventas por ubicación */}
            {validatedSalesByLocation.length > 0 && !isLoading && (
                <div
                    style={{
                        backgroundColor: "white",
                        borderRadius: "16px",
                        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
                        border: "1px solid #e9ecef",
                        marginBottom: "32px",
                        overflow: "hidden",
                    }}
                >
                    <div
                        style={{
                            padding: "24px",
                            borderBottom: "1px solid #e9ecef",
                            backgroundColor: "#f8f9fa",
                        }}
                    >
                        <h3
                            style={{
                                margin: 0,
                                fontSize: "20px",
                                fontWeight: "700",
                                color: "#2c3e50",
                            }}
                        >
                            🏢 Ventas por Sede
                        </h3>
                        <p style={{ margin: "8px 0 0 0", color: "#6c757d" }}>
                            Últimos {filters.days} días
                        </p>
                    </div>
                    <div style={{ padding: "0" }}>
                        {validatedSalesByLocation.map((location, index) => {
                            // Obtener los valores y manejar casos undefined/null
                            const totalAmount =
                                location.total_amount ||
                                location.total_revenue ||
                                0;
                            const averageSale = location.average_sale || 0;
                            const totalSales = location.total_sales || 0;
                            const locationName =
                                location.location_name || "Sede sin nombre";

                            // Verificar si el total fue calculado automáticamente
                            const wasCalculated =
                                location.total_amount > 0 &&
                                location.total_sales > 0 &&
                                location.average_sale > 0 &&
                                Math.abs(
                                    location.total_amount -
                                        location.total_sales *
                                            location.average_sale
                                ) < 1;

                            // Logging para debug individual
                            console.log(
                                `🏢 Renderizando sede ${locationName}:`,
                                {
                                    totalAmount,
                                    averageSale,
                                    totalSales,
                                    wasCalculated,
                                    originalData: location,
                                }
                            );

                            return (
                                <div
                                    key={location.location_id || index}
                                    style={{
                                        padding: "20px 24px",
                                        borderBottom:
                                            index <
                                            validatedSalesByLocation.length - 1
                                                ? "1px solid #f1f3f4"
                                                : "none",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        background:
                                            index % 2 === 0
                                                ? "#fff"
                                                : "#fafbfc",
                                    }}
                                >
                                    <div style={{ flex: 1 }}>
                                        <div
                                            style={{
                                                fontWeight: "700",
                                                color: "#2c3e50",
                                                marginBottom: "6px",
                                                fontSize: "16px",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "8px",
                                            }}
                                        >
                                            📍 {locationName}
                                            {wasCalculated && (
                                                <span
                                                    style={{
                                                        fontSize: "10px",
                                                        background: "#e3f2fd",
                                                        color: "#1976d2",
                                                        padding: "2px 6px",
                                                        borderRadius: "4px",
                                                        fontWeight: "500",
                                                    }}
                                                    title="Total calculado automáticamente"
                                                >
                                                    🧮 Calculado
                                                </span>
                                            )}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: "14px",
                                                color: "#6c757d",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "8px",
                                            }}
                                        >
                                            <span>
                                                📊 {totalSales} ventas
                                                realizadas
                                            </span>
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            textAlign: "right",
                                            minWidth: "200px",
                                        }}
                                    >
                                        {/* TOTAL DE DINERO - El valor principal */}
                                        <div
                                            style={{
                                                fontSize: "22px",
                                                fontWeight: "800",
                                                color:
                                                    totalAmount > 0
                                                        ? "#28a745"
                                                        : "#dc3545",
                                                marginBottom: "4px",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "flex-end",
                                                gap: "6px",
                                            }}
                                        >
                                            <span style={{ fontSize: "16px" }}>
                                                {totalAmount > 0 ? "💰" : "⚠️"}
                                            </span>
                                            <span>
                                                $
                                                {totalAmount.toLocaleString(
                                                    "es-CO",
                                                    {
                                                        minimumFractionDigits: 0,
                                                        maximumFractionDigits: 0,
                                                    }
                                                )}
                                            </span>
                                        </div>
                                        <div
                                            style={{
                                                fontSize: "13px",
                                                fontWeight: "600",
                                                color:
                                                    totalAmount > 0
                                                        ? "#28a745"
                                                        : "#dc3545",
                                                marginBottom: "8px",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.5px",
                                            }}
                                        >
                                            {totalAmount > 0
                                                ? "💸 TOTAL REGISTRADO"
                                                : "⚠️ SIN TOTAL"}
                                        </div>

                                        {/* Línea separadora */}
                                        <div
                                            style={{
                                                height: "1px",
                                                backgroundColor: "#e9ecef",
                                                margin: "8px 0",
                                            }}
                                        />

                                        {/* PROMEDIO - Valor secundario */}
                                        <div
                                            style={{
                                                fontSize: "16px",
                                                fontWeight: "600",
                                                color: "#6c757d",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "flex-end",
                                                gap: "6px",
                                            }}
                                        >
                                            <span style={{ fontSize: "12px" }}>
                                                📈
                                            </span>
                                            <span>
                                                Promedio: $
                                                {averageSale.toLocaleString(
                                                    "es-CO",
                                                    {
                                                        minimumFractionDigits: 0,
                                                        maximumFractionDigits: 0,
                                                    }
                                                )}
                                            </span>
                                        </div>
                                        <div
                                            style={{
                                                fontSize: "11px",
                                                color: "#adb5bd",
                                                marginTop: "2px",
                                            }}
                                        >
                                            por venta individual
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Resumen total de todas las sedes */}
                    {validatedSalesByLocation.length > 1 && (
                        <div
                            style={{
                                padding: "20px 24px",
                                backgroundColor: "#f8f9fa",
                                borderTop: "2px solid #e9ecef",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <div style={{ flex: 1 }}>
                                <div
                                    style={{
                                        fontWeight: "800",
                                        color: "#2c3e50",
                                        marginBottom: "6px",
                                        fontSize: "18px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                    }}
                                >
                                    🏢 TOTAL TODAS LAS SEDES
                                </div>
                                <div
                                    style={{
                                        fontSize: "14px",
                                        color: "#6c757d",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                    }}
                                >
                                    <span>
                                        📊{" "}
                                        {validatedSalesByLocation.reduce(
                                            (total, location) =>
                                                total +
                                                (location.total_sales || 0),
                                            0
                                        )}{" "}
                                        ventas en{" "}
                                        {validatedSalesByLocation.length} sedes
                                    </span>
                                </div>
                            </div>
                            <div
                                style={{
                                    textAlign: "right",
                                    minWidth: "200px",
                                }}
                            >
                                {/* TOTAL GENERAL */}
                                <div
                                    style={{
                                        fontSize: "26px",
                                        fontWeight: "900",
                                        color: "#28a745",
                                        marginBottom: "4px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "flex-end",
                                        gap: "8px",
                                    }}
                                >
                                    <span style={{ fontSize: "20px" }}>💰</span>
                                    <span>
                                        $
                                        {validatedSalesByLocation
                                            .reduce(
                                                (total, location) =>
                                                    total +
                                                    (location.total_amount ||
                                                        location.total_revenue ||
                                                        0),
                                                0
                                            )
                                            .toLocaleString("es-CO", {
                                                minimumFractionDigits: 0,
                                                maximumFractionDigits: 0,
                                            })}
                                    </span>
                                </div>
                                <div
                                    style={{
                                        fontSize: "14px",
                                        fontWeight: "700",
                                        color: "#28a745",
                                        marginBottom: "8px",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.5px",
                                    }}
                                >
                                    💸 TOTAL GENERAL
                                </div>

                                {/* Línea separadora */}
                                <div
                                    style={{
                                        height: "1px",
                                        backgroundColor: "#dee2e6",
                                        margin: "8px 0",
                                    }}
                                />

                                {/* PROMEDIO GENERAL */}
                                <div
                                    style={{
                                        fontSize: "16px",
                                        fontWeight: "600",
                                        color: "#6c757d",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "flex-end",
                                        gap: "6px",
                                    }}
                                >
                                    <span style={{ fontSize: "12px" }}>📈</span>
                                    <span>
                                        Promedio general: $
                                        {(() => {
                                            const totalSales =
                                                validatedSalesByLocation.reduce(
                                                    (total, location) =>
                                                        total +
                                                        (location.total_sales ||
                                                            0),
                                                    0
                                                );
                                            const totalAmount =
                                                validatedSalesByLocation.reduce(
                                                    (total, location) =>
                                                        total +
                                                        (location.total_amount ||
                                                            location.total_revenue ||
                                                            0),
                                                    0
                                                );
                                            return totalSales > 0
                                                ? totalAmount / totalSales
                                                : 0;
                                        })().toLocaleString("es-CO", {
                                            minimumFractionDigits: 0,
                                            maximumFractionDigits: 0,
                                        })}
                                    </span>
                                </div>
                                <div
                                    style={{
                                        fontSize: "11px",
                                        color: "#adb5bd",
                                        marginTop: "2px",
                                    }}
                                >
                                    por venta entre todas las sedes
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Ventas detalladas (cuando se usa fecha específica) */}
            {filteredDetailedSales.length > 0 && !isLoading && (
                <div
                    style={{
                        backgroundColor: "white",
                        borderRadius: "16px",
                        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
                        border: "1px solid #e9ecef",
                        overflow: "hidden",
                    }}
                >
                    <div
                        style={{
                            padding: "24px",
                            borderBottom: "1px solid #e9ecef",
                            backgroundColor: "#f8f9fa",
                        }}
                    >
                        <h3
                            style={{
                                margin: 0,
                                fontSize: "20px",
                                fontWeight: "700",
                                color: "#2c3e50",
                            }}
                        >
                            📋 Ventas Detalladas
                        </h3>
                        <p style={{ margin: "8px 0 0 0", color: "#6c757d" }}>
                            {filters.specificDate} -{" "}
                            {filteredDetailedSales.length} ventas
                        </p>
                    </div>
                    <div
                        style={{
                            overflowX: "auto",
                            borderRadius: "12px",
                            border: "1px solid #e9ecef",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                        }}
                    >
                        <table
                            style={{
                                width: "100%",
                                borderCollapse: "collapse",
                                minWidth: "1200px",
                                backgroundColor: "#fff",
                            }}
                        >
                            <thead>
                                <tr
                                    style={{
                                        background:
                                            "linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)",
                                        color: "white",
                                    }}
                                >
                                    <th
                                        style={{
                                            padding: "16px 12px",
                                            textAlign: "left",
                                            fontWeight: "600",
                                            fontSize: "14px",
                                            letterSpacing: "0.5px",
                                            textTransform: "uppercase",
                                        }}
                                    >
                                        🆔 ID
                                    </th>
                                    <th
                                        style={{
                                            padding: "16px 12px",
                                            textAlign: "left",
                                            fontWeight: "600",
                                            fontSize: "14px",
                                            letterSpacing: "0.5px",
                                            textTransform: "uppercase",
                                        }}
                                    >
                                        👤 Cliente
                                    </th>
                                    <th
                                        style={{
                                            padding: "16px 12px",
                                            textAlign: "left",
                                            fontWeight: "600",
                                            fontSize: "14px",
                                            letterSpacing: "0.5px",
                                            textTransform: "uppercase",
                                        }}
                                    >
                                        🏢 Sede
                                    </th>
                                    <th
                                        style={{
                                            padding: "16px 12px",
                                            textAlign: "center",
                                            fontWeight: "600",
                                            fontSize: "14px",
                                            letterSpacing: "0.5px",
                                            textTransform: "uppercase",
                                        }}
                                    >
                                        💰 Total
                                    </th>
                                    <th
                                        style={{
                                            padding: "16px 12px",
                                            textAlign: "center",
                                            fontWeight: "600",
                                            fontSize: "14px",
                                            letterSpacing: "0.5px",
                                            textTransform: "uppercase",
                                        }}
                                    >
                                        🏪 Tipo
                                    </th>
                                    <th
                                        style={{
                                            padding: "16px 12px",
                                            textAlign: "center",
                                            fontWeight: "600",
                                            fontSize: "14px",
                                            letterSpacing: "0.5px",
                                            textTransform: "uppercase",
                                        }}
                                    >
                                        📦 Items
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDetailedSales.map((sale, index) => (
                                    <tr
                                        key={sale.id}
                                        onClick={() => handleSaleClick(sale)}
                                        style={{
                                            backgroundColor:
                                                index % 2 === 0
                                                    ? "#fff"
                                                    : "#f8f9fa",
                                            cursor: "pointer",
                                            transition: "all 0.2s ease",
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor =
                                                "#e3f2fd";
                                            e.currentTarget.style.transform =
                                                "translateY(-1px)";
                                            e.currentTarget.style.boxShadow =
                                                "0 2px 8px rgba(0,0,0,0.1)";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor =
                                                index % 2 === 0
                                                    ? "#fff"
                                                    : "#f8f9fa";
                                            e.currentTarget.style.transform =
                                                "translateY(0)";
                                            e.currentTarget.style.boxShadow =
                                                "none";
                                        }}
                                    >
                                        <td
                                            style={{
                                                padding: "16px 12px",
                                                borderBottom:
                                                    "1px solid #e9ecef",
                                                fontSize: "14px",
                                                fontWeight: "700",
                                                color: "#2c3e50",
                                            }}
                                        >
                                            #{sale.id}
                                        </td>
                                        <td
                                            style={{
                                                padding: "16px 12px",
                                                borderBottom:
                                                    "1px solid #e9ecef",
                                                fontSize: "14px",
                                                fontWeight: "600",
                                                color: "#2c3e50",
                                            }}
                                        >
                                            {sale.customer_name}
                                        </td>
                                        <td
                                            style={{
                                                padding: "16px 12px",
                                                borderBottom:
                                                    "1px solid #e9ecef",
                                                fontSize: "14px",
                                                fontWeight: "500",
                                                color: "#495057",
                                            }}
                                        >
                                            {sale.sede}
                                        </td>
                                        <td
                                            style={{
                                                padding: "16px 12px",
                                                borderBottom:
                                                    "1px solid #e9ecef",
                                                textAlign: "center",
                                                fontSize: "16px",
                                                fontWeight: "700",
                                                color: "#27ae60",
                                            }}
                                        >
                                            ${sale.total.toLocaleString()}
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
                                                    padding: "6px 12px",
                                                    borderRadius: "20px",
                                                    fontSize: "12px",
                                                    fontWeight: "600",
                                                    textTransform: "uppercase",
                                                    letterSpacing: "0.5px",
                                                    backgroundColor:
                                                        sale.sale_type ===
                                                        "credit"
                                                            ? "#f39c12" + "20"
                                                            : "#27ae60" + "20",
                                                    color:
                                                        sale.sale_type ===
                                                        "credit"
                                                            ? "#f39c12"
                                                            : "#27ae60",
                                                    border: `2px solid ${
                                                        sale.sale_type ===
                                                        "credit"
                                                            ? "#f39c12" + "40"
                                                            : "#27ae60" + "40"
                                                    }`,
                                                }}
                                            >
                                                {sale.sale_type === "credit"
                                                    ? "Crédito"
                                                    : "Normal"}
                                            </span>
                                        </td>
                                        <td
                                            style={{
                                                padding: "16px 12px",
                                                borderBottom:
                                                    "1px solid #e9ecef",
                                                textAlign: "center",
                                                fontSize: "16px",
                                                fontWeight: "700",
                                                color: "#2c3e50",
                                            }}
                                        >
                                            {sale.items_count}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Información sobre problemas de datos */}
            {validatedSalesByLocation.length === 0 &&
                salesStats === null &&
                filters.days &&
                !isLoading && (
                    <div
                        style={{
                            backgroundColor: "#fff3cd",
                            border: "1px solid #ffeaa7",
                            borderRadius: "12px",
                            padding: "20px",
                            marginBottom: "24px",
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "12px",
                        }}
                    >
                        <div style={{ fontSize: "24px" }}>💡</div>
                        <div style={{ flex: 1 }}>
                            <h4
                                style={{
                                    margin: "0 0 8px 0",
                                    color: "#856404",
                                    fontSize: "16px",
                                }}
                            >
                                Información sobre totales por sede
                            </h4>
                            <p
                                style={{
                                    margin: "0 0 12px 0",
                                    color: "#856404",
                                    fontSize: "14px",
                                }}
                            >
                                Si no ves el total de dinero por sede, puede
                                deberse a:
                            </p>
                            <ul
                                style={{
                                    margin: "0 0 0 20px",
                                    color: "#856404",
                                    fontSize: "14px",
                                }}
                            >
                                <li>
                                    No hay ventas registradas en el período
                                    seleccionado ({filters.days} días)
                                </li>
                                <li>
                                    El sistema está calculando los totales
                                    automáticamente
                                </li>
                                <li>
                                    Verifica que las ventas tengan asignada una
                                    sede correctamente
                                </li>
                            </ul>
                            <p
                                style={{
                                    margin: "12px 0 0 0",
                                    color: "#856404",
                                    fontSize: "13px",
                                    fontStyle: "italic",
                                }}
                            >
                                💬 Los totales se muestran prominentemente en
                                verde, y los promedios en gris más pequeño
                            </p>
                        </div>
                    </div>
                )}

            {/* Estado vacío */}
            {!isLoading &&
                !error &&
                !salesStats &&
                filteredDetailedSales.length === 0 && (
                    <div
                        style={{
                            padding: "64px 24px",
                            textAlign: "center",
                            backgroundColor: "#f8f9fa",
                            borderRadius: "16px",
                            border: "2px dashed #dee2e6",
                        }}
                    >
                        <div style={{ fontSize: "48px", marginBottom: "16px" }}>
                            📊
                        </div>
                        <h3
                            style={{
                                margin: "0 0 8px 0",
                                color: "#6c757d",
                                fontWeight: "600",
                            }}
                        >
                            Selecciona un período para ver las estadísticas
                        </h3>
                        <p style={{ margin: 0, color: "#6c757d" }}>
                            Usa los filtros arriba para elegir un período o
                            fecha específica
                        </p>
                    </div>
                )}

            {/* Modal de detalle de venta */}
            <SaleDetailModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                saleData={selectedSaleData}
            />

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

export default VentasSection;
