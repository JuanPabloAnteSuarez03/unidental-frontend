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

                // Si hay stock suficiente, crear SOLO el movimiento de SALIDA
                // La ENTRADA se creará cuando la transferencia se marque como "Completada"

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
        if (nuevoEstado === "Completada" && transferencia.inboundMovementId) {
            console.warn(
                `Transferencia ${transferId} ya tiene movimiento de entrada: ${transferencia.inboundMovementId}`
            );
            return transferencia; // Ya completada previamente
        }

        // **NUEVO FLUJO**: Manejar cambios de estado con movimientos apropiados

        // CUANDO SE CAMBIA A "APROBADA" (para transferencias pull) → Crear movimiento de SALIDA
        if (
            nuevoEstado === "Aprobada" &&
            authToken &&
            transferencia.productId &&
            transferencia.tipoTransferencia === "pull" &&
            !transferencia.movementId // Solo si no existe movimiento de salida
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
                const stockValidation =
                    await inventoryService.validateStockForTransfer(
                        transferencia.productId,
                        ubicacionOrigen.id,
                        parseInt(transferencia.cantidad),
                        authToken
                    );

                if (!stockValidation.isValid) {
                    throw new Error(
                        `No se puede aprobar la transferencia. Stock insuficiente en ${transferencia.sedeOrigen}. ` +
                            `Disponible: ${stockValidation.availableStock}, ` +
                            `Solicitado: ${stockValidation.requestedQuantity}, ` +
                            `Faltante: ${stockValidation.shortfall}`
                    );
                }

                // Crear SOLO movimiento de salida al aprobar
                const outboundMovementData = {
                    product: transferencia.productId,
                    location: ubicacionOrigen.id,
                    movement_type: "out",
                    quantity: parseInt(transferencia.cantidad),
                    notes: `Transferencia ${transferId} APROBADA - Salida desde ${
                        transferencia.sedeOrigen
                    }: ${transferencia.motivo || "Sin motivo especificado"}`,
                };

                const outboundMovementResponse =
                    await inventoryService.createInventoryMovement(
                        outboundMovementData,
                        authToken
                    );

                transferencia.movementId = outboundMovementResponse.id;
                transferencia.validatedStock = stockValidation;

                console.log(
                    "✅ APROBADA - Movimiento de SALIDA creado:",
                    outboundMovementResponse.id,
                    "Stock validado:",
                    stockValidation
                );
            } catch (error) {
                console.error("Error al aprobar transferencia:", error);
                throw new Error(
                    `Error al aprobar transferencia: ${error.message}`
                );
            }
        }

        // CUANDO SE CAMBIA A "COMPLETADA" → Crear movimiento de ENTRADA en destino
        if (
            nuevoEstado === "Completada" &&
            authToken &&
            transferencia.productId
        ) {
            try {
                // Obtener ubicaciones
                const ubicaciones = await inventoryService.getLocations(
                    authToken
                );

                // SOLO crear movimiento de ENTRADA en destino al completar
                const ubicacionDestino = ubicaciones.find(
                    (ub) => ub.name === transferencia.sedeDestino
                );

                if (!ubicacionDestino) {
                    throw new Error(
                        `No se encontró la ubicación destino: ${transferencia.sedeDestino}`
                    );
                }

                const inboundMovementData = {
                    product: transferencia.productId,
                    location: ubicacionDestino.id,
                    movement_type: "in", // Entrada en la sede destino
                    quantity: parseInt(transferencia.cantidad),
                    notes: `Entrada por transferencia ${transferId} desde ${
                        transferencia.sedeOrigen
                    }: ${transferencia.motivo || "Sin motivo especificado"}`,
                };

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
                transferencia.inboundMovementId = inboundMovementResponse.id;

                console.log(
                    "✅ COMPLETADA - Movimiento de ENTRADA creado:",
                    inboundMovementResponse.id,
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
 * Limpiar todas las transferencias (útil para pruebas)
 */
export const clearAllTransfers = () => {
    try {
        localStorage.removeItem(TRANSFERS_STORAGE_KEY);
        console.log("Todas las transferencias han sido eliminadas");
    } catch (error) {
        console.error("Error al limpiar transferencias:", error);
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
    clearAllTransfers,
    getTransferStats,
    getTransfersFromStorage,
    saveTransfersToStorage,
};

export default transfersService;
