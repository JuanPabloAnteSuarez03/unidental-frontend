import React, { useState, useRef, useCallback, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useProducts } from "../context/ProductsContext";
import inventoryService from "../services/inventoryService";
import { createProductBatch } from "../services/productBatchService";
import batchesService from "../services/batchesService";
import advancedInventoryService from "../services/advancedInventoryService";
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
        quantity: "", // Solo se mostrará para productos sin lotes
        expiryDate: "", // Solo se mostrará para productos sin lotes
        notes: "",
    });

    // Estado para los lotes (solo para productos que requieren control de lotes)
    const [batchesData, setBatchesData] = useState([
        {
            batch_number: "",
            expiry_date: "",
            manufacturing_date: "",
            supplier_reference: "",
            quantity: "", // Cantidad específica para este lote
        },
    ]);

    // Estados para lotes disponibles en movimientos de salida
    const [availableBatches, setAvailableBatches] = useState([]);
    const [selectedBatches, setSelectedBatches] = useState([]);
    const [isLoadingBatches, setIsLoadingBatches] = useState(false);
    const [showBatchSection, setShowBatchSection] = useState(false);

    // Estado para verificar si el producto seleccionado requiere control de lotes
    const [requiresBatchControl, setRequiresBatchControl] = useState(false);

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

    // Obtener el contexto de autenticación y productos
    const { authToken } = useAuth();
    const { refreshCache } = useProducts();

    // Función para manejar selección de producto
    const handleProductSelected = (product) => {
        setSelectedProduct(product);
        setFormData({
            ...formData,
            product: product.name,
            quantity: "", // Limpiar cantidad al cambiar producto
            expiryDate: "", // Limpiar fecha de vencimiento al cambiar producto
        });

        // Verificar si el producto requiere control de lotes
        const productRequiresBatches =
            batchesService.requiresBatchControl(product);
        setRequiresBatchControl(productRequiresBatches);

        // Reiniciar estados de lotes
        setAvailableBatches([]);
        setSelectedBatches([]);
        setShowBatchSection(false);

        // Reiniciar lotes para movimientos de entrada según el tipo de producto
        if (productRequiresBatches) {
            setBatchesData([
                {
                    batch_number: "",
                    expiry_date: "",
                    manufacturing_date: "",
                    supplier_reference: "",
                    quantity: "",
                },
            ]);
        } else {
            setBatchesData([]);
        }
    };

    // Función para limpiar selección de producto
    const handleProductSelectionCleared = () => {
        setSelectedProduct(null);
        setRequiresBatchControl(false);
        setAvailableBatches([]);
        setSelectedBatches([]);
        setShowBatchSection(false);
        setBatchesData([]);
        setFormData({
            ...formData,
            product: "",
            quantity: "",
            expiryDate: "",
        });
    };

    // Función para manejar cambios en el formulario
    const handleInputChange = (e) => {
        const { name, value } = e.target;

        // Actualizar formData
        const updatedFormData = {
            ...formData,
            [name]: value,
        };

        // Si se cambia el tipo de movimiento
        if (name === "movementType") {
            if (value === "out") {
                // Limpiar campos específicos para salidas
                updatedFormData.expiryDate = "";

                // Reiniciar lotes de entrada
                if (requiresBatchControl) {
                    setBatchesData([
                        {
                            batch_number: "",
                            expiry_date: "",
                            manufacturing_date: "",
                            supplier_reference: "",
                            quantity: "",
                        },
                    ]);
                }
            } else {
                // Para movimientos de entrada, limpiar selección de lotes de salida
                setAvailableBatches([]);
                setSelectedBatches([]);
                setShowBatchSection(false);
            }
        }

        setFormData(updatedFormData);

        // Si se cambió la ubicación o el tipo de movimiento, verificar si cargar lotes
        if (
            (name === "location" || name === "movementType") &&
            selectedProduct &&
            requiresBatchControl &&
            updatedFormData.movementType === "out" &&
            updatedFormData.location
        ) {
            // Cargar lotes disponibles para movimientos de salida
            setTimeout(() => loadAvailableBatches(), 100);
        }
    };

    // Función para manejar cambios en los lotes
    const handleBatchesChange = (index, field, value) => {
        const updatedBatches = [...batchesData];
        updatedBatches[index] = {
            ...updatedBatches[index],
            [field]: value,
        };
        setBatchesData(updatedBatches);
    };

    // Función para agregar un nuevo lote
    const handleAddBatch = () => {
        setBatchesData([
            ...batchesData,
            {
                batch_number: "",
                expiry_date: "",
                manufacturing_date: "",
                supplier_reference: "",
                quantity: "",
            },
        ]);
    };

    // Función para eliminar un lote
    const handleRemoveBatch = (index) => {
        if (batchesData.length > 1) {
            const updatedBatches = [...batchesData];
            updatedBatches.splice(index, 1);
            setBatchesData(updatedBatches);
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
        if (!selectedProduct || !formData.location || !formData.movementType) {
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

        // Validaciones específicas según el tipo de producto y movimiento
        if (formData.movementType === "in") {
            if (requiresBatchControl) {
                // Para productos con control de lotes
                const invalidBatches = batchesData.filter(
                    (batch) =>
                        !batch.batch_number ||
                        !batch.expiry_date ||
                        !batch.quantity
                );

                if (batchesData.length === 0 || invalidBatches.length > 0) {
                    setNotification({
                        show: true,
                        type: "error",
                        message:
                            "Por favor complete el número de lote, fecha de vencimiento y cantidad para todos los lotes",
                    });
                    setTimeout(() => {
                        setNotification({ show: false, type: "", message: "" });
                    }, 5000);
                    return;
                }
            } else {
                // Para productos sin control de lotes
                if (!formData.quantity) {
                    setNotification({
                        show: true,
                        type: "error",
                        message:
                            "Por favor ingrese la cantidad para el movimiento de entrada",
                    });
                    setTimeout(() => {
                        setNotification({ show: false, type: "", message: "" });
                    }, 5000);
                    return;
                }
            }
        } else {
            // Para movimientos de salida
            if (requiresBatchControl) {
                // Para productos con control de lotes en salida - validar lotes seleccionados
                const totalSelected = getTotalSelectedQuantity();

                if (totalSelected <= 0) {
                    setNotification({
                        show: true,
                        type: "error",
                        message:
                            "Debe seleccionar al menos una cantidad de lotes para el movimiento de salida",
                    });
                    setTimeout(() => {
                        setNotification({ show: false, type: "", message: "" });
                    }, 5000);
                    return;
                }
            } else {
                // Para productos sin control de lotes
                if (!formData.quantity) {
                    setNotification({
                        show: true,
                        type: "error",
                        message:
                            "Por favor ingrese la cantidad para el movimiento de salida",
                    });
                    setTimeout(() => {
                        setNotification({ show: false, type: "", message: "" });
                    }, 5000);
                    return;
                }
            }
        }

        try {
            // Mostrar estado de carga
            setNotification({
                show: true,
                type: "info",
                message: "Registrando movimiento...",
            });

            if (requiresBatchControl && formData.movementType === "in") {
                // FLUJO PARA PRODUCTOS CON CONTROL DE LOTES - ENTRADA

                // Crear cada lote y su movimiento correspondiente
                const createdMovements = [];

                for (const batch of batchesData) {
                    try {
                        // 1. Crear el lote primero
                        const batchData = {
                            product: selectedProduct.id,
                            batch_number: batch.batch_number,
                            expiry_date: batch.expiry_date,
                            ...(batch.manufacturing_date && {
                                manufacturing_date: batch.manufacturing_date,
                            }),
                            ...(batch.supplier_reference && {
                                supplier_reference: batch.supplier_reference,
                            }),
                        };

                        const createdBatch = await createProductBatch(
                            batchData,
                            authToken
                        );

                        // 2. Crear movimiento específico para este lote
                        const movementData = {
                            product: selectedProduct.id,
                            location: formData.location,
                            movement_type: formData.movementType,
                            quantity: parseInt(batch.quantity),
                            batch: createdBatch.id, // Especificar el lote
                            notes: formData.notes || "",
                        };

                        const createdMovement =
                            await inventoryService.createInventoryMovement(
                                movementData,
                                authToken
                            );

                        createdMovements.push(createdMovement);
                    } catch (error) {
                        console.error(
                            `Error al procesar lote ${batch.batch_number}:`,
                            error
                        );
                        throw new Error(
                            `Error al procesar lote ${batch.batch_number}: ${error.message}`
                        );
                    }
                }

                // Mostrar mensaje de éxito
                const totalQuantity = batchesData.reduce(
                    (sum, batch) => sum + parseInt(batch.quantity || 0),
                    0
                );

                setNotification({
                    show: true,
                    type: "success",
                    message: `${createdMovements.length} movimiento(s) y lote(s) registrados con éxito. Total: ${totalQuantity} unidades`,
                });
            } else if (
                requiresBatchControl &&
                formData.movementType === "out"
            ) {
                // FLUJO PARA PRODUCTOS CON CONTROL DE LOTES - SALIDA

                // Crear movimientos de salida por cada lote seleccionado
                const createdMovements = [];

                for (const batch of selectedBatches) {
                    if (batch.selectedQuantity > 0) {
                        try {
                            // Crear movimiento específico para este lote
                            const movementData = {
                                product: selectedProduct.id,
                                location: formData.location,
                                movement_type: formData.movementType,
                                quantity: parseInt(batch.selectedQuantity),
                                batch: batch.batch_id, // Especificar el lote existente
                                notes:
                                    formData.notes ||
                                    `Salida de lote ${batch.batch_number}${
                                        batch.isPartial
                                            ? " (parcial)"
                                            : " (completo)"
                                    }`,
                            };

                            const createdMovement =
                                await inventoryService.createInventoryMovement(
                                    movementData,
                                    authToken
                                );

                            createdMovements.push(createdMovement);
                        } catch (error) {
                            console.error(
                                `Error al procesar salida del lote ${batch.batch_number}:`,
                                error
                            );
                            throw new Error(
                                `Error al procesar salida del lote ${batch.batch_number}: ${error.message}`
                            );
                        }
                    }
                }

                // Mostrar mensaje de éxito
                const totalQuantity = getTotalSelectedQuantity();

                setNotification({
                    show: true,
                    type: "success",
                    message: `${createdMovements.length} movimiento(s) de salida registrados con éxito. Total: ${totalQuantity} unidades`,
                });
            } else {
                // FLUJO PARA PRODUCTOS SIN CONTROL DE LOTES
                const movementData = {
                    product: selectedProduct.id,
                    location: formData.location,
                    movement_type: formData.movementType,
                    quantity: parseInt(formData.quantity),
                    notes: formData.notes || "",
                    // Agregar fecha de vencimiento si existe (para productos sin lotes)
                    ...(formData.expiryDate &&
                        formData.movementType === "in" && {
                            expiry_date: formData.expiryDate,
                        }),
                };

                await inventoryService.createInventoryMovement(
                    movementData,
                    authToken
                );

                // Mostrar mensaje de éxito
                setNotification({
                    show: true,
                    type: "success",
                    message:
                        "Movimiento registrado con éxito en la base de datos",
                });
            }

            // Limpiar el formulario
            setFormData({
                product: "",
                location: "",
                movementType: "in",
                quantity: "",
                expiryDate: "",
                notes: "",
            });

            // Reiniciar todos los estados de lotes
            setBatchesData([]);
            setAvailableBatches([]);
            setSelectedBatches([]);
            setShowBatchSection(false);
            setRequiresBatchControl(false);

            // Limpiar también la selección del producto
            setSelectedProduct(null);

            // Actualizar cache de productos para reflejar cambios de stock
            setTimeout(() => {
                refreshCache();
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
                        "❌Error con el producto seleccionado: " +
                        error.message;
                } else if (
                    error.message.includes("ubicación") ||
                    error.message.includes("location")
                ) {
                    errorMessage =
                        "❌Error con la ubicación seleccionada: " +
                        error.message;
                } else if (
                    error.message.includes("cantidad") ||
                    error.message.includes("quantity")
                ) {
                    errorMessage = "❌Error con la cantidad: " + error.message;
                } else if (
                    error.message.includes("vencimiento") ||
                    error.message.includes("expiry")
                ) {
                    errorMessage =
                        "❌Error con la fecha de vencimiento: " + error.message;
                } else if (
                    error.message.includes("conexión") ||
                    error.message.includes("network")
                ) {
                    errorMessage =
                        "❌Error de conexión: Verifique su conexión a internet y vuelva a intentarlo";
                } else if (
                    error.message.includes("lote") ||
                    error.message.includes("batch")
                ) {
                    errorMessage = "❌Error con el lote: " + error.message;
                } else {
                    errorMessage = "❌" + error.message;
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

    // Función para cargar lotes disponibles en la ubicación seleccionada (para movimientos de salida)
    const loadAvailableBatches = useCallback(async () => {
        if (
            !selectedProduct ||
            !formData.location ||
            !requiresBatchControl ||
            formData.movementType !== "out" ||
            !authToken
        ) {
            setAvailableBatches([]);
            setSelectedBatches([]);
            setShowBatchSection(false);
            return;
        }

        console.log("=== DEBUG loadAvailableBatches ===");
        console.log("Selected Product:", selectedProduct);
        console.log(
            "Form Location:",
            formData.location,
            "Type:",
            typeof formData.location
        );
        console.log("Requires Batch Control:", requiresBatchControl);
        console.log("Movement Type:", formData.movementType);

        setIsLoadingBatches(true);
        try {
            // Convertir locationId a número si es necesario
            const locationId = parseInt(formData.location);
            console.log(
                "Converted Location ID:",
                locationId,
                "Type:",
                typeof locationId
            );

            const batches =
                await advancedInventoryService.getAvailableBatchesFIFO(
                    selectedProduct.id,
                    locationId,
                    authToken
                );

            console.log("Received batches:", batches);
            setAvailableBatches(batches);

            // Inicializar lotes seleccionados con cantidad 0
            setSelectedBatches(
                batches.map((batch) => ({
                    ...batch,
                    selectedQuantity: 0,
                    isPartial: false, // Para indicar si se saca completo o parcial
                }))
            );

            // Mostrar sección de lotes si hay lotes disponibles
            setShowBatchSection(batches.length > 0);
        } catch (error) {
            console.error("Error al cargar lotes disponibles:", error);
            setAvailableBatches([]);
            setSelectedBatches([]);
            setShowBatchSection(false);
        } finally {
            setIsLoadingBatches(false);
        }
    }, [
        selectedProduct,
        formData.location,
        formData.movementType,
        requiresBatchControl,
        authToken,
    ]);

    // Función para manejar cambios en la cantidad de lotes seleccionados
    const handleBatchQuantityChange = (batchIndex, quantity) => {
        const updatedBatches = [...selectedBatches];
        const batch = updatedBatches[batchIndex];
        const newQuantity = parseInt(quantity) || 0;

        // No permitir cantidad mayor al stock disponible
        const finalQuantity = Math.min(newQuantity, batch.quantity);

        updatedBatches[batchIndex] = {
            ...batch,
            selectedQuantity: finalQuantity,
            isPartial: finalQuantity > 0 && finalQuantity < batch.quantity,
        };

        setSelectedBatches(updatedBatches);
    };

    // Función para seleccionar lote completo
    const handleSelectCompleteBatch = (batchIndex) => {
        const updatedBatches = [...selectedBatches];
        const batch = updatedBatches[batchIndex];

        updatedBatches[batchIndex] = {
            ...batch,
            selectedQuantity: batch.quantity,
            isPartial: false,
        };

        setSelectedBatches(updatedBatches);
    };

    // Función para calcular el total de unidades seleccionadas
    const getTotalSelectedQuantity = () => {
        return selectedBatches.reduce(
            (total, batch) => total + batch.selectedQuantity,
            0
        );
    };

    // Efecto para cargar lotes cuando cambien las dependencias
    useEffect(() => {
        if (
            selectedProduct &&
            formData.location &&
            requiresBatchControl &&
            formData.movementType === "out"
        ) {
            loadAvailableBatches();
        }
    }, [loadAvailableBatches]);

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
                <div style={{ width: "100%" }}>
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
                        batchesData={batchesData}
                        handleBatchesChange={handleBatchesChange}
                        handleAddBatch={handleAddBatch}
                        handleRemoveBatch={handleRemoveBatch}
                        requiresBatchControl={requiresBatchControl}
                        availableBatches={availableBatches}
                        selectedBatches={selectedBatches}
                        isLoadingBatches={isLoadingBatches}
                        showBatchSection={showBatchSection}
                        handleBatchQuantityChange={handleBatchQuantityChange}
                        handleSelectCompleteBatch={handleSelectCompleteBatch}
                        getTotalSelectedQuantity={getTotalSelectedQuantity}
                    />
                </div>

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
