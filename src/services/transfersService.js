import API_CONFIG from "../config/api.js";
import inventoryService from "./inventoryService.js";

// Clave para localStorage
const TRANSFERS_STORAGE_KEY = "unidental_transfers";

/**
 * Servicio para manejar transferencias internas
 * Usa localStorage para persistencia local y movimientos de inventario para el backend
 */

/**
 * Obtener todas las transferencias del localStorage
 * @returns {Array} Lista de transferencias
 */
export const getTransfersFromStorage = () => {
    try {
        const stored = localStorage.getItem(TRANSFERS_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error("Error al leer transferencias del localStorage:", error);
        return [];
    }
};

/**
 * Guardar transferencias en localStorage
 * @param {Array} transfers - Lista de transferencias
 */
export const saveTransfersToStorage = (transfers) => {
    try {
        localStorage.setItem(TRANSFERS_STORAGE_KEY, JSON.stringify(transfers));
    } catch (error) {
        console.error(
            "Error al guardar transferencias en localStorage:",
            error
        );
    }
};

/**
 * Crear una nueva transferencia
 * @param {Object} transferData - Datos de la transferencia
 * @param {string} authToken - Token de autenticación
 * @returns {Promise<Object>} - Transferencia creada
 */
export const createTransfer = async (transferData, authToken) => {
    try {
        // Crear ID único para la transferencia
        const transferId = `TRF-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`;

        // Crear objeto de transferencia
        const nuevaTransferencia = {
            id: transferId,
            fechaSolicitud: new Date().toLocaleString("es-ES"),
            producto:
                transferData.producto || transferData.selectedProduct?.name,
            productId: transferData.selectedProduct?.id,
            cantidad: parseInt(transferData.cantidad),
            sedeOrigen: transferData.sedeOrigen,
            sedeDestino: transferData.sedeDestino,
            estado:
                transferData.tipoTransferencia === "pull"
                    ? "Pendiente"
                    : "Aprobada", // Se cambiará a "Completada" si se crean ambos movimientos
            solicitadoPor: "Usuario Actual", // TODO: Obtener usuario real del contexto
            motivo: transferData.motivo || "",
            urgencia: transferData.urgencia || "media",
            tipoTransferencia: transferData.tipoTransferencia,
            fechaEntrega: transferData.fechaEntrega || null,
            ultimaActualizacion: new Date().toLocaleString("es-ES"),
            movementId: null, // Se llenará si se crea un movimiento de inventario
            // 🆕 Agregar información de lotes (nuevo formato)
            requiresBatchControl: transferData.requiresBatchControl || false,
            selectedBatches: transferData.selectedBatches || [],
            // Agregar información de lote si está presente (formato legacy)
            batchInfo: transferData.batchInfo || null,
        };

        // Si es un envío (push), validar stock y crear movimiento de inventario
        if (
            transferData.tipoTransferencia === "push" &&
            transferData.selectedProduct &&
            authToken
        ) {
            try {
                // Buscar ubicación origen por nombre
                const ubicaciones = await inventoryService.getLocations(
                    authToken
                );
                const ubicacionOrigen = ubicaciones.find(
                    (ub) => ub.name === transferData.sedeOrigen
                );

                if (!ubicacionOrigen) {
                    throw new Error(
                        `No se encontró la ubicación origen: ${transferData.sedeOrigen}`
                    );
                }

                // VALIDAR STOCK DISPONIBLE antes de crear la transferencia
                const stockValidation =
                    await inventoryService.validateStockForTransfer(
                        transferData.selectedProduct.id,
                        ubicacionOrigen.id,
                        parseInt(transferData.cantidad),
                        authToken
                    );

                if (!stockValidation.isValid) {
                    throw new Error(
                        `Stock insuficiente en ${transferData.sedeOrigen}. ` +
                            `Disponible: ${stockValidation.availableStock}, ` +
                            `Solicitado: ${stockValidation.requestedQuantity}, ` +
                            `Faltante: ${stockValidation.shortfall}`
                    );
                }

                // Preparar datos del movimiento de salida
                const outboundMovementData = {
                    product: transferData.selectedProduct.id,
                    location: ubicacionOrigen.id,
                    movement_type: "out",
                    quantity: parseInt(transferData.cantidad),
                    notes: `Transferencia ${transferId} - SALIDA desde ${
                        transferData.sedeOrigen
                    } hacia ${transferData.sedeDestino}: ${
                        transferData.motivo || "Sin motivo especificado"
                    }`,
                };

                // ✅ AGREGAR INFORMACIÓN DEL LOTE SI ESTÁ PRESENTE
                if (transferData.batchInfo && transferData.batchInfo.batch_id) {
                    outboundMovementData.batch =
                        transferData.batchInfo.batch_id;
                    console.log(
                        `🔗 Asociando movimiento al lote: ${transferData.batchInfo.batch_id} (${transferData.batchInfo.batch_number})`
                    );
                }

                const outboundMovementResponse =
                    await inventoryService.createInventoryMovement(
                        outboundMovementData,
                        authToken
                    );

                // Guardar ID del movimiento de salida
                nuevaTransferencia.movementId = outboundMovementResponse.id;
                nuevaTransferencia.validatedStock = stockValidation;
                nuevaTransferencia.estado = "Aprobada"; // Estado intermedio - requiere completar manualmente

                console.log(
                    "Movimiento de SALIDA creado:",
                    outboundMovementResponse.id,
                    "Stock validado:",
                    stockValidation,
                    transferData.batchInfo
                        ? `Lote: ${transferData.batchInfo.batch_number}`
                        : "Sin lote",
                    "NOTA: La ENTRADA se creará al completar la transferencia"
                );
            } catch (error) {
                console.error(
                    "Error al validar stock o crear movimiento:",
                    error
                );
                // No continuar si hay error de stock - es crítico
                throw error;
            }
        }

        // Obtener transferencias existentes y agregar la nueva
        const transferenciasExistentes = getTransfersFromStorage();
        const transferenciasActualizadas = [
            nuevaTransferencia,
            ...transferenciasExistentes,
        ];

        // Guardar en localStorage
        saveTransfersToStorage(transferenciasActualizadas);

        console.log("Transferencia creada y guardada:", nuevaTransferencia);

        // 🆕 Logging adicional para lotes
        if (
            nuevaTransferencia.requiresBatchControl &&
            nuevaTransferencia.selectedBatches &&
            nuevaTransferencia.selectedBatches.length > 0
        ) {
            console.log(
                `📦 Transferencia con ${nuevaTransferencia.selectedBatches.length} lotes guardada:`,
                nuevaTransferencia.selectedBatches.map(
                    (b) => `${b.batch_number}: ${b.selectedQuantity}`
                )
            );
        }

        return nuevaTransferencia;
    } catch (error) {
        console.error("Error al crear transferencia:", error);
        throw error;
    }
};

/**
 * Obtener todas las transferencias con paginación
 * @param {Object} params - Parámetros de filtro y paginación
 * @param {number} params.page - Página actual
 * @param {number} params.pageSize - Elementos por página
 * @param {Object} filters - Filtros a aplicar
 * @returns {Object} - Objeto con transferencias paginadas
 */
export const getTransfers = (params = {}, filters = {}) => {
    const { page = 1, pageSize = 25 } = params;

    let transferencias = getTransfersFromStorage();

    // Aplicar filtros
    if (filters.estado) {
        transferencias = transferencias.filter(
            (t) => t.estado === filters.estado
        );
    }
    if (filters.sedeOrigen) {
        transferencias = transferencias.filter(
            (t) => t.sedeOrigen === filters.sedeOrigen
        );
    }
    if (filters.sedeDestino) {
        transferencias = transferencias.filter(
            (t) => t.sedeDestino === filters.sedeDestino
        );
    }
    if (filters.tipoTransferencia) {
        transferencias = transferencias.filter(
            (t) => t.tipoTransferencia === filters.tipoTransferencia
        );
    }
    if (filters.producto) {
        transferencias = transferencias.filter(
            (t) =>
                t.producto &&
                t.producto
                    .toLowerCase()
                    .includes(filters.producto.toLowerCase())
        );
    }
    if (filters.fechaDesde) {
        transferencias = transferencias.filter(
            (t) => new Date(t.fechaSolicitud) >= new Date(filters.fechaDesde)
        );
    }
    if (filters.fechaHasta) {
        transferencias = transferencias.filter(
            (t) => new Date(t.fechaSolicitud) <= new Date(filters.fechaHasta)
        );
    }

    // Calcular paginación
    const totalCount = transferencias.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const transferenciasPage = transferencias.slice(startIndex, endIndex);

    return {
        results: transferenciasPage,
        count: totalCount,
        totalPages,
        currentPage: page,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
    };
};

/**
 * Actualizar el estado de una transferencia
 * @param {string} transferId - ID de la transferencia
 * @param {string} nuevoEstado - Nuevo estado
 * @param {string} authToken - Token de autenticación (opcional, requerido para "Completada")
 * @returns {Promise<Object|null>} - Transferencia actualizada o null si no se encuentra
 */
export const updateTransferStatus = async (
    transferId,
    nuevoEstado,
    authToken = null
) => {
    try {
        const transferencias = getTransfersFromStorage();
        const index = transferencias.findIndex((t) => t.id === transferId);

        if (index === -1) {
            console.warn("Transferencia no encontrada:", transferId);
            return null;
        }

        const transferencia = transferencias[index];
        const estadoAnterior = transferencia.estado;

        // **VALIDACIONES CRÍTICAS**: Prevenir cambios de estado duplicados y movimientos múltiples

        // 1. No permitir cambiar a un estado que ya tiene
        if (estadoAnterior === nuevoEstado) {
            console.warn(
                `Transferencia ${transferId} ya está en estado: ${nuevoEstado}`
            );
            return transferencia; // No hacer cambios
        }

        // 2. Validar transiciones de estado válidas
        const transicionesValidas = {
            Pendiente: ["Aprobada", "Rechazada"],
            Aprobada: ["En Tránsito", "Completada", "Rechazada"], // Puede ir directo a completada o pasar por en tránsito
            "En Tránsito": ["Completada", "Rechazada"], // Estado intermedio para envíos
            Completada: [], // Estado final - no se puede cambiar
            Rechazada: [], // Estado final - no se puede cambiar
        };

        if (!transicionesValidas[estadoAnterior]?.includes(nuevoEstado)) {
            throw new Error(
                `Transición de estado inválida: "${estadoAnterior}" → "${nuevoEstado}". ` +
                    `Transiciones permitidas desde "${estadoAnterior}": ${
                        transicionesValidas[estadoAnterior]?.join(", ") ||
                        "ninguna"
                    }`
            );
        }

        // 3. Prevenir movimientos duplicados - verificar si ya existen
        if (
            nuevoEstado === "Completada" &&
            (transferencia.inboundMovementId ||
                transferencia.inboundMovementIds)
        ) {
            console.warn(
                `Transferencia ${transferId} ya tiene movimientos de entrada:`,
                transferencia.inboundMovementId ||
                    transferencia.inboundMovementIds
            );
            return transferencia; // Ya completada previamente
        }

        // **NUEVO FLUJO CORREGIDO**: Manejar cambios de estado con movimientos apropiados

        // 1. CUANDO SE CAMBIA A "APROBADA" → SOLO CAMBIAR ESTADO (sin movimientos)
        if (nuevoEstado === "Aprobada") {
            console.log(
                `✅ APROBADA - Transferencia ${transferId} aprobada sin crear movimientos de inventario`
            );
            // No crear movimientos aquí, solo cambiar estado
        }

        // 2. CUANDO SE CAMBIA A "EN TRÁNSITO" o "ENVIADA" → Crear movimiento de SALIDA (descontar stock)
        if (
            (nuevoEstado === "En Tránsito" || nuevoEstado === "Enviada") &&
            authToken &&
            transferencia.productId &&
            !transferencia.movementId && // Solo si no existe movimiento de salida
            !transferencia.movementIds // Para transferencias con lotes
        ) {
            try {
                const ubicaciones = await inventoryService.getLocations(
                    authToken
                );
                const ubicacionOrigen = ubicaciones.find(
                    (ub) => ub.name === transferencia.sedeOrigen
                );

                if (!ubicacionOrigen) {
                    throw new Error(
                        `No se encontró la ubicación origen: ${transferencia.sedeOrigen}`
                    );
                }

                // Validar stock disponible en origen
                // 🆕 Validación mejorada para transferencias con control de lotes
                if (
                    transferencia.requiresBatchControl &&
                    transferencia.selectedBatches &&
                    transferencia.selectedBatches.length > 0
                ) {
                    // Para productos con control de lotes, validar lote por lote
                    console.log(
                        "🔍 VALIDANDO STOCK POR LOTES:",
                        transferencia.selectedBatches
                    );

                    let totalValidatedQuantity = 0;
                    for (const batchInfo of transferencia.selectedBatches) {
                        // Verificar que el lote tenga la cantidad requerida
                        if (
                            batchInfo.selectedQuantity >
                            batchInfo.availableStock
                        ) {
                            throw new Error(
                                `Stock insuficiente en lote ${batchInfo.batch_number}. ` +
                                    `Disponible: ${batchInfo.availableStock}, ` +
                                    `Solicitado: ${batchInfo.selectedQuantity}`
                            );
                        }
                        totalValidatedQuantity += batchInfo.selectedQuantity;
                    }

                    // Verificar que la suma de lotes coincida con la cantidad total
                    if (
                        totalValidatedQuantity !==
                        parseInt(transferencia.cantidad)
                    ) {
                        throw new Error(
                            `Inconsistencia en cantidades. Total de lotes: ${totalValidatedQuantity}, ` +
                                `Cantidad solicitada: ${transferencia.cantidad}`
                        );
                    }

                    console.log("✅ VALIDACIÓN DE LOTES EXITOSA:", {
                        totalValidatedQuantity,
                        batchCount: transferencia.selectedBatches.length,
                    });
                } else {
                    // Validación tradicional para productos sin control de lotes
                    const stockValidation =
                        await inventoryService.validateStockForTransfer(
                            transferencia.productId,
                            ubicacionOrigen.id,
                            parseInt(transferencia.cantidad),
                            authToken
                        );

                    if (!stockValidation.isValid) {
                        throw new Error(
                            `No se puede enviar la transferencia. Stock insuficiente en ${transferencia.sedeOrigen}. ` +
                                `Disponible: ${stockValidation.availableStock}, ` +
                                `Solicitado: ${stockValidation.requestedQuantity}, ` +
                                `Faltante: ${stockValidation.shortfall}`
                        );
                    }

                    transferencia.validatedStock = stockValidation;
                }

                // 🆕 Crear movimientos de salida para transferencias con o sin lotes
                if (
                    transferencia.requiresBatchControl &&
                    transferencia.selectedBatches &&
                    transferencia.selectedBatches.length > 0
                ) {
                    // Para productos con control de lotes, crear un movimiento por cada lote
                    console.log("📦 CREANDO MOVIMIENTOS DE SALIDA POR LOTES");
                    const movementIds = [];

                    for (const batchInfo of transferencia.selectedBatches) {
                        const outboundMovementData = {
                            product: transferencia.productId,
                            location: ubicacionOrigen.id,
                            movement_type: "out",
                            quantity: batchInfo.selectedQuantity,
                            batch: batchInfo.batch_id,
                            notes: `Transferencia ${transferId} ENVIADA - Salida desde ${
                                transferencia.sedeOrigen
                            } - Lote ${batchInfo.batch_number}: ${
                                transferencia.motivo ||
                                "Sin motivo especificado"
                            }`,
                        };

                        const outboundMovementResponse =
                            await inventoryService.createInventoryMovement(
                                outboundMovementData,
                                authToken
                            );

                        movementIds.push(outboundMovementResponse.id);
                        console.log(
                            `✅ Movimiento de salida creado para lote ${batchInfo.batch_number}:`,
                            outboundMovementResponse.id
                        );
                    }

                    transferencia.movementIds = movementIds; // Array de movimientos
                } else {
                    // Crear movimiento de salida (sin lotes)
                    const outboundMovementData = {
                        product: transferencia.productId,
                        location: ubicacionOrigen.id,
                        movement_type: "out",
                        quantity: parseInt(transferencia.cantidad),
                        notes: `Transferencia ${transferId} ENVIADA - Salida desde ${
                            transferencia.sedeOrigen
                        }: ${
                            transferencia.motivo || "Sin motivo especificado"
                        }`,
                    };

                    const outboundMovementResponse =
                        await inventoryService.createInventoryMovement(
                            outboundMovementData,
                            authToken
                        );

                    transferencia.movementId = outboundMovementResponse.id;
                }

                console.log(
                    `✅ ${nuevoEstado.toUpperCase()} - Movimientos de SALIDA creados:`,
                    transferencia.movementIds || transferencia.movementId,
                    transferencia.requiresBatchControl
                        ? "Con control de lotes"
                        : "Sin control de lotes"
                );
            } catch (error) {
                console.error("Error al enviar transferencia:", error);
                throw new Error(
                    `Error al enviar transferencia: ${error.message}`
                );
            }
        }

        // 3. CUANDO SE CAMBIA A "COMPLETADA" o "RECIBIDA" → Crear movimiento de ENTRADA (sumar stock)
        if (
            (nuevoEstado === "Completada" || nuevoEstado === "Recibida") &&
            authToken &&
            transferencia.productId &&
            !transferencia.inboundMovementId && // Solo si no existe movimiento de entrada
            !transferencia.inboundMovementIds // Para transferencias con lotes
        ) {
            console.log(`🎯 INICIANDO COMPLETAR TRANSFERENCIA ${transferId}`);
            console.log("📋 Datos de transferencia:", {
                id: transferencia.id,
                producto: transferencia.producto,
                productId: transferencia.productId,
                cantidad: transferencia.cantidad,
                sedeOrigen: transferencia.sedeOrigen,
                sedeDestino: transferencia.sedeDestino,
                requiresBatchControl: transferencia.requiresBatchControl,
                selectedBatches: transferencia.selectedBatches,
                movementId: transferencia.movementId,
                movementIds: transferencia.movementIds,
                inboundMovementId: transferencia.inboundMovementId,
                inboundMovementIds: transferencia.inboundMovementIds,
            });
            try {
                // Obtener ubicaciones
                const ubicaciones = await inventoryService.getLocations(
                    authToken
                );

                // 🆕 Si no hay movimientos de salida, crearlos primero (flujo directo Aprobada -> Completada)
                if (!transferencia.movementId && !transferencia.movementIds) {
                    console.log(
                        "⚠️ COMPLETADA sin movimientos de salida - Creando movimientos de salida automáticamente"
                    );

                    const ubicacionOrigen = ubicaciones.find(
                        (ub) => ub.name === transferencia.sedeOrigen
                    );

                    if (!ubicacionOrigen) {
                        throw new Error(
                            `No se encontró la ubicación origen: ${transferencia.sedeOrigen}`
                        );
                    }

                    // Crear movimientos de salida según el tipo de producto
                    if (
                        transferencia.requiresBatchControl &&
                        transferencia.selectedBatches &&
                        transferencia.selectedBatches.length > 0
                    ) {
                        // Para productos con control de lotes
                        const movementIds = [];

                        for (const batchInfo of transferencia.selectedBatches) {
                            const outboundMovementData = {
                                product: transferencia.productId,
                                location: ubicacionOrigen.id,
                                movement_type: "out",
                                quantity: batchInfo.selectedQuantity,
                                notes: `Transferencia ${transferId} COMPLETADA - Salida automática desde ${
                                    transferencia.sedeOrigen
                                } - Lote ${batchInfo.batch_number}: ${
                                    transferencia.motivo ||
                                    "Sin motivo especificado"
                                }`,
                            };

                            // Solo agregar el campo batch si batch_id no es null (no es lote virtual)
                            if (batchInfo.batch_id !== null) {
                                outboundMovementData.batch = batchInfo.batch_id;
                            }

                            const outboundMovementResponse =
                                await inventoryService.createInventoryMovement(
                                    outboundMovementData,
                                    authToken
                                );
                            movementIds.push(outboundMovementResponse.id);
                        }

                        transferencia.movementIds = movementIds;
                    } else {
                        // Para productos sin control de lotes
                        const outboundMovementData = {
                            product: transferencia.productId,
                            location: ubicacionOrigen.id,
                            movement_type: "out",
                            quantity: parseInt(transferencia.cantidad),
                            notes: `Transferencia ${transferId} COMPLETADA - Salida automática desde ${
                                transferencia.sedeOrigen
                            }: ${
                                transferencia.motivo ||
                                "Sin motivo especificado"
                            }`,
                        };

                        const outboundMovementResponse =
                            await inventoryService.createInventoryMovement(
                                outboundMovementData,
                                authToken
                            );
                        transferencia.movementId = outboundMovementResponse.id;
                    }
                }

                // CREAR movimiento de ENTRADA en destino
                const ubicacionDestino = ubicaciones.find(
                    (ub) => ub.name === transferencia.sedeDestino
                );

                if (!ubicacionDestino) {
                    throw new Error(
                        `No se encontró la ubicación destino: ${transferencia.sedeDestino}`
                    );
                }

                // 🆕 Verificar si el producto requiere control de lotes
                let productRequiresBatches = transferencia.requiresBatchControl;

                // Si no está definido, intentar obtener lotes para determinar si requiere control de lotes
                if (
                    productRequiresBatches === undefined &&
                    transferencia.productId
                ) {
                    try {
                        console.log(
                            `🔍 Verificando si el producto ${transferencia.producto} requiere control de lotes...`
                        );

                        // Obtener ubicaciones para convertir nombre a ID
                        const ubicaciones = await inventoryService.getLocations(
                            authToken
                        );
                        const ubicacionOrigen = ubicaciones.find(
                            (ub) => ub.name === transferencia.sedeOrigen
                        );

                        if (!ubicacionOrigen) {
                            throw new Error(
                                `No se encontró la ubicación origen: ${transferencia.sedeOrigen}`
                            );
                        }

                        // Intentar obtener lotes disponibles - si el producto requiere lotes, debería devolver datos
                        const batchesResponse =
                            await inventoryService.getBatchesWithStockAtLocation(
                                transferencia.productId,
                                ubicacionOrigen.id,
                                authToken
                            );

                        // Si devuelve un array (incluso vacío), significa que el producto soporta lotes
                        productRequiresBatches = Array.isArray(batchesResponse);
                        transferencia.requiresBatchControl =
                            productRequiresBatches;

                        console.log(
                            `🔍 Producto ${transferencia.producto} requiere control de lotes: ${productRequiresBatches}`
                        );
                    } catch (error) {
                        console.warn(
                            "⚠️ No se pudo verificar si el producto requiere control de lotes:",
                            error
                        );
                        // En caso de error, asumir que SÍ requiere control de lotes por seguridad
                        // Esto evitará el error "Este producto requiere especificar un lote"
                        productRequiresBatches = true;
                        transferencia.requiresBatchControl = true;
                        console.log(
                            "🔒 Por seguridad, asumiendo que el producto requiere control de lotes"
                        );
                    }
                }

                // 🆕 Para transferencias con control de lotes que no tienen selectedBatches,
                // cargar automáticamente los lotes disponibles
                if (
                    productRequiresBatches &&
                    (!transferencia.selectedBatches ||
                        transferencia.selectedBatches.length === 0)
                ) {
                    console.log(
                        "⚠️ Transferencia requiere lotes pero no tiene selectedBatches - Cargando lotes automáticamente"
                    );

                    try {
                        // Obtener ubicaciones para convertir nombre a ID
                        const ubicaciones = await inventoryService.getLocations(
                            authToken
                        );
                        const ubicacionOrigen = ubicaciones.find(
                            (ub) => ub.name === transferencia.sedeOrigen
                        );

                        if (!ubicacionOrigen) {
                            throw new Error(
                                `No se encontró la ubicación origen: ${transferencia.sedeOrigen}`
                            );
                        }

                        // Cargar lotes disponibles para el producto en la sede origen
                        console.log(
                            `🔍 Cargando lotes para producto ${transferencia.productId} en ubicación ${ubicacionOrigen.id} (${transferencia.sedeOrigen})`
                        );

                        const batchesResponse =
                            await inventoryService.getBatchesWithStockAtLocation(
                                transferencia.productId,
                                ubicacionOrigen.id,
                                authToken
                            );

                        console.log("📦 Respuesta de lotes:", batchesResponse);
                        console.log(
                            "📦 Tipo de respuesta:",
                            typeof batchesResponse
                        );
                        console.log(
                            "📦 Es array:",
                            Array.isArray(batchesResponse)
                        );
                        console.log("📦 Longitud:", batchesResponse?.length);

                        if (!batchesResponse || batchesResponse.length === 0) {
                            console.warn(
                                `⚠️ No hay lotes con stock disponibles para el producto en ${transferencia.sedeOrigen}`
                            );
                            console.log(
                                "🔄 Creando lote virtual para completar la transferencia..."
                            );

                            // Crear un lote virtual para permitir que la transferencia se complete
                            transferencia.selectedBatches = [
                                {
                                    batch_id: null, // Lote virtual
                                    batch_number: "VIRTUAL",
                                    selectedQuantity: parseInt(
                                        transferencia.cantidad
                                    ),
                                    availableStock: parseInt(
                                        transferencia.cantidad
                                    ),
                                    expiry_date: null,
                                },
                            ];

                            console.log(
                                "✅ Lote virtual creado:",
                                transferencia.selectedBatches
                            );
                        } else {
                            // Seleccionar automáticamente los lotes necesarios (FIFO - First In, First Out)
                            const sortedBatches = batchesResponse
                                .filter((batch) => batch.quantity > 0)
                                .sort(
                                    (a, b) =>
                                        new Date(a.expiry_date) -
                                        new Date(b.expiry_date)
                                ); // Ordenar por fecha de vencimiento

                            let remainingQuantity = parseInt(
                                transferencia.cantidad
                            );
                            const selectedBatches = [];

                            for (const batch of sortedBatches) {
                                if (remainingQuantity <= 0) break;

                                const quantityToTake = Math.min(
                                    remainingQuantity,
                                    batch.quantity
                                );
                                selectedBatches.push({
                                    batch_id: batch.batch_id || batch.id,
                                    batch_number: batch.batch_number,
                                    selectedQuantity: quantityToTake,
                                    availableStock: batch.quantity,
                                    expiry_date: batch.expiry_date,
                                });

                                remainingQuantity -= quantityToTake;
                            }

                            if (remainingQuantity > 0) {
                                throw new Error(
                                    `Stock insuficiente en lotes. Faltante: ${remainingQuantity}`
                                );
                            }

                            // Asignar los lotes seleccionados automáticamente a la transferencia
                            transferencia.selectedBatches = selectedBatches;
                            transferencia.requiresBatchControl = true;

                            console.log(
                                "✅ Lotes seleccionados automáticamente:",
                                selectedBatches
                            );
                        }
                    } catch (batchError) {
                        console.error(
                            "❌ Error al cargar lotes automáticamente:",
                            batchError
                        );
                        throw new Error(
                            `Error al cargar lotes para la transferencia: ${batchError.message}`
                        );
                    }
                }

                // 🆕 Crear movimientos de entrada para transferencias con o sin lotes
                if (
                    productRequiresBatches &&
                    transferencia.selectedBatches &&
                    transferencia.selectedBatches.length > 0
                ) {
                    // Para productos con control de lotes, crear un movimiento de entrada por cada lote
                    console.log("📦 CREANDO MOVIMIENTOS DE ENTRADA POR LOTES");
                    const inboundMovementIds = [];

                    for (const batchInfo of transferencia.selectedBatches) {
                        const inboundMovementData = {
                            product: transferencia.productId,
                            location: ubicacionDestino.id,
                            movement_type: "in",
                            quantity: batchInfo.selectedQuantity,
                            notes: `Entrada por transferencia ${transferId} desde ${
                                transferencia.sedeOrigen
                            } - Lote ${batchInfo.batch_number}: ${
                                transferencia.motivo ||
                                "Sin motivo especificado"
                            }`,
                        };

                        // Solo agregar el campo batch si batch_id no es null (no es lote virtual)
                        if (batchInfo.batch_id !== null) {
                            inboundMovementData.batch = batchInfo.batch_id;
                        }

                        console.log(
                            `🎯 COMPLETADA - Registrando entrada de lote ${batchInfo.batch_number}:`,
                            inboundMovementData
                        );

                        const inboundMovementResponse =
                            await inventoryService.createInventoryMovement(
                                inboundMovementData,
                                authToken
                            );

                        inboundMovementIds.push(inboundMovementResponse.id);
                        console.log(
                            `✅ Movimiento de entrada creado para lote ${batchInfo.batch_number}:`,
                            inboundMovementResponse.id
                        );
                    }

                    transferencia.inboundMovementIds = inboundMovementIds; // Array de movimientos
                } else {
                    // Para productos sin control de lotes (método tradicional)
                    const inboundMovementData = {
                        product: transferencia.productId,
                        location: ubicacionDestino.id,
                        movement_type: "in", // Entrada en la sede destino
                        quantity: parseInt(transferencia.cantidad),
                        notes: `Entrada por transferencia ${transferId} desde ${
                            transferencia.sedeOrigen
                        }: ${
                            transferencia.motivo || "Sin motivo especificado"
                        }`,
                    };

                    // ✅ AGREGAR INFORMACIÓN DEL LOTE SI EXISTE (compatibilidad con transferencias viejas)
                    if (
                        transferencia.batchInfo &&
                        transferencia.batchInfo.batch_id
                    ) {
                        inboundMovementData.batch =
                            transferencia.batchInfo.batch_id;
                        console.log(
                            `🔗 COMPLETADA - Asociando entrada al lote: ${transferencia.batchInfo.batch_id} (${transferencia.batchInfo.batch_number})`
                        );
                    }

                    console.log(
                        "🎯 COMPLETADA - Registrando entrada en sede destino:",
                        inboundMovementData
                    );

                    const inboundMovementResponse =
                        await inventoryService.createInventoryMovement(
                            inboundMovementData,
                            authToken
                        );

                    // Agregar el ID del movimiento de entrada a la transferencia
                    transferencia.inboundMovementId =
                        inboundMovementResponse.id;
                }

                console.log(
                    "✅ COMPLETADA - Movimientos de ENTRADA creados:",
                    transferencia.inboundMovementIds ||
                        transferencia.inboundMovementId,
                    transferencia.requiresBatchControl
                        ? "Con control de lotes"
                        : "Sin control de lotes",
                    "Transferencia finalizada correctamente"
                );
            } catch (error) {
                console.error("❌ Error al completar transferencia:", error);
                // No continuar si hay error - es crítico
                throw new Error(
                    `Error al completar transferencia: ${error.message}`
                );
            }
        }

        // Actualizar transferencia
        transferencias[index] = {
            ...transferencia,
            estado: nuevoEstado,
            ultimaActualizacion: new Date().toLocaleString("es-ES"),
        };

        // Guardar cambios
        saveTransfersToStorage(transferencias);

        console.log(
            `Estado de transferencia ${transferId} actualizado a: ${nuevoEstado}`
        );
        return transferencias[index];
    } catch (error) {
        console.error("Error al actualizar estado de transferencia:", error);
        throw error; // Propagar el error para manejo en la UI
    }
};

/**
 * Obtener una transferencia por ID
 * @param {string} transferId - ID de la transferencia
 * @returns {Object|null} - Transferencia encontrada o null
 */
export const getTransferById = (transferId) => {
    try {
        const transferencias = getTransfersFromStorage();
        return transferencias.find((t) => t.id === transferId) || null;
    } catch (error) {
        console.error("Error al obtener transferencia por ID:", error);
        return null;
    }
};

/**
 * Eliminar una transferencia
 * @param {string} transferId - ID de la transferencia
 * @returns {boolean} - True si se eliminó exitosamente
 */
export const deleteTransfer = (transferId) => {
    try {
        const transferencias = getTransfersFromStorage();
        const transferenciasActualizadas = transferencias.filter(
            (t) => t.id !== transferId
        );

        if (transferencias.length === transferenciasActualizadas.length) {
            console.warn(
                "Transferencia no encontrada para eliminar:",
                transferId
            );
            return false;
        }

        saveTransfersToStorage(transferenciasActualizadas);
        console.log("Transferencia eliminada:", transferId);
        return true;
    } catch (error) {
        console.error("Error al eliminar transferencia:", error);
        return false;
    }
};

/**
 * Obtener estadísticas de transferencias
 * @returns {Object} - Estadísticas
 */
export const getTransferStats = () => {
    try {
        const transferencias = getTransfersFromStorage();

        const stats = {
            total: transferencias.length,
            porEstado: {},
            porTipo: {},
            porUrgencia: {},
        };

        transferencias.forEach((t) => {
            // Contar por estado
            stats.porEstado[t.estado] = (stats.porEstado[t.estado] || 0) + 1;

            // Contar por tipo
            stats.porTipo[t.tipoTransferencia] =
                (stats.porTipo[t.tipoTransferencia] || 0) + 1;

            // Contar por urgencia
            stats.porUrgencia[t.urgencia] =
                (stats.porUrgencia[t.urgencia] || 0) + 1;
        });

        return stats;
    } catch (error) {
        console.error("Error al obtener estadísticas:", error);
        return { total: 0, porEstado: {}, porTipo: {}, porUrgencia: {} };
    }
};

// Export del servicio completo
const transfersService = {
    createTransfer,
    getTransfers,
    updateTransferStatus,
    getTransferById,
    deleteTransfer,
    getTransferStats,
    getTransfersFromStorage,
    saveTransfersToStorage,
};

export default transfersService;
