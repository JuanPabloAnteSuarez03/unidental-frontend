import API_CONFIG from "../config/api.js";

/**
 * Obtener todas las órdenes de compra sin paginación para reportes
 * @param {Object} params - Parámetros de filtro
 * @param {string} authToken - Token de autenticación
 * @param {AbortSignal} signal - AbortController signal
 * @returns {Promise<Array>} - Lista completa de órdenes de compra
 */
export const getAllPurchases = async (params = {}, authToken, signal) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        console.log("🔄 Cargando TODAS las órdenes de compra...");
        console.log("📋 Parámetros de filtro:", params);

        const allPurchases = [];
        let nextUrl = new URL(
            `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PURCHASE_ORDERS}`,
            window.location.origin
        );

        // Agregar parámetros de consulta
        Object.keys(params).forEach((key) => {
            if (
                params[key] !== null &&
                params[key] !== undefined &&
                params[key] !== ""
            ) {
                // Convertir fechas al formato YYYY-MM-DD si es necesario
                let value = params[key];
                if (key === "order_date_from" || key === "order_date_to") {
                    if (value instanceof Date) {
                        value = value.toISOString().split("T")[0];
                    } else if (
                        typeof value === "string" &&
                        value.includes("T")
                    ) {
                        value = value.split("T")[0];
                    }
                }
                nextUrl.searchParams.append(key, value);
            }
        });

        // Agregar page_size para optimizar
        nextUrl.searchParams.append("page_size", "100");

        console.log("🔗 URL de la petición:", nextUrl.toString());

        let pageCount = 0;
        const maxPages = 50; // Límite de seguridad

        while (nextUrl && pageCount < maxPages) {
            pageCount++;
            console.log(
                `📄 Cargando página ${pageCount} de órdenes de compra...`
            );

            const response = await fetch(nextUrl.toString(), {
                headers: {
                    Authorization: `Token ${authToken}`,
                    "Content-Type": "application/json",
                },
                signal,
            });

            if (!response.ok) {
                throw new Error(
                    `Error ${response.status}: ${response.statusText}`
                );
            }

            const data = await response.json();
            const purchases = data.results || [];

            // Agregar órdenes de esta página
            allPurchases.push(...purchases);
            console.log(
                `✅ Página ${pageCount}: ${purchases.length} órdenes cargadas`
            );

            // Verificar si hay más páginas
            nextUrl = data.next
                ? new URL(data.next, window.location.origin)
                : null;

            // Si no hay más páginas, terminar
            if (!nextUrl) {
                console.log(
                    `🏁 No hay más páginas. Total de órdenes cargadas: ${allPurchases.length}`
                );
                break;
            }

            if (signal?.aborted) break;
        }

        // Advertencia si llegamos al límite
        if (pageCount >= maxPages) {
            console.warn(
                `⚠️ Se alcanzó el límite de ${maxPages} páginas. Es posible que no se hayan cargado todas las órdenes.`
            );
        }

        return allPurchases;
    } catch (error) {
        if (error.name === "AbortError") {
            console.log("All purchases request was aborted");
            return [];
        }
        console.error("Error fetching all purchases:", error);
        throw error;
    }
};

// Export all functions as a service object
export const purchasesService = {
    getAllPurchases,
};

// Default export
export default purchasesService;
