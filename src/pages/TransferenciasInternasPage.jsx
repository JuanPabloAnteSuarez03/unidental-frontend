import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useProducts } from "../context/ProductsContext";
import transfersService from "../services/transfersService";
import TransferHeader from "../components/Transfers/TransferHeader";
import TransferNotification from "../components/Transfers/TransferNotification";
import TransferFilters from "../components/Transfers/TransferFilters";
import RequestTransferModalV2 from "../components/Transfers/RequestTransferModalV2";
import SendTransferModalV2 from "../components/Transfers/SendTransferModalV2";
import TransfersTable from "../components/Transfers/TransfersTable";
import TransfersPagination from "../components/Transfers/TransfersPagination";
import TransferDetailsModal from "../components/Transfers/TransferDetailsModal";

const TransferenciasInternasPage = () => {
    const { authToken } = useAuth();
    const { refreshCache } = useProducts();

    // Estados para los filtros del historial
    const [filters, setFilters] = useState({
        estado: "",
        sedeOrigen: "",
        sedeDestino: "",
        producto: "",
        fechaDesde: "",
        fechaHasta: "",
        tipoTransferencia: "",
    });

    // Estado para búsqueda de productos (separado de filtros)
    const [productSearchTerm, setProductSearchTerm] = useState("");

    // Estado para el historial de transferencias (ahora persistente)
    const [transferencias, setTransferencias] = useState([]);
    const [isLoadingTransfers, setIsLoadingTransfers] = useState(false);
    const [transfersData, setTransfersData] = useState({
        totalCount: 0,
        totalPages: 0,
        currentPage: 1,
    });

    // Estado para el modal de nueva transferencia
    const [showModal, setShowModal] = useState(false);

    // Estados para los nuevos modales especializados
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [showSendModal, setShowSendModal] = useState(false);

    // Estado para el formulario de nueva transferencia
    const [formData, setFormData] = useState({
        producto: "",
        sedeOrigen: "",
        sedeDestino: "",
        cantidad: "",
        motivo: "",
        urgencia: "media",
        tipoTransferencia: "pull",
        fechaEntrega: "",
    });

    // Estado para el modal de detalles
    const [showDetallesModal, setShowDetallesModal] = useState(false);
    const [selectedTransferencia, setSelectedTransferencia] = useState(null);

    // Estado para notificaciones
    const [notification, setNotification] = useState({
        show: false,
        type: "",
        message: "",
    });
    const [changingStates, setChangingStates] = useState(new Set()); // IDs de transferencias cuyo estado se está cambiando

    // Estados para paginación (ahora usando transfersData)
    const { currentPage, totalPages, totalCount } = transfersData;

    // Datos simulados para los selects (para formulario de nueva transferencia)
    const ubicaciones = [
        { id: 1, name: "Sede Principal" },
        { id: 2, name: "Sede Norte" },
        { id: 3, name: "Sede Sur" },
        { id: 4, name: "Almacén Central" },
    ];

    const productos = [
        "Jeringa desechable 5ml",
        "Guantes de látex talla M",
        "Algodón hidrófilo 500g",
        "Mascarilla quirúrgica",
        "Alcohol isopropílico 1L",
    ];

    const estados = [
        "Pendiente",
        "Aprobada",
        "En Tránsito",
        "Completada",
        "Rechazada",
        "Cancelada",
    ];

    const nivelesUrgencia = [
        { value: "baja", label: "Baja" },
        { value: "media", label: "Media" },
        { value: "alta", label: "Alta" },
    ];

    // Función para cargar transferencias
    const loadTransfers = useCallback(
        (page = 1) => {
            setIsLoadingTransfers(true);
            try {
                const params = { page, pageSize: 25 };
                const result = transfersService.getTransfers(params, filters);

                setTransferencias(result.results);
                setTransfersData({
                    totalCount: result.count,
                    totalPages: result.totalPages,
                    currentPage: result.currentPage,
                });
            } catch (error) {
                console.error("Error al cargar transferencias:", error);
                setNotification({
                    show: true,
                    type: "error",
                    message: "Error al cargar las transferencias",
                });
            } finally {
                setIsLoadingTransfers(false);
            }
        },
        [filters]
    );

    // Cargar transferencias al montar el componente y cuando cambien los filtros
    useEffect(() => {
        loadTransfers(1);
    }, [loadTransfers]);

    // Funciones para manejar filtros
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters({
            ...filters,
            [name]: value,
        });
    };

    // Función para manejar cambio en búsqueda de productos
    const handleProductSearchChange = (searchTerm) => {
        setProductSearchTerm(searchTerm);
        // No actualizamos filtros inmediatamente - esperamos botón aplicar
    };

    const applyFilters = () => {
        // Crear filtros que incluyan el término de búsqueda actual
        const filtersWithSearch = {
            ...filters,
            producto: productSearchTerm,
        };

        // Actualizar los filtros aplicados
        setFilters(filtersWithSearch);

        // Recargar transferencias con los filtros aplicados (incluyendo búsqueda)
        loadTransfers(1);

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
            estado: "",
            sedeOrigen: "",
            sedeDestino: "",
            producto: "",
            fechaDesde: "",
            fechaHasta: "",
            tipoTransferencia: "",
        };

        setFilters(emptyFilters);

        // También limpiar la búsqueda de productos
        setProductSearchTerm("");

        // Recargar sin filtros
        setTimeout(() => loadTransfers(1), 100);

        setNotification({
            show: true,
            type: "success",
            message: "Filtros limpiados correctamente",
        });

        setTimeout(() => {
            setNotification({ show: false, type: "", message: "" });
        }, 3000);
    };

    // Funciones para el formulario de nueva transferencia
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validación básica
        if (
            !formData.producto ||
            !formData.sedeOrigen ||
            !formData.sedeDestino ||
            !formData.cantidad
        ) {
            setNotification({
                show: true,
                type: "error",
                message: "Por favor complete todos los campos obligatorios",
            });

            setTimeout(() => {
                setNotification({ show: false, type: "", message: "" });
            }, 5000);
            return;
        }

        if (formData.sedeOrigen === formData.sedeDestino) {
            setNotification({
                show: true,
                type: "error",
                message: "La sede de origen y destino no pueden ser iguales",
            });

            setTimeout(() => {
                setNotification({ show: false, type: "", message: "" });
            }, 5000);
            return;
        }

        try {
            // Crear transferencia usando el servicio
            const transferData = {
                producto: formData.producto,
                cantidad: formData.cantidad,
                sedeOrigen: formData.sedeOrigen,
                sedeDestino: formData.sedeDestino,
                motivo: formData.motivo,
                urgencia: formData.urgencia,
                tipoTransferencia: formData.tipoTransferencia,
                fechaEntrega: formData.fechaEntrega,
            };

            await transfersService.createTransfer(transferData, authToken);

            // Recargar transferencias
            loadTransfers(1);

            // Actualizar cache de productos si hubo movimientos de stock
            if (formData.tipoTransferencia === "push") {
                setTimeout(() => refreshCache(), 500);
            }

            // Mostrar notificación
            setNotification({
                show: true,
                type: "success",
                message:
                    formData.tipoTransferencia === "pull"
                        ? "Solicitud de transferencia creada con éxito"
                        : "Transferencia registrada con éxito",
            });

            // Cerrar modal y resetear formulario
            setShowModal(false);
            setFormData({
                producto: "",
                sedeOrigen: "",
                sedeDestino: "",
                cantidad: "",
                motivo: "",
                urgencia: "media",
                tipoTransferencia: "pull",
            });

            setTimeout(() => {
                setNotification({ show: false, type: "", message: "" });
            }, 3000);
        } catch (error) {
            console.error("Error al crear transferencia:", error);
            setNotification({
                show: true,
                type: "error",
                message: "Error al crear la transferencia: " + error.message,
            });

            setTimeout(() => {
                setNotification({ show: false, type: "", message: "" });
            }, 5000);
        }
    };

    // Función para abrir modal de detalles
    const openDetalles = (transferencia) => {
        setSelectedTransferencia(transferencia);
        setShowDetallesModal(true);
    };

    // Función para cambiar estado de transferencia
    const cambiarEstado = async (id, nuevoEstado) => {
        // Verificar si ya se está cambiando el estado de esta transferencia
        if (changingStates.has(id)) {
            console.log(
                `Estado de transferencia ${id} ya se está cambiando, ignorando...`
            );
            return;
        }

        try {
            // Marcar como "cambiando estado"
            setChangingStates((prev) => new Set(prev).add(id));

            // Mostrar notificaciones de carga para cambios críticos
            if (nuevoEstado === "Aprobada") {
                setNotification({
                    show: true,
                    type: "info",
                    message: "Aprobando transferencia y validando stock...",
                });
            } else if (nuevoEstado === "En Tránsito") {
                setNotification({
                    show: true,
                    type: "info",
                    message: "Marcando como enviada...",
                });
            } else if (nuevoEstado === "Completada") {
                setNotification({
                    show: true,
                    type: "info",
                    message:
                        "Completando transferencia y registrando entrada en destino...",
                });
            }

            // Actualizar en el servicio de transferencias (con token para "Aprobada" y "Completada")
            const transferActualizada =
                await transfersService.updateTransferStatus(
                    id,
                    nuevoEstado,
                    nuevoEstado === "Completada" || nuevoEstado === "Aprobada"
                        ? authToken
                        : null
                );

            if (transferActualizada) {
                // Recargar transferencias para reflejar el cambio
                loadTransfers(currentPage);

                // Actualizar cache de productos si hubo movimientos de stock
                if (
                    nuevoEstado === "Aprobada" ||
                    nuevoEstado === "Completada"
                ) {
                    setTimeout(() => refreshCache(), 500);
                }

                // Actualizar también la transferencia seleccionada si existe
                if (selectedTransferencia && selectedTransferencia.id === id) {
                    setSelectedTransferencia(transferActualizada);
                }

                let message = `Estado cambiado a: ${nuevoEstado}`;
                if (
                    nuevoEstado === "Aprobada" &&
                    transferActualizada.movementId
                ) {
                    message += ` - Stock descontado en origen (ID: ${transferActualizada.movementId})`;
                } else if (nuevoEstado === "En Tránsito") {
                    message += ` - Transferencia marcada como enviada`;
                } else if (
                    nuevoEstado === "Completada" &&
                    transferActualizada.inboundMovementId
                ) {
                    message += ` - Entrada registrada en destino (ID: ${transferActualizada.inboundMovementId})`;
                }

                setNotification({
                    show: true,
                    type: "success",
                    message: message,
                });
            } else {
                setNotification({
                    show: true,
                    type: "error",
                    message: "Error al cambiar el estado de la transferencia",
                });
            }
        } catch (error) {
            console.error("Error al cambiar estado:", error);
            setNotification({
                show: true,
                type: "error",
                message: `Error al cambiar el estado: ${error.message}`,
            });
        } finally {
            // Quitar del conjunto de estados cambiando
            setChangingStates((prev) => {
                const newSet = new Set(prev);
                newSet.delete(id);
                return newSet;
            });
        }

        setTimeout(() => {
            setNotification({ show: false, type: "", message: "" });
        }, 5000); // Más tiempo para leer el mensaje completo
    };

    // Función para manejar nueva transferencia
    const handleNewTransfer = (tipoTransferencia = "pull") => {
        // Limpiar el formulario
        setFormData({
            producto: "",
            sedeOrigen: "",
            sedeDestino: "",
            cantidad: "",
            motivo: "",
            urgencia: "media",
            tipoTransferencia: tipoTransferencia,
            fechaEntrega: "",
        });

        // Abrir el modal correspondiente
        if (tipoTransferencia === "pull") {
            setShowRequestModal(true);
        } else {
            setShowSendModal(true);
        }
    };

    // Función para cerrar todos los modales
    const closeAllModals = () => {
        setShowModal(false);
        setShowRequestModal(false);
        setShowSendModal(false);
    };

    // Función para manejar cambio de página
    const handlePageChange = (page) => {
        loadTransfers(page);
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
            <TransferHeader totalCount={totalCount || transferencias.length} />

            {/* Notificación */}
            <TransferNotification notification={notification} />

            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "32px",
                }}
            >
                {/* Botones de acción adicionales */}
                <div
                    style={{
                        backgroundColor: "#fff",
                        borderRadius: "16px",
                        padding: "24px",
                        boxShadow:
                            "0 4px 20px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.1)",
                        border: "1px solid #e9ecef",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            gap: "16px",
                            flexWrap: "wrap",
                            alignItems: "center",
                        }}
                    >
                        <div>
                            <h3
                                style={{
                                    fontSize: "18px",
                                    fontWeight: "600",
                                    margin: "0 0 8px 0",
                                    color: "#2c3e50",
                                }}
                            >
                                Acciones Rápidas
                            </h3>
                            <p
                                style={{
                                    color: "#6c757d",
                                    fontSize: "14px",
                                    margin: "0",
                                }}
                            >
                                Crea solicitudes o registra envíos directos
                            </p>
                        </div>
                        <div
                            style={{
                                marginLeft: "auto",
                                display: "flex",
                                gap: "12px",
                            }}
                        >
                            <button
                                onClick={() => handleNewTransfer("pull")}
                                style={{
                                    backgroundColor: "#2c3e50",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "8px",
                                    padding: "10px 16px",
                                    fontSize: "14px",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    fontWeight: "500",
                                    transition: "all 0.2s ease",
                                }}
                                onMouseOver={(e) => {
                                    e.target.style.backgroundColor = "#34495e";
                                    e.target.style.transform =
                                        "translateY(-1px)";
                                }}
                                onMouseOut={(e) => {
                                    e.target.style.backgroundColor = "#2c3e50";
                                    e.target.style.transform = "translateY(0)";
                                }}
                            >
                                <span style={{ marginRight: "8px" }}>⬅️</span>
                                Solicitar Transferencia
                            </button>
                            <button
                                onClick={() => handleNewTransfer("push")}
                                style={{
                                    backgroundColor: "#34495e",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "8px",
                                    padding: "10px 16px",
                                    fontSize: "14px",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    fontWeight: "500",
                                    transition: "all 0.2s ease",
                                }}
                                onMouseOver={(e) => {
                                    e.target.style.backgroundColor = "#2c3e50";
                                    e.target.style.transform =
                                        "translateY(-1px)";
                                }}
                                onMouseOut={(e) => {
                                    e.target.style.backgroundColor = "#34495e";
                                    e.target.style.transform = "translateY(0)";
                                }}
                            >
                                <span style={{ marginRight: "8px" }}>➡️</span>
                                Registrar Envío
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sección de Filtros */}
                <TransferFilters
                    filters={filters}
                    handleFilterChange={handleFilterChange}
                    estados={estados}
                    clearFilters={clearFilters}
                    applyFilters={applyFilters}
                    onProductSearchChange={handleProductSearchChange}
                />

                {/* Tabla de Transferencias con Paginación */}
                <div style={{ width: "100%" }}>
                    <TransfersTable
                        transferencias={transferencias}
                        onVerDetalles={openDetalles}
                        onCambiarEstado={cambiarEstado}
                        changingStates={changingStates}
                    />

                    {/* Paginación */}
                    <TransfersPagination
                        transferencias={transferencias}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalCount={totalCount}
                        onPageChange={handlePageChange}
                    />
                </div>
            </div>

            {/* Modal para Solicitar Transferencia (Pull) */}
            <RequestTransferModalV2
                isOpen={showRequestModal}
                onClose={() => setShowRequestModal(false)}
                formData={formData}
                handleInputChange={handleInputChange}
                handleSubmit={handleSubmit}
                nivelesUrgencia={nivelesUrgencia}
                onTransferCreated={() => loadTransfers(1)}
            />

            {/* Modal para Registrar Envío (Push) */}
            <SendTransferModalV2
                isOpen={showSendModal}
                onClose={() => setShowSendModal(false)}
                formData={formData}
                handleInputChange={handleInputChange}
                handleSubmit={handleSubmit}
                nivelesUrgencia={nivelesUrgencia}
                onTransferCreated={() => loadTransfers(1)}
            />

            {/* Modal de Detalles */}
            <TransferDetailsModal
                isOpen={showDetallesModal}
                onClose={() => setShowDetallesModal(false)}
                transferencia={selectedTransferencia}
                onCambiarEstado={cambiarEstado}
                changingStates={changingStates}
            />
        </div>
    );
};

export default TransferenciasInternasPage;
