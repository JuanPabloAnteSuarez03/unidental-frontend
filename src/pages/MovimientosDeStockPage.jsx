import React, { useState, useRef, useCallback, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useProducts } from "../context/ProductsContext";
import inventoryService from "../services/inventoryService";
import batchesService from "../services/batchesService";
import advancedInventoryService from "../services/advancedInventoryService";
import MovementsHeader from "../components/StockMovements/MovementsHeader";
import MovementNotification from "../components/StockMovements/MovementNotification";
import MultipleProductsMovementForm from "../components/StockMovements/MultipleProductsMovementForm";
import MovementFilters from "../components/StockMovements/MovementFilters";
import MovementsTable from "../components/StockMovements/MovementsTable";
import MovementsPagination from "../components/StockMovements/MovementsPagination";

// Función para normalizar texto removiendo tildes y caracteres especiales
const normalizeText = (text) => {
    if (!text) return "";
    return text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remover diacríticos (tildes)
        .toLowerCase()
        .trim();
};

const MovimientosDeStockPage = () => {
    const location = useLocation();
    const prefilledData = location.state;

    // Estado para el formulario
    const [formData, setFormData] = useState({
        location: prefilledData?.location || "",
        movementType: prefilledData?.movementType || "in",
        notes: prefilledData?.notes || "",
    });

    // Estado para filtros del historial
    const [filters, setFilters] = useState({
        dateFrom: "",
        dateTo: "",
        locationFilter: "",
        movementTypeFilter: "",
        searchQuery: "",
    });

    // Estados para cargar movimientos reales de la base de datos
    const [allMovements, setAllMovements] = useState([]); // Todos los movimientos cargados
    const [filteredMovements, setFilteredMovements] = useState([]); // Movimientos filtrados localmente
    const [isLoadingMovements, setIsLoadingMovements] = useState(false);
    const [movementsError, setMovementsError] = useState(null);
    const [movementsCurrentPage, setMovementsCurrentPage] = useState(1);
    const [movementsTotalPages, setMovementsTotalPages] = useState(0);
    const [movementsTotalCount, setMovementsTotalCount] = useState(0);

    // Estados para ubicaciones reales de la base de datos
    const [locations, setLocations] = useState([]);
    const [isLoadingLocations, setIsLoadingLocations] = useState(false);

    // Estado para mostrar mensajes de éxito/error
    const [notification, setNotification] = useState({
        show: false,
        type: "",
        message: "",
    });

    // Estado para el proceso de envío de movimientos
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Obtener el contexto de autenticación y productos
    const { authToken } = useAuth();
    const { refreshCache } = useProducts();

    // Función para manejar cambios en el formulario
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    // Función para manejar cambios en los filtros
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters({
            ...filters,
            [name]: value,
        });
    };

    // Función para filtrar movimientos localmente
    const filterMovementsLocally = useCallback(
        (searchTerm, dateFrom, dateTo, locationFilter, movementTypeFilter) => {
            if (!allMovements.length) return [];

            let filtered = [...allMovements];

            // Filtrar por término de búsqueda - SOLO en nombre del producto
            if (searchTerm.trim()) {
                const normalizedSearchTerm = normalizeText(searchTerm);

                filtered = filtered.filter((movement) => {
                    // Buscar ÚNICAMENTE en el nombre del producto
                    const productName = String(
                        movement.product_name ||
                            movement.product?.name ||
                            movement.product ||
                            ""
                    );

                    // Normalizar el nombre del producto
                    const normalizedProductName = normalizeText(productName);

                    // Verificar si el término de búsqueda coincide SOLO con el nombre del producto
                    return normalizedProductName.includes(normalizedSearchTerm);
                });
            }

            // Filtrar por fecha desde
            if (dateFrom) {
                filtered = filtered.filter((movement) => {
                    try {
                        const movementDate = new Date(
                            movement.occurred_at ||
                                movement.created_at ||
                                movement.date
                        );
                        const filterDate = new Date(dateFrom);
                        return movementDate >= filterDate;
                    } catch (error) {
                        return false;
                    }
                });
            }

            // Filtrar por fecha hasta
            if (dateTo) {
                filtered = filtered.filter((movement) => {
                    try {
                        const movementDate = new Date(
                            movement.occurred_at ||
                                movement.created_at ||
                                movement.date
                        );
                        const filterDate = new Date(dateTo);
                        filterDate.setHours(23, 59, 59, 999);
                        return movementDate <= filterDate;
                    } catch (error) {
                        return false;
                    }
                });
            }

            // Filtrar por ubicación
            if (locationFilter) {
                filtered = filtered.filter((movement) => {
                    // Usar solo el id para comparar, ambos como string
                    const movementLocationId =
                        movement.location_id || movement.location;
                    return (
                        movementLocationId &&
                        movementLocationId.toString() === locationFilter
                    );
                });
            }

            // Filtrar por tipo de movimiento
            if (movementTypeFilter) {
                filtered = filtered.filter((movement) => {
                    return (
                        movement.movement_type === movementTypeFilter ||
                        movement.type === movementTypeFilter
                    );
                });
            }

            return filtered;
        },
        [allMovements]
    );

    // Efecto para filtrar movimientos cuando cambian los filtros
    useEffect(() => {
        // Si no hay filtros activos, mostrar todos los movimientos
        const hasActiveFilters =
            filters.searchQuery.trim() ||
            filters.dateFrom ||
            filters.dateTo ||
            filters.locationFilter ||
            filters.movementTypeFilter;

        let filtered;
        if (!hasActiveFilters) {
            filtered = allMovements;
        } else {
            filtered = filterMovementsLocally(
                filters.searchQuery,
                filters.dateFrom,
                filters.dateTo,
                filters.locationFilter,
                filters.movementTypeFilter
            );
        }

        setFilteredMovements(filtered);
        setMovementsTotalCount(filtered.length);

        // Recalcular paginación
        const itemsPerPage = 10;
        const totalPages = Math.ceil(filtered.length / itemsPerPage);
        setMovementsTotalPages(totalPages);

        // Si estamos en una página que ya no existe, volver a la primera
        if (movementsCurrentPage > totalPages && totalPages > 0) {
            setMovementsCurrentPage(1);
        }
    }, [filters, filterMovementsLocally, movementsCurrentPage, allMovements]);

    // Función para aplicar filtros (ya no necesaria para cargar desde API, solo actualiza la vista)
    const applyFilters = () => {
        // Los filtros se aplican automáticamente a través del useEffect
        setMovementsCurrentPage(1);
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
        setMovementsCurrentPage(1);
    };

    // Función para manejar el envío del formulario
    const handleSubmit = async (e, multipleProducts) => {
        e.preventDefault();

        // Validaciones básicas
        if (!authToken) {
            setNotification({
                show: true,
                type: "error",
                message: "No hay token de autenticación disponible",
            });
            return;
        }

        if (!multipleProducts || multipleProducts.length === 0) {
            setNotification({
                show: true,
                type: "error",
                message: "Debe agregar al menos un producto para continuar",
            });
            return;
        }

        if (!formData.location) {
            setNotification({
                show: true,
                type: "error",
                message: "Debe seleccionar una ubicación",
            });
            return;
        }

        // Validar que todos los productos tengan cantidad válida
        const invalidProducts = multipleProducts.filter((p) => {
            if (p.requiresBatchControl && p.batchesData.length > 0) {
                // Para productos con control de lotes, verificar cantidades en los lotes
                return !p.batchesData.some(
                    (batch) => batch.quantity && parseInt(batch.quantity) > 0
                );
            } else {
                // Para productos sin control de lotes, verificar cantidad principal
                return !p.quantity || parseInt(p.quantity) <= 0;
            }
        });

        if (invalidProducts.length > 0) {
            const productNames = invalidProducts
                .map((p) => p.product.name)
                .join(", ");
            const hasLotProducts = invalidProducts.some(
                (p) => p.requiresBatchControl
            );

            setNotification({
                show: true,
                type: "error",
                message: hasLotProducts
                    ? `Los siguientes productos con lotes necesitan cantidades válidas en sus lotes: ${productNames}`
                    : `Los siguientes productos necesitan cantidades válidas: ${productNames}`,
            });
            return;
        }

        // Validar productos con lotes para movimientos de entrada
        if (formData.movementType === "in") {
            const invalidBatchProducts = multipleProducts.filter((p) => {
                if (p.requiresBatchControl && p.batchesData.length > 0) {
                    // Para productos con lotes, verificar que tengan fecha de vencimiento
                    return p.batchesData.some(
                        (batch) =>
                            batch.quantity &&
                            parseInt(batch.quantity) > 0 &&
                            !batch.expiry_date
                    );
                }
                return false;
            });

            if (invalidBatchProducts.length > 0) {
                setNotification({
                    show: true,
                    type: "error",
                    message:
                        "Para movimientos de entrada, todos los lotes deben tener fecha de vencimiento",
                });
                return;
            }
        }

        setIsSubmitting(true);

        try {
            const successfulMovements = [];
            const failedMovements = [];

            // Procesar cada producto
            for (const productEntry of multipleProducts) {
                try {
                    // Log para debuggear los datos del producto
                    console.log("🔍 Procesando productEntry:", productEntry);
                    console.log("🔍 Product ID:", productEntry.product?.id);
                    console.log("🔍 Product completo:", productEntry.product);

                    // Validar que el producto tenga un ID válido
                    if (!productEntry.product?.id) {
                        throw new Error(
                            `El producto "${
                                productEntry.product?.name || "sin nombre"
                            }" no tiene un ID válido`
                        );
                    }

                    // Si el producto requiere control de lotes, procesar cada lote
                    if (
                        productEntry.requiresBatchControl &&
                        productEntry.batchesData.length > 0
                    ) {
                        for (const batchData of productEntry.batchesData) {
                            if (
                                batchData.quantity &&
                                parseInt(batchData.quantity) > 0
                            ) {
                                const movementData = {
                                    product: productEntry.product.id,
                                    location: formData.location,
                                    movement_type: formData.movementType,
                                    quantity: parseInt(batchData.quantity),
                                    notes: `${
                                        formData.notes
                                            ? formData.notes + " - "
                                            : ""
                                    }Lote: ${
                                        batchData.batch_number || "Sin número"
                                    }${
                                        batchData.expiry_date
                                            ? ", Vence: " +
                                              batchData.expiry_date
                                            : ""
                                    }`,
                                };

                                // Para movimientos de ENTRADA con lotes: crear lote primero
                                if (formData.movementType === "in") {
                                    // Crear el lote primero
                                    const batchCreateData = {
                                        product: productEntry.product.id,
                                        batch_number:
                                            batchData.batch_number ||
                                            `LOTE-${Date.now()}`,
                                        expiry_date: batchData.expiry_date,
                                        manufacturing_date:
                                            batchData.manufacturing_date ||
                                            null,
                                        supplier_reference:
                                            batchData.supplier_reference ||
                                            null,
                                    };

                                    console.log(
                                        "🔍 Creando lote:",
                                        batchCreateData
                                    );

                                    try {
                                        const createdBatch =
                                            await batchesService.createBatch(
                                                batchCreateData,
                                                authToken
                                            );
                                        console.log(
                                            "✅ Lote creado:",
                                            createdBatch
                                        );

                                        // Usar el ID del lote creado en el movimiento
                                        movementData.batch = createdBatch.id;
                                    } catch (batchError) {
                                        console.error(
                                            "❌ Error al crear lote:",
                                            batchError
                                        );
                                        throw new Error(
                                            `Error al crear lote: ${batchError.message}`
                                        );
                                    }
                                }

                                // Para movimientos de SALIDA con lotes: enviar batch ID existente
                                if (
                                    formData.movementType === "out" &&
                                    batchData.batch_id
                                ) {
                                    movementData.batch = batchData.batch_id;
                                }

                                // Log para debug
                                console.log(
                                    "🔍 Enviando movementData:",
                                    movementData
                                );

                                const response =
                                    await inventoryService.createInventoryMovement(
                                        movementData,
                                        authToken
                                    );
                                successfulMovements.push({
                                    product: productEntry.product.name,
                                    quantity: batchData.quantity,
                                    batch: batchData.batch_number,
                                    expiry_date: batchData.expiry_date,
                                    response,
                                });
                            }
                        }
                    } else {
                        // Producto sin control de lotes estricto
                        const movementData = {
                            product: productEntry.product.id,
                            location: formData.location,
                            movement_type: formData.movementType,
                            quantity: parseInt(productEntry.quantity),
                            notes:
                                formData.notes ||
                                `Movimiento ${
                                    formData.movementType === "in"
                                        ? "de entrada"
                                        : "de salida"
                                } - ${productEntry.product.name}`,
                        };

                        // Si es entrada y tiene fecha de vencimiento, incluirla
                        if (
                            formData.movementType === "in" &&
                            productEntry.expiryDate
                        ) {
                            movementData.expiry_date = productEntry.expiryDate;
                        }

                        const response =
                            await inventoryService.createInventoryMovement(
                                movementData,
                                authToken
                            );
                        successfulMovements.push({
                            product: productEntry.product.name,
                            quantity: productEntry.quantity,
                            expiry_date: productEntry.expiryDate,
                            response,
                        });
                    }
                } catch (error) {
                    console.error(
                        `Error al procesar producto ${productEntry.product.name}:`,
                        error
                    );
                    failedMovements.push({
                        product: productEntry.product.name,
                        error: error.message,
                    });
                }
            }

            // Mostrar resultados
            if (
                successfulMovements.length > 0 &&
                failedMovements.length === 0
            ) {
                setNotification({
                    show: true,
                    type: "success",
                    message: `✅ Se registraron exitosamente ${
                        successfulMovements.length
                    } movimiento${
                        successfulMovements.length > 1 ? "s" : ""
                    } de inventario`,
                });

                // Limpiar el formulario y recargar datos
                // El componente hijo manejará la limpieza de productos
                setFormData({
                    location: "",
                    movementType: "in",
                    notes: "",
                });

                // Recargar movimientos y refrescar cache
                loadAllMovements();
                refreshCache();
            } else if (
                successfulMovements.length > 0 &&
                failedMovements.length > 0
            ) {
                setNotification({
                    show: true,
                    type: "warning",
                    message: `⚠️ Se procesaron ${successfulMovements.length} movimientos exitosamente, pero ${failedMovements.length} fallaron. Revise los errores en consola.`,
                });

                // Recargar movimientos parcialmente
                loadAllMovements();
                refreshCache();
            } else {
                setNotification({
                    show: true,
                    type: "error",
                    message: `❌ No se pudo procesar ningún movimiento. Error: ${
                        failedMovements[0]?.error || "Error desconocido"
                    }`,
                });
            }

            // Auto-ocultar notificación después de 5 segundos
            setTimeout(() => {
                setNotification({ show: false, type: "", message: "" });
            }, 5000);
        } catch (error) {
            console.error("Error general al procesar movimientos:", error);
            setNotification({
                show: true,
                type: "error",
                message: `Error al procesar movimientos: ${error.message}`,
            });

            setTimeout(() => {
                setNotification({ show: false, type: "", message: "" });
            }, 5000);
        } finally {
            setIsSubmitting(false);
        }
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

    // Función para cargar TODOS los movimientos de inventario desde la base de datos (sin paginación)
    const loadAllMovements = useCallback(async () => {
        if (!authToken) {
            return;
        }

        setIsLoadingMovements(true);
        setMovementsError(null);

        try {
            console.log("🔄 Cargando movimientos de stock...");

            // Cargar movimientos con un tamaño de página grande
            const params = {
                page_size: 2000, // Tamaño razonable pero grande
            };

            const response = await inventoryService.getInventoryMovements(
                params,
                authToken
            );

            const movements = response.results || [];
            console.log(`✅ ${movements.length} movimientos cargados`);

            setAllMovements(movements);
            setFilteredMovements(movements);
            setMovementsTotalCount(movements.length);

            // Calcular paginación inicial
            const itemsPerPage = 10;
            const totalPages = Math.ceil(movements.length / itemsPerPage);
            setMovementsTotalPages(totalPages);
            setMovementsCurrentPage(1);
        } catch (error) {
            console.error("❌ Error al cargar movimientos:", error);
            setMovementsError(error.message);
            setAllMovements([]);
            setFilteredMovements([]);
        } finally {
            setIsLoadingMovements(false);
        }
    }, [authToken]);

    // Cargar movimientos al montar el componente
    useEffect(() => {
        if (authToken) {
            loadAllMovements();
        }
    }, [authToken, loadAllMovements]);

    // Obtener movimientos para la página actual
    const getCurrentPageMovements = () => {
        const itemsPerPage = 10;
        const startIndex = (movementsCurrentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredMovements.slice(startIndex, endIndex);
    };

    // Funciones de paginación para movimientos filtrados
    const goToMovementsPage = (page) => {
        if (page >= 1 && page <= movementsTotalPages) {
            setMovementsCurrentPage(page);
        }
    };

    const goToNextMovementsPage = () => {
        if (movementsCurrentPage < movementsTotalPages) {
            setMovementsCurrentPage(movementsCurrentPage + 1);
        }
    };

    const goToPrevMovementsPage = () => {
        if (movementsCurrentPage > 1) {
            setMovementsCurrentPage(movementsCurrentPage - 1);
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

            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "32px",
                }}
            >
                {/* Formulario para registrar movimientos múltiples */}
                <div style={{ width: "100%" }}>
                    <MultipleProductsMovementForm
                        formData={formData}
                        handleInputChange={handleInputChange}
                        handleSubmit={handleSubmit}
                        locations={locations}
                        isLoadingLocations={isLoadingLocations}
                        isSubmitting={isSubmitting}
                        prefilledProducts={prefilledData?.products || []}
                    />

                    {/* Notificación debajo del formulario */}
                    <MovementNotification notification={notification} />
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
                                            {filters.searchQuery ||
                                            filters.dateFrom ||
                                            filters.dateTo ||
                                            filters.locationFilter ||
                                            filters.movementTypeFilter
                                                ? "encontrado"
                                                : "registrado"}
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
                            realMovements={getCurrentPageMovements()}
                            isLoadingMovements={isLoadingMovements}
                            movementsError={movementsError}
                            movementsTotalCount={movementsTotalCount}
                        />

                        {/* Paginación */}
                        <MovementsPagination
                            isLoadingMovements={isLoadingMovements}
                            realMovements={getCurrentPageMovements()}
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
