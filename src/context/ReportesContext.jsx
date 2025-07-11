import React, { createContext, useContext, useState, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { getAllSales } from "../services/salesService";
import { getAllPurchases } from "../services/purchasesService";

const ReportesContext = createContext();

export const useReportes = () => {
    const context = useContext(ReportesContext);
    if (!context) {
        throw new Error("useReportes must be used within a ReportesProvider");
    }
    return context;
};

export const ReportesProvider = ({ children }) => {
    const { authToken } = useAuth();

    // Estados para el caché de ventas
    const [salesCache, setSalesCache] = useState([]);
    const [salesCacheTimestamp, setSalesCacheTimestamp] = useState(null);
    const [isLoadingSales, setIsLoadingSales] = useState(false);
    const [salesError, setSalesError] = useState("");

    // Estados para el caché de compras
    const [purchasesCache, setPurchasesCache] = useState([]);
    const [purchasesCacheTimestamp, setPurchasesCacheTimestamp] =
        useState(null);
    const [isLoadingPurchases, setIsLoadingPurchases] = useState(false);
    const [purchasesError, setPurchasesError] = useState("");

    // Tiempo de expiración del caché (30 minutos)
    const CACHE_EXPIRY_TIME = 30 * 60 * 1000; // 30 minutos en milisegundos

    // Verificar si el caché de ventas está válido
    const isSalesCacheValid = useCallback(() => {
        if (!salesCacheTimestamp || salesCache.length === 0) {
            return false;
        }

        const now = Date.now();
        const cacheAge = now - salesCacheTimestamp;
        return cacheAge < CACHE_EXPIRY_TIME;
    }, [salesCache, salesCacheTimestamp]);

    // Verificar si el caché de compras está válido
    const isPurchasesCacheValid = useCallback(() => {
        if (!purchasesCacheTimestamp || purchasesCache.length === 0) {
            return false;
        }

        const now = Date.now();
        const cacheAge = now - purchasesCacheTimestamp;
        return cacheAge < CACHE_EXPIRY_TIME;
    }, [purchasesCache, purchasesCacheTimestamp]);

    // Función para procesar los datos de ventas
    const processSalesData = useCallback((data) => {
        return data.map((sale) => {
            // Extraer información del cliente
            const customerName =
                sale.customer_details?.name || sale.customer || "Sin cliente";

            // Extraer información de la ubicación
            const locationName =
                sale.location_details?.name || sale.location || "Sin ubicación";

            // Procesar items de la venta
            const items = sale.items || [];
            const totalItems = items.length;
            const productNames = items
                .map(
                    (item) =>
                        item.product_details?.name || `Producto ${item.product}`
                )
                .join(", ");

            // Calcular totales
            const totalGross = parseFloat(sale.total_gross || 0);
            const totalNet = parseFloat(sale.total_net || 0);

            // Determinar el tipo de venta
            const saleType = sale.sale_type || "normal";
            const saleTypeLabel =
                saleType === "normal"
                    ? "Venta Normal"
                    : saleType === "credit"
                    ? "Venta a Crédito"
                    : saleType === "wholesale"
                    ? "Venta al Por Mayor"
                    : saleType &&
                      saleType.charAt(0).toUpperCase() + saleType.slice(1);

            return {
                id: sale.id,
                type: "sale",
                typeLabel: "Venta",
                date: sale.sale_date || sale.created_at,
                description: `${saleTypeLabel} - Cliente: ${customerName}`,
                quantity: totalItems,
                location: locationName,
                reference: sale.invoice_number || `Venta-${sale.id}`,
                total: totalNet,
                totalGross: totalGross,
                totalNet: totalNet,
                status: sale.should_invoice ? "Facturada" : "Sin facturar",
                product: productNames || "Sin productos",
                customer: customerName,
                customer_name: customerName,
                product_name: productNames,
                saleType: saleType,
                created_at: sale.sale_date || sale.created_at,
                shouldInvoice: sale.should_invoice,
                items: items,
                // Información adicional para debugging
                rawData: sale,
            };
        });
    }, []);

    // Función para normalizar fechas (convertir UTC a fecha local)
    const normalizeDate = (dateString) => {
        if (!dateString) return null;

        try {
            // Crear fecha en UTC
            const utcDate = new Date(dateString);

            // Convertir a fecha local (sin tiempo)
            const localDate = new Date(
                utcDate.getUTCFullYear(),
                utcDate.getUTCMonth(),
                utcDate.getUTCDate()
            );

            // Retornar en formato YYYY-MM-DD
            const year = localDate.getFullYear();
            const month = String(localDate.getMonth() + 1).padStart(2, "0");
            const day = String(localDate.getDate()).padStart(2, "0");

            return `${year}-${month}-${day}`;
        } catch (error) {
            console.error("Error normalizando fecha:", dateString, error);
            return null;
        }
    };

    // Función para procesar los datos de compras
    const processPurchasesData = useCallback((data) => {
        return data.map((purchase) => {
            // Extraer información del proveedor
            const supplierDetails = purchase.supplier_details || {};
            const supplierName =
                supplierDetails.name ||
                purchase.supplier_name ||
                "Sin proveedor";

            // Extraer información de la ubicación destino
            const destinationDetails = purchase.destination_details || {};
            const destinationName =
                destinationDetails.name ||
                purchase.destination_name ||
                "Sin destino";

            // Calcular total
            const total = parseFloat(
                purchase.total_amount || purchase.total || 0
            );

            // Normalizar fechas para evitar problemas de zona horaria
            const orderDate = normalizeDate(
                purchase.order_date || purchase.created_at
            );
            const createdDate = purchase.created_at
                ? new Date(purchase.created_at).toLocaleDateString()
                : "Sin fecha";

            // Traducir estado
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
                    received: "Recibida",
                };
                return map[status] || status;
            };

            return {
                id: purchase.id,
                type: "purchase",
                typeLabel: "Compra",
                date: orderDate || purchase.order_date || purchase.created_at,
                description: `Orden de compra #${purchase.id} - ${supplierName}`,
                quantity: purchase.total_items || 1, // Usar total_items si está disponible
                location: destinationName,
                reference: `Orden-${purchase.id}`,
                total: total,
                status:
                    purchase.status_display || translateStatus(purchase.status),
                product: "Órdenes de compra",
                supplier: supplierName,
                supplier_name: supplierName,
                destination: destinationName,
                destination_name: destinationName,
                created_at: purchase.created_at,
                order_date: orderDate || purchase.order_date,
                total_items: purchase.total_items,
                total_amount: purchase.total_amount,
                notes: purchase.notes,
                can_be_modified: purchase.can_be_modified,
                rawData: purchase, // Mantener todos los datos originales
            };
        });
    }, []);

    // Función para cargar ventas (usa caché si está disponible)
    const loadSalesData = useCallback(
        async (forceRefresh = false, params = {}) => {
            if (!authToken) {
                setSalesError("No hay token de autenticación");
                return [];
            }

            // Si no es un refresh forzado y el caché es válido, usar caché
            if (!forceRefresh && isSalesCacheValid()) {
                console.log("📦 Usando datos de ventas del caché");
                return salesCache;
            }

            // Cargar datos frescos
            setIsLoadingSales(true);
            setSalesError("");

            try {
                console.log("🔄 Cargando datos de ventas frescos...", params);
                const data = await getAllSales(params, authToken);

                // Procesar los datos
                const processedData = processSalesData(data);

                // Actualizar caché
                setSalesCache(processedData);
                setSalesCacheTimestamp(Date.now());

                console.log(
                    `✅ Datos de ventas cargados y cacheados: ${processedData.length} registros`
                );
                return processedData;
            } catch (error) {
                console.error("❌ Error al cargar ventas:", error);
                setSalesError("Error al cargar los datos de ventas");
                return [];
            } finally {
                setIsLoadingSales(false);
            }
        },
        [authToken, salesCache, isSalesCacheValid, processSalesData]
    );

    // Función para cargar compras (usa caché si está disponible)
    const loadPurchasesData = useCallback(
        async (forceRefresh = false, params = {}) => {
            if (!authToken) {
                setPurchasesError("No hay token de autenticación");
                return [];
            }

            // Si no es un refresh forzado y el caché es válido, usar caché
            if (!forceRefresh && isPurchasesCacheValid()) {
                console.log("📦 Usando datos de compras del caché");
                return purchasesCache;
            }

            // Cargar datos frescos
            setIsLoadingPurchases(true);
            setPurchasesError("");

            try {
                console.log("🔄 Cargando datos de compras frescos...", params);
                const data = await getAllPurchases(params, authToken);

                // Procesar los datos
                const processedData = processPurchasesData(data);

                // Actualizar caché
                setPurchasesCache(processedData);
                setPurchasesCacheTimestamp(Date.now());

                console.log(
                    `✅ Datos de compras cargados y cacheados: ${processedData.length} registros`
                );
                return processedData;
            } catch (error) {
                console.error("❌ Error al cargar compras:", error);
                setPurchasesError("Error al cargar los datos de compras");
                return [];
            } finally {
                setIsLoadingPurchases(false);
            }
        },
        [authToken, purchasesCache, isPurchasesCacheValid, processPurchasesData]
    );

    // Función para limpiar el caché de ventas
    const clearSalesCache = useCallback(() => {
        setSalesCache([]);
        setSalesCacheTimestamp(null);
        setSalesError("");
        console.log("🗑️ Caché de ventas limpiado");
    }, []);

    // Función para limpiar el caché de compras
    const clearPurchasesCache = useCallback(() => {
        setPurchasesCache([]);
        setPurchasesCacheTimestamp(null);
        setPurchasesError("");
        console.log("🗑️ Caché de compras limpiado");
    }, []);

    // Función para obtener información del caché de ventas
    const getSalesCacheInfo = useCallback(() => {
        if (!salesCacheTimestamp) {
            return {
                hasData: false,
                age: null,
                isValid: false,
                count: 0,
            };
        }

        const now = Date.now();
        const age = now - salesCacheTimestamp;
        const isValid = age < CACHE_EXPIRY_TIME;

        return {
            hasData: salesCache.length > 0,
            age: age,
            isValid: isValid,
            count: salesCache.length,
            lastUpdate: new Date(salesCacheTimestamp).toLocaleString(),
        };
    }, [salesCache, salesCacheTimestamp]);

    // Función para obtener información del caché de compras
    const getPurchasesCacheInfo = useCallback(() => {
        if (!purchasesCacheTimestamp) {
            return {
                hasData: false,
                age: null,
                isValid: false,
                count: 0,
            };
        }

        const now = Date.now();
        const age = now - purchasesCacheTimestamp;
        const isValid = age < CACHE_EXPIRY_TIME;

        return {
            hasData: purchasesCache.length > 0,
            age: age,
            isValid: isValid,
            count: purchasesCache.length,
            lastUpdate: new Date(purchasesCacheTimestamp).toLocaleString(),
        };
    }, [purchasesCache, purchasesCacheTimestamp]);

    const value = {
        // Estados de ventas
        salesCache,
        isLoadingSales,
        salesError,

        // Estados de compras
        purchasesCache,
        isLoadingPurchases,
        purchasesError,

        // Funciones de ventas
        loadSalesData,
        clearSalesCache,
        getSalesCacheInfo,
        isSalesCacheValid,

        // Funciones de compras
        loadPurchasesData,
        clearPurchasesCache,
        getPurchasesCacheInfo,
        isPurchasesCacheValid,

        // Información del caché (mantener compatibilidad)
        cacheInfo: getSalesCacheInfo(),
    };

    return (
        <ReportesContext.Provider value={value}>
            {children}
        </ReportesContext.Provider>
    );
};

export default ReportesContext;
