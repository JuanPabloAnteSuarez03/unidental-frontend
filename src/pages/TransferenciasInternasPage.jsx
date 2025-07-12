import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useProducts } from "../context/ProductsContext";
import {
    getInventoryMovements,
    createInventoryMovement,
} from "../services/inventoryService";
import { updateMovementStatus } from "../services/inventoryService";
import { completeTransfer, cancelTransfer } from "../services/transfersService";
import TransferHeader from "../components/Transfers/TransferHeader";
import TransferNotification from "../components/Transfers/TransferNotification";
import TransferFilters from "../components/Transfers/TransferFilters";
import SimpleTransferForm from "../components/Transfers/SimpleTransferForm";

import TransfersTable from "../components/Transfers/TransfersTable";
import TransfersPagination from "../components/Transfers/TransfersPagination";

const TransferenciasInternasPage = () => {
    const { authToken } = useAuth();
    const { refreshCache } = useProducts();

    // Estados para los filtros del historial
    const [filters, setFilters] = useState({
        producto: "",
    });

    // Estado para el historial de movimientos de transferencias internas
    const [allMovimientos, setAllMovimientos] = useState([]); // Todos los movimientos sin filtrar
    const [movimientos, setMovimientos] = useState([]); // Movimientos filtrados y paginados
    const [isLoadingMovements, setIsLoadingMovements] = useState(false);
    const [movementsData, setMovementsData] = useState({
        totalCount: 0,
        totalPages: 0,
        currentPage: 1,
    });

    // Estado para notificaciones
    const [notification, setNotification] = useState({
        show: false,
        type: "",
        message: "",
    });
    const [changingStates, setChangingStates] = useState(new Set()); // IDs de transferencias cuyo estado se está cambiando
    const processingMovements = useRef(new Set()); // Ref para rastrear movimientos en proceso sin re-renders

    // Estados para paginación (ahora usando movementsData)
    const { currentPage, totalPages, totalCount } = movementsData;

    const estados = [
        "Pendiente",
        "Aprobada",
        "En Tránsito",
        "Completada",
        "Rechazada",
        "Cancelada",
    ];

    // Función para cargar movimientos de transferencias internas desde el servidor
    const loadMovementsFromServer = useCallback(async () => {
        setIsLoadingMovements(true);
        try {
            // Get more data to ensure we have enough internal transfer movements
            const params = {
                page: 1,
                page_size: 100, // Get more records since we'll filter client-side
            };
            const result = await getInventoryMovements(params, authToken);

            // Filter movements to only show internal transfers (client-side filter since backend filter is not working)
            const allInternalTransferMovements =
                result.results?.filter(
                    (movement) => movement.is_internal_transfer === true
                ) || [];

            setAllMovimientos(allInternalTransferMovements);
            // Aplicar filtros localmente después de cargar
            applyLocalFilters(allInternalTransferMovements, 1);
        } catch (error) {
            console.error("Error al cargar movimientos:", error);
            setNotification({
                show: true,
                type: "error",
                message: "Error al cargar los movimientos de transferencias",
            });
        } finally {
            setIsLoadingMovements(false);
        }
    }, [authToken]);

    // Función para aplicar filtros localmente
    const applyLocalFilters = useCallback(
        (movements = allMovimientos, page = 1) => {
            let filteredMovements = [...movements];

            // Filtrar por producto (búsqueda local)
            if (filters.producto && filters.producto.trim()) {
                const searchTerm = filters.producto.toLowerCase().trim();
                filteredMovements = filteredMovements.filter((movement) => {
                    const productName =
                        movement.product_name?.toLowerCase() || "";
                    const productSku =
                        movement.product_sku?.toLowerCase() || "";
                    return (
                        productName.includes(searchTerm) ||
                        productSku.includes(searchTerm)
                    );
                });
            }

            // Aplicar paginación local
            const itemsPerPage = 25;
            const startIndex = (page - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const paginatedMovements = filteredMovements.slice(
                startIndex,
                endIndex
            );

            setMovimientos(paginatedMovements);
            setMovementsData({
                totalCount: filteredMovements.length,
                totalPages: Math.ceil(filteredMovements.length / itemsPerPage),
                currentPage: page,
            });
        },
        [filters.producto, allMovimientos]
    );

    // Cargar movimientos al montar el componente
    useEffect(() => {
        if (authToken) {
            loadMovementsFromServer();
        }
    }, [authToken, loadMovementsFromServer]);

    // Aplicar filtros cuando cambien los filtros locales
    useEffect(() => {
        if (allMovimientos.length > 0) {
            applyLocalFilters(allMovimientos, 1);
        }
    }, [filters.producto, allMovimientos, applyLocalFilters]);

    // Funciones para manejar filtros
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters({
            ...filters,
            [name]: value,
        });
    };

    const applyFilters = () => {
        // Los filtros se aplican automáticamente, solo mostrar notificación
        setNotification({
            show: true,
            type: "success",
            message: "Filtros aplicados correctamente",
        });

        setTimeout(() => {
            setNotification({ show: false, type: "", message: "" });
        }, 3000);
    };

    const clearFilters = () => {
        const emptyFilters = {
            producto: "",
        };

        setFilters(emptyFilters);

        setNotification({
            show: true,
            type: "success",
            message: "Filtros limpiados correctamente",
        });

        setTimeout(() => {
            setNotification({ show: false, type: "", message: "" });
        }, 3000);
    };

    // Función para manejar cambio de página
    const handlePageChange = (page) => {
        applyLocalFilters(allMovimientos, page);
    };

    // Función para manejar cuando se crea una nueva transferencia
    const handleTransferCreated = (newTransfer) => {
        // Recargar la lista de transferencias para mostrar la nueva
        loadMovementsFromServer();

        setNotification({
            show: true,
            type: "success",
            message: `Transferencia ${newTransfer.id} creada exitosamente`,
        });

        setTimeout(() => {
            setNotification({ show: false, type: "", message: "" });
        }, 5000);
    };

    // Función para completar una transferencia
    const handleCompletarTransferencia = async (movementId) => {
        if (processingMovements.current.has(movementId)) {
            console.log(`Movimiento ${movementId} ya está siendo procesado`);
            return;
        }

        processingMovements.current.add(movementId);
        setChangingStates((prev) => new Set([...prev, movementId]));

        try {
            console.log(`🔄 Completando transferencia: ${movementId}`);

            const result = await completeTransfer(movementId, authToken);

            if (result.success) {
                // Recargar la lista de movimientos para mostrar el cambio
                loadMovementsFromServer();

                setNotification({
                    show: true,
                    type: "success",
                    message: `Transferencia completada exitosamente.`,
                });

                setTimeout(() => {
                    setNotification({ show: false, type: "", message: "" });
                }, 5000);
            }
        } catch (error) {
            console.error("❌ Error al completar transferencia:", error);
            setNotification({
                show: true,
                type: "error",
                message: `Error al completar transferencia: ${error.message}`,
            });

            setTimeout(() => {
                setNotification({ show: false, type: "", message: "" });
            }, 5000);
        } finally {
            processingMovements.current.delete(movementId);
            setChangingStates((prev) => {
                const newSet = new Set(prev);
                newSet.delete(movementId);
                return newSet;
            });
        }
    };

    // Función para cancelar una transferencia
    const handleCancelarTransferencia = async (movementId) => {
        if (processingMovements.current.has(movementId)) {
            console.log(`Movimiento ${movementId} ya está siendo procesado`);
            return;
        }

        // Confirmar la cancelación
        const confirmCancel = window.confirm(
            "¿Estás seguro de que deseas cancelar esta transferencia? Esta acción no se puede deshacer."
        );

        if (!confirmCancel) {
            return;
        }

        processingMovements.current.add(movementId);
        setChangingStates((prev) => new Set([...prev, movementId]));

        try {
            console.log(`🔄 Cancelando transferencia: ${movementId}`);

            const result = await cancelTransfer(movementId, authToken);

            if (result.success) {
                // Recargar la lista de movimientos para mostrar el cambio
                loadMovementsFromServer();

                setNotification({
                    show: true,
                    type: "success",
                    message: `Transferencia cancelada exitosamente.`,
                });

                setTimeout(() => {
                    setNotification({ show: false, type: "", message: "" });
                }, 5000);
            }
        } catch (error) {
            console.error("❌ Error al cancelar transferencia:", error);
            setNotification({
                show: true,
                type: "error",
                message: `Error al cancelar transferencia: ${error.message}`,
            });

            setTimeout(() => {
                setNotification({ show: false, type: "", message: "" });
            }, 5000);
        } finally {
            processingMovements.current.delete(movementId);
            setChangingStates((prev) => {
                const newSet = new Set(prev);
                newSet.delete(movementId);
                return newSet;
            });
        }
    };

    // Función para manejar cambio de estado del movimiento
    const handleCambiarEstado = async (movementId, newStatus) => {
        // Prevenir ejecuciones duplicadas usando tanto state como ref
        if (
            changingStates.has(movementId) ||
            processingMovements.current.has(movementId)
        ) {
            console.log(
                `⚠️ Operación ya en progreso para movimiento:`,
                movementId
            );
            return;
        }

        try {
            // Agregar a ambos: state para UI y ref para prevención inmediata
            processingMovements.current.add(movementId);
            setChangingStates((prev) => new Set(prev).add(movementId));

            // Si el nuevo estado es "completed", necesitamos crear el movimiento de entrada primero
            if (newStatus === "completed") {
                // Buscar el movimiento original para obtener sus datos
                const originalMovement = movimientos.find(
                    (m) => m.id === movementId
                );

                if (!originalMovement) {
                    throw new Error(
                        `No se encontró el movimiento con ID ${movementId}`
                    );
                }

                if (!originalMovement.destination_location) {
                    throw new Error(
                        "El movimiento no tiene una sede de destino definida"
                    );
                }

                // Crear el movimiento de entrada en la sede destino
                const entryMovementPayload = {
                    product: originalMovement.product,
                    location: originalMovement.destination_location,
                    movement_type: "in",
                    quantity: originalMovement.quantity,
                    status: "completed",
                    is_internal_transfer: true,
                    expiry_date: originalMovement.expiry_date || "2025-08-24",
                    notes: `Entrada por transferencia completada desde ${
                        originalMovement.location_name || "sede origen"
                    }`,
                    // Incluir el lote si el movimiento original lo tiene
                    ...(originalMovement.batch && {
                        batch: originalMovement.batch,
                    }),
                };

                // Crear el movimiento de entrada usando el servicio
                const newEntryMovement = await createInventoryMovement(
                    entryMovementPayload,
                    authToken
                );
            }

            // Actualizar estado del movimiento original en la API
            const updatedMovement = await updateMovementStatus(
                movementId,
                newStatus,
                authToken
            );

            // Recargar la lista de movimientos para mostrar el cambio
            loadMovementsFromServer();

            setNotification({
                show: true,
                type: "success",
                message:
                    newStatus === "completed"
                        ? `Transferencia completada exitosamente. Se creó el movimiento de entrada en la sede destino.`
                        : `Estado del movimiento ${movementId} actualizado a ${updatedMovement.status_display}`,
            });

            setTimeout(() => {
                setNotification({ show: false, type: "", message: "" });
            }, 5000);
        } catch (error) {
            console.error(
                "❌ Error en handleCambiarEstado para movimiento:",
                movementId,
                error
            );
            setNotification({
                show: true,
                type: "error",
                message: `Error al cambiar estado: ${error.message}`,
            });

            setTimeout(() => {
                setNotification({ show: false, type: "", message: "" });
            }, 5000);
        } finally {
            // Remover de ambos
            processingMovements.current.delete(movementId);
            setChangingStates((prev) => {
                const newSet = new Set(prev);
                newSet.delete(movementId);
                return newSet;
            });
        }
    };

    return (
        <div
            style={{
                padding: "32px",
                maxWidth: "1400px",
                margin: "0 auto",
                fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                backgroundColor: "#f5f6fa",
                minHeight: "100vh",
            }}
        >
            {/* Encabezado */}
            <TransferHeader totalCount={totalCount || movimientos.length} />

            {/* Notificación */}
            <TransferNotification notification={notification} />

            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "32px",
                }}
            >
                {/* Sección de Crear Transferencia */}
                <SimpleTransferForm
                    onTransferCreated={handleTransferCreated}
                    onNotification={setNotification}
                />

                {/* Sección de Filtros */}
                <TransferFilters
                    filters={filters}
                    handleFilterChange={handleFilterChange}
                    estados={estados}
                    clearFilters={clearFilters}
                    applyFilters={applyFilters}
                />

                {/* Tabla de Movimientos de Transferencias con Paginación */}
                <div style={{ width: "100%" }}>
                    <TransfersTable
                        transferencias={movimientos}
                        onCambiarEstado={handleCambiarEstado}
                        onCompletarTransferencia={handleCompletarTransferencia}
                        onCancelarTransferencia={handleCancelarTransferencia}
                        changingStates={changingStates}
                    />

                    {/* Paginación */}
                    <TransfersPagination
                        transferencias={movimientos}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalCount={totalCount}
                        onPageChange={handlePageChange}
                    />
                </div>
            </div>
        </div>
    );
};

export default TransferenciasInternasPage;
