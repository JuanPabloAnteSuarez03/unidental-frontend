import React, { useState, useRef, useCallback, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import inventoryService from "../services/inventoryService";
import MovementsHeader from "../components/StockMovements/MovementsHeader";
import MovementNotification from "../components/StockMovements/MovementNotification";
import MovementForm from "../components/StockMovements/MovementForm";
import MovementFilters from "../components/StockMovements/MovementFilters";
import MovementsTable from "../components/StockMovements/MovementsTable";
import MovementsPagination from "../components/StockMovements/MovementsPagination";

const MovimientosDeStockPage = () => {
    // Estado para el formulario
    const [formData, setFormData] = useState({
        product: "",
        location: "",
        movementType: "in",
        quantity: "",
        expiryDate: "",
        notes: "",
    });

    // Estado para filtros del historial
    const [filters, setFilters] = useState({
        dateFrom: "",
        dateTo: "",
        locationFilter: "",
        movementTypeFilter: "",
        searchQuery: "",
    });

    // Estado para la tabla de historial (simulado)
    const [movementHistory, setMovementHistory] = useState([]);

    // Estados para cargar movimientos reales de la base de datos
    const [realMovements, setRealMovements] = useState([]);
    const [isLoadingMovements, setIsLoadingMovements] = useState(false);
    const [movementsError, setMovementsError] = useState(null);
    const [movementsCurrentPage, setMovementsCurrentPage] = useState(1);
    const [movementsTotalPages, setMovementsTotalPages] = useState(0);
    const [movementsTotalCount, setMovementsTotalCount] = useState(0);

    // Estado separado para los filtros aplicados (que realmente afectan la consulta)
    const [appliedFilters, setAppliedFilters] = useState({
        dateFrom: "",
        dateTo: "",
        locationFilter: "",
        movementTypeFilter: "",
        searchQuery: "",
    });

    // Estados para ubicaciones reales de la base de datos
    const [locations, setLocations] = useState([]);
    const [isLoadingLocations, setIsLoadingLocations] = useState(false);

    // Estado para mostrar mensajes de éxito/error
    const [notification, setNotification] = useState({
        show: false,
        type: "",
        message: "",
    });

    // Estado para el producto seleccionado
    const [selectedProduct, setSelectedProduct] = useState(null);

    // Obtener el contexto de autenticación
    const { authToken } = useAuth();

    // Función para manejar selección de producto
    const handleProductSelected = (product) => {
        setSelectedProduct(product);
        setFormData({
            ...formData,
            product: product.name,
        });
    };

    // Función para limpiar selección de producto
    const handleProductSelectionCleared = () => {
        setSelectedProduct(null);
        setFormData({
            ...formData,
            product: "",
        });
    };

    // Función para manejar cambios en el formulario
    const handleInputChange = (e) => {
        const { name, value } = e.target;

        // Si se cambia el tipo de movimiento a "salida", limpiar la fecha de vencimiento
        if (name === "movementType" && value === "out") {
            setFormData({
                ...formData,
                [name]: value,
                expiryDate: "", // Limpiar fecha de vencimiento para salidas
            });
        } else {
            setFormData({
                ...formData,
                [name]: value,
            });
        }
    };

    // Función para manejar cambios en los filtros
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters({
            ...filters,
            [name]: value,
        });
    };

    // Función para aplicar filtros
    const applyFilters = () => {
        // Actualizar los filtros aplicados
        setAppliedFilters(filters);

        // Recargar los movimientos con los filtros aplicados
        loadInventoryMovements(1, filters);

        // Mostrar notificación de filtros aplicados
        setNotification({
            show: true,
            type: "success",
            message: "Filtros aplicados correctamente",
        });

        setTimeout(() => {
            setNotification({ show: false, type: "", message: "" });
        }, 3000);
    };

    // Función para limpiar filtros
    const clearFilters = () => {
        const emptyFilters = {
            dateFrom: "",
            dateTo: "",
            locationFilter: "",
            movementTypeFilter: "",
            searchQuery: "",
        };

        setFilters(emptyFilters);
        setAppliedFilters(emptyFilters);

        // Recargar movimientos sin filtros
        loadInventoryMovements(1, emptyFilters);

        // Mostrar notificación de filtros limpiados
        setNotification({
            show: true,
            type: "success",
            message: "Filtros limpiados correctamente",
        });

        setTimeout(() => {
            setNotification({ show: false, type: "", message: "" });
        }, 3000);
    };

    // Función para registrar un nuevo movimiento
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validación básica - todos los campos son obligatorios excepto notas
        if (
            !selectedProduct ||
            !formData.location ||
            !formData.movementType ||
            !formData.quantity ||
            // Solo requerir fecha de vencimiento para entradas, no para salidas
            (formData.movementType !== "out" && !formData.expiryDate)
        ) {
            setNotification({
                show: true,
                type: "error",
                message:
                    "Por favor complete todos los campos obligatorios (todos excepto notas)",
            });
            setTimeout(() => {
                setNotification({ show: false, type: "", message: "" });
            }, 5000);
            return;
        }

        // Preparar los datos del movimiento para la API
        const movementData = {
            product: selectedProduct.id, // Usar el ID del producto
            location: formData.location, // Usar el ID de la ubicación
            movement_type: formData.movementType, // Mantener el valor exacto seleccionado
            quantity: parseInt(formData.quantity),
            notes: formData.notes || "", // Asegurar que sea string vacío si no hay notas
        };

        // Solo agregar fecha de vencimiento para entradas, no para salidas
        if (formData.movementType !== "out" && formData.expiryDate) {
            movementData.expiry_date = formData.expiryDate;
        }

        try {
            // Mostrar estado de carga
            setNotification({
                show: true,
                type: "info",
                message: "Registrando movimiento...",
            });

            // Llamar a la API para crear el movimiento
            const createdMovement =
                await inventoryService.createInventoryMovement(
                    movementData,
                    authToken
                );

            // Mostrar mensaje de éxito
            setNotification({
                show: true,
                type: "success",
                message: "Movimiento registrado con éxito en la base de datos",
            });

            // Limpiar el formulario
            setFormData({
                product: "",
                location: "",
                movementType: "in",
                quantity: "",
                expiryDate: "",
                notes: "",
            });

            // Limpiar también la selección del producto
            setSelectedProduct(null);

            // Recargar los movimientos de la base de datos para mostrar el nuevo registro
            setTimeout(() => {
                loadInventoryMovements(1);
            }, 1000);
        } catch (error) {
            console.error("Error al registrar movimiento:", error);

            // Mostrar mensaje de error específico
            let errorMessage = "Error al registrar el movimiento";

            if (error.message) {
                // Personalizar mensajes de error comunes para mejorar la experiencia del usuario
                if (
                    error.message.includes("producto") ||
                    error.message.includes("product")
                ) {
                    errorMessage =
                        "Error con el producto seleccionado: " + error.message;
                } else if (
                    error.message.includes("ubicación") ||
                    error.message.includes("location")
                ) {
                    errorMessage =
                        "Error con la ubicación seleccionada: " + error.message;
                } else if (
                    error.message.includes("cantidad") ||
                    error.message.includes("quantity")
                ) {
                    errorMessage = "Error con la cantidad: " + error.message;
                } else if (
                    error.message.includes("vencimiento") ||
                    error.message.includes("expiry")
                ) {
                    errorMessage =
                        "Error con la fecha de vencimiento: " + error.message;
                } else if (
                    error.message.includes("conexión") ||
                    error.message.includes("network")
                ) {
                    errorMessage =
                        "Error de conexión: Verifique su conexión a internet y vuelva a intentarlo";
                } else {
                    errorMessage = error.message;
                }
            }

            setNotification({
                show: true,
                type: "error",
                message: errorMessage,
            });
        }

        // Ocultar la notificación después de 5 segundos
        setTimeout(() => {
            setNotification({ show: false, type: "", message: "" });
        }, 5000);
    };

    // Lista simulada de productos
    const products = [
        "Jeringa desechable 5ml",
        "Guantes de látex talla M",
        "Algodón hidrófilo 500g",
        "Mascarilla quirúrgica",
        "Alcohol isopropílico 1L",
    ];

    // Tipos de movimiento disponibles
    const movementTypes = [
        { value: "in", label: "Entrada" },
        { value: "out", label: "Salida" },
    ];

    // Función para cargar ubicaciones desde la base de datos
    const loadLocations = useCallback(async () => {
        if (!authToken) {
            return;
        }

        setIsLoadingLocations(true);
        try {
            const data = await inventoryService.getLocations(authToken);
            setLocations(data || []);

            // Si no hay ubicaciones, mostrar una notificación
            if (!data || data.length === 0) {
                setNotification({
                    show: true,
                    type: "info",
                    message:
                        "No se encontraron ubicaciones disponibles. Se usarán ubicaciones por defecto.",
                });

                // Usar ubicaciones por defecto
                setLocations([
                    { id: 1, name: "Sede Principal" },
                    { id: 2, name: "Sede Norte" },
                    { id: 3, name: "Sede Sur" },
                    { id: 4, name: "Almacén Central" },
                ]);

                setTimeout(() => {
                    setNotification({ show: false, type: "", message: "" });
                }, 5000);
            }
        } catch (error) {
            console.error("Error al cargar ubicaciones:", error);

            // Mostrar notificación de error
            setNotification({
                show: true,
                type: "error",
                message:
                    "Error al cargar ubicaciones: " +
                    (error.message || "Error desconocido"),
            });

            // En caso de error, usar ubicaciones por defecto
            setLocations([
                { id: 1, name: "Sede Principal" },
                { id: 2, name: "Sede Norte" },
                { id: 3, name: "Sede Sur" },
                { id: 4, name: "Almacén Central" },
            ]);

            setTimeout(() => {
                setNotification({ show: false, type: "", message: "" });
            }, 5000);
        } finally {
            setIsLoadingLocations(false);
        }
    }, [authToken]);

    // Efecto para cargar ubicaciones al inicio
    useEffect(() => {
        if (authToken) {
            loadLocations();
        }
    }, [authToken, loadLocations]);

    // Función para cargar movimientos de inventario desde la base de datos
    const loadInventoryMovements = useCallback(
        async (page = 1, filtersToUse = null) => {
            if (!authToken) {
                return;
            }

            setIsLoadingMovements(true);
            setMovementsError(null);

            try {
                // Usar filtros aplicados o los filtros pasados como parámetro
                const currentFilters = filtersToUse || appliedFilters;

                // Construir parámetros para la API
                const params = {
                    page: page,
                    page_size: 25, // Mismo tamaño que otras tablas
                };

                // Agregar filtros solo si existen
                if (currentFilters.dateFrom) {
                    params.date_from = currentFilters.dateFrom;
                }
                if (currentFilters.dateTo) {
                    params.date_to = currentFilters.dateTo;
                }
                if (currentFilters.locationFilter) {
                    params.location = currentFilters.locationFilter;
                }
                if (currentFilters.movementTypeFilter) {
                    params.movement_type = currentFilters.movementTypeFilter;
                }
                if (currentFilters.searchQuery) {
                    params.search = currentFilters.searchQuery;
                }

                const data = await inventoryService.getInventoryMovements(
                    params,
                    authToken
                );

                if (data) {
                    setRealMovements(data.results || []);
                    setMovementsTotalCount(data.count || 0);
                    setMovementsCurrentPage(page);

                    // Calcular total de páginas
                    const totalPages = Math.ceil((data.count || 0) / 25);
                    setMovementsTotalPages(totalPages);
                }
            } catch (error) {
                console.error("Error al cargar movimientos:", error);

                let errorMessage =
                    "Error al cargar los movimientos de inventario";

                // Personalizar mensajes según el tipo de error
                if (error.message) {
                    if (error.message.includes("conexión")) {
                        errorMessage =
                            "Error de conexión: No se pudieron cargar los movimientos. Verifique su conexión a internet.";
                    } else if (error.message.includes("permisos")) {
                        errorMessage =
                            "No tiene permisos para ver los movimientos de inventario. Contacte al administrador.";
                    } else {
                        errorMessage = error.message;
                    }
                }

                setMovementsError(errorMessage);
                setRealMovements([]);
            } finally {
                setIsLoadingMovements(false);
            }
        },
        [authToken, appliedFilters]
    );

    // Efecto para cargar movimientos al inicio y cuando cambien el token o filtros
    useEffect(() => {
        if (authToken) {
            loadInventoryMovements();
        }
    }, [authToken, loadInventoryMovements]);

    // Funciones de paginación para movimientos de la base de datos
    const goToMovementsPage = (page) => {
        if (page >= 1 && page <= movementsTotalPages) {
            loadInventoryMovements(page);
        }
    };

    const goToNextMovementsPage = () => {
        if (movementsCurrentPage < movementsTotalPages) {
            goToMovementsPage(movementsCurrentPage + 1);
        }
    };

    const goToPrevMovementsPage = () => {
        if (movementsCurrentPage > 1) {
            goToMovementsPage(movementsCurrentPage - 1);
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
            <MovementsHeader
                totalCount={movementsTotalCount}
                isLoading={isLoadingMovements}
            />

            {/* Notificación */}
            <MovementNotification notification={notification} />

            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "32px",
                }}
            >
                {/* Formulario para registrar nuevo movimiento */}
                <MovementForm
                    formData={formData}
                    handleInputChange={handleInputChange}
                    handleSubmit={handleSubmit}
                    selectedProduct={selectedProduct}
                    handleProductSelected={handleProductSelected}
                    handleProductSelectionCleared={
                        handleProductSelectionCleared
                    }
                    locations={locations}
                    isLoadingLocations={isLoadingLocations}
                />

                {/* Historial de Movimientos */}
                <div style={{ width: "100%" }}>
                    <div
                        style={{
                            backgroundColor: "#fff",
                            borderRadius: "16px",
                            padding: "32px",
                            boxShadow:
                                "0 4px 20px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.1)",
                            border: "1px solid #e9ecef",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "16px",
                                marginBottom: "32px",
                            }}
                        >
                            <div
                                style={{
                                    backgroundColor: "#f8f9fa",
                                    borderRadius: "12px",
                                    padding: "16px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <span style={{ fontSize: "28px" }}>📋</span>
                            </div>
                            <div>
                                <h2
                                    style={{
                                        fontSize: "24px",
                                        fontWeight: "600",
                                        margin: "0 0 4px 0",
                                        color: "#2c3e50",
                                        letterSpacing: "-0.5px",
                                    }}
                                >
                                    Historial de Movimientos
                                </h2>
                                {!isLoadingMovements &&
                                    movementsTotalCount > 0 && (
                                        <p
                                            style={{
                                                color: "#6c757d",
                                                fontSize: "16px",
                                                margin: "0",
                                                fontWeight: "400",
                                            }}
                                        >
                                            {movementsTotalCount} movimiento
                                            {movementsTotalCount !== 1
                                                ? "s"
                                                : ""}{" "}
                                            registrado
                                            {movementsTotalCount !== 1
                                                ? "s"
                                                : ""}
                                        </p>
                                    )}
                            </div>
                        </div>

                        {/* Sección de Filtros */}
                        <MovementFilters
                            filters={filters}
                            handleFilterChange={handleFilterChange}
                            locations={locations}
                            isLoadingLocations={isLoadingLocations}
                            movementTypes={movementTypes}
                            clearFilters={clearFilters}
                            applyFilters={applyFilters}
                        />

                        {/* Tabla de Movimientos */}
                        <MovementsTable
                            realMovements={realMovements}
                            isLoadingMovements={isLoadingMovements}
                            movementsError={movementsError}
                            movementsTotalCount={movementsTotalCount}
                        />

                        {/* Paginación */}
                        <MovementsPagination
                            isLoadingMovements={isLoadingMovements}
                            realMovements={realMovements}
                            movementsTotalPages={movementsTotalPages}
                            movementsCurrentPage={movementsCurrentPage}
                            movementsTotalCount={movementsTotalCount}
                            goToPrevMovementsPage={goToPrevMovementsPage}
                            goToNextMovementsPage={goToNextMovementsPage}
                            goToMovementsPage={goToMovementsPage}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MovimientosDeStockPage;
