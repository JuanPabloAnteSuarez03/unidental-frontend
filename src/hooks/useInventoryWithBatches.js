import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { getBatches, getExpiringSoonBatches } from "../services/batchesService";

/**
 * Hook personalizado para manejar datos de lotes y vencimientos
 * junto con el inventario
 */
export const useInventoryWithBatches = () => {
    const { authToken } = useAuth();
    const [batchesData, setBatchesData] = useState({});
    const [expiringBatches, setExpiringBatches] = useState({});
    const [isBatchesLoading, setIsBatchesLoading] = useState(false);

    // Cargar datos de lotes
    const loadBatchesData = useCallback(async () => {
        if (!authToken) return;

        setIsBatchesLoading(true);
        try {
            console.log("🔍 Cargando datos de lotes...");

            // Intentar cargar todos los lotes primero
            const allBatches = await getBatches({}, authToken);
            console.log("📦 Todos los lotes cargados:", allBatches);

            // También intentar cargar lotes próximos a vencer (180 días para ser más amplio)
            const expiring = await getExpiringSoonBatches(
                { days: 180 },
                authToken
            );
            console.log("⏰ Lotes próximos a vencer:", expiring);

            // Combinar ambos resultados para tener más datos
            const allBatchesArray = allBatches.results || allBatches || [];
            const expiringArray = expiring.results || expiring || [];

            // Unir ambos arrays sin duplicados
            const combinedBatches = [
                ...allBatchesArray,
                ...expiringArray.filter(
                    (batch) =>
                        !allBatchesArray.some(
                            (existingBatch) => existingBatch.id === batch.id
                        )
                ),
            ];

            console.log("🔗 Lotes combinados:", combinedBatches);

            // Organizar por producto ID
            const batchesByProduct = {};
            const expiringByProduct = {};

            combinedBatches.forEach((batch) => {
                console.log("🧪 Procesando lote:", batch);

                if (batch.product) {
                    const productId = batch.product;

                    if (!batchesByProduct[productId]) {
                        batchesByProduct[productId] = [];
                        expiringByProduct[productId] = null;
                    }

                    batchesByProduct[productId].push(batch);

                    // Guardar el batch con vencimiento más próximo (si tiene fecha de vencimiento)
                    if (
                        batch.expiry_date &&
                        (!expiringByProduct[productId] ||
                            new Date(batch.expiry_date) <
                                new Date(
                                    expiringByProduct[productId].expiry_date
                                ))
                    ) {
                        expiringByProduct[productId] = batch;
                        console.log(
                            `📅 Lote más próximo para producto ${productId}:`,
                            batch
                        );
                    }
                }
            });

            console.log("📊 Lotes organizados por producto:", batchesByProduct);
            console.log(
                "⚠️ Próximos vencimientos por producto:",
                expiringByProduct
            );

            setBatchesData(batchesByProduct);
            setExpiringBatches(expiringByProduct);
        } catch (error) {
            console.error("❌ Error loading batches data:", error);
        } finally {
            setIsBatchesLoading(false);
        }
    }, [authToken]);

    // Cargar datos al montar el componente
    useEffect(() => {
        loadBatchesData();
    }, [loadBatchesData]);

    // Función para obtener el próximo vencimiento de un producto
    const getNextExpiry = useCallback(
        (productId) => {
            console.log(`🔍 Buscando vencimiento para producto ${productId}`);
            const expiringBatch = expiringBatches[productId];
            console.log(`📦 Lote encontrado:`, expiringBatch);

            if (!expiringBatch || !expiringBatch.expiry_date) {
                console.log(
                    `❌ No hay lote con vencimiento para producto ${productId}`
                );
                return null;
            }

            const expiryDate = new Date(expiringBatch.expiry_date);
            const today = new Date();
            const daysToExpiry = Math.ceil(
                (expiryDate - today) / (1000 * 60 * 60 * 24)
            );

            const result = {
                date: expiryDate,
                daysToExpiry,
                batchNumber: expiringBatch.batch_number,
                isExpired: daysToExpiry < 0,
                isExpiringSoon: daysToExpiry <= 30 && daysToExpiry >= 0,
                isCritical: daysToExpiry <= 7 && daysToExpiry >= 0,
            };

            console.log(
                `📅 Información de vencimiento para producto ${productId}:`,
                result
            );
            return result;
        },
        [expiringBatches]
    );

    // Función para formatear fecha de vencimiento
    const formatExpiryDate = useCallback(
        (productId) => {
            console.log(`🎨 Formateando fecha para producto ${productId}`);
            const expiryInfo = getNextExpiry(productId);
            if (!expiryInfo) {
                console.log(
                    `❌ No hay información de vencimiento para producto ${productId}`
                );
                return "N/A";
            }

            const {
                date,
                daysToExpiry,
                isExpired,
                isExpiringSoon,
                isCritical,
            } = expiryInfo;

            let result;
            if (isExpired) result = `Vencido (${Math.abs(daysToExpiry)} días)`;
            else if (isCritical) result = `${daysToExpiry} días ⚠️`;
            else if (isExpiringSoon) result = `${daysToExpiry} días`;
            else
                result = date.toLocaleDateString("es-CO", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                });

            console.log(
                `✅ Fecha formateada para producto ${productId}: ${result}`
            );
            return result;
        },
        [getNextExpiry]
    );

    // Función para obtener el color del estado de vencimiento
    const getExpiryColor = useCallback(
        (productId) => {
            const expiryInfo = getNextExpiry(productId);
            if (!expiryInfo) return "#6c757d";

            const { isExpired, isExpiringSoon, isCritical } = expiryInfo;

            if (isExpired) return "#dc3545";
            if (isCritical) return "#fd7e14";
            if (isExpiringSoon) return "#ffc107";
            return "#28a745";
        },
        [getNextExpiry]
    );

    return {
        batchesData,
        expiringBatches,
        isBatchesLoading,
        getNextExpiry,
        formatExpiryDate,
        getExpiryColor,
        reloadBatches: loadBatchesData,
    };
};
