import React, { useState, useRef, useCallback, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import inventoryService from "../services/inventoryService";
import ProductSearchSelector from "../components/Common/ProductSearchSelector";

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

    // Estados para ubicaciones reales de la base de datos
    const [locations, setLocations] = useState([]);
    const [isLoadingLocations, setIsLoadingLocations] = useState(false);

    // Estado para mostrar mensajes de éxito/error
    const [notification, setNotification] = useState({
        show: false,
        type: "",
        message: "",
    });

    // Estados simplificados para el producto seleccionado
    const [selectedProductFromSearch, setSelectedProductFromSearch] = useState(null);

    // Estado para el campo de búsqueda simple
    const [productSearchTerm, setProductSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearchingSimple, setIsSearchingSimple] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [searchCurrentPage, setSearchCurrentPage] = useState(1);
    const [searchTotalPages, setSearchTotalPages] = useState(0);
    const [searchTotalCount, setSearchTotalCount] = useState(0);
    const [searchHasNext, setSearchHasNext] = useState(false);
    const [searchHasPrev, setSearchHasPrev] = useState(false);

    // Obtener el contexto de autenticación
    const { authToken } = useAuth();

    // Función para manejar la selección de producto del nuevo componente
    const handleProductSelected = useCallback((product) => {
        setSelectedProductFromSearch(product);
        setFormData(prev => ({
            ...prev,
            product: product.name
        }));
    }, []);

    // Función para limpiar la selección de producto
    const handleProductSelectionCleared = useCallback(() => {
        setSelectedProductFromSearch(null);
        setFormData(prev => ({
            ...prev,
            product: ""
        }));
    }, []);

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

    // Función para aplicar filtros
    const applyFilters = () => {
        // Recargar los movimientos con los filtros aplicados
        loadInventoryMovements(1);

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
        setFilters({
            dateFrom: "",
            dateTo: "",
            locationFilter: "",
            movementTypeFilter: "",
            searchQuery: "",
        });

        // Recargar movimientos sin filtros
        setTimeout(() => {
            loadInventoryMovements(1);
        }, 100); // Pequeño delay para que se actualicen los filtros

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
    const handleSubmit = (e) => {
        e.preventDefault();

        // Validación básica
        if (
            !formData.product ||
            !formData.location ||
            !formData.quantity ||
            !formData.expiryDate
        ) {
            setNotification({
                show: true,
                type: "error",
                message: "Por favor complete todos los campos obligatorios",
            });
            return;
        }

        // Creamos un nuevo movimiento con los datos del formulario
        const newMovement = {
            id: Date.now(), // Usamos timestamp como ID temporal
            date: new Date().toLocaleString("es"),
            product: formData.product,
            sku: "",
            location: formData.location,
            movementType: formData.movementType,
            quantity: parseInt(formData.quantity),
            notes: formData.notes,
            user: "",
            expiryDate: formData.expiryDate,
            reference: "",
        };

        // Actualizamos el historial
        setMovementHistory([newMovement, ...movementHistory]);

        // Mostramos mensaje de éxito
        setNotification({
            show: true,
            type: "success",
            message: "Movimiento registrado con éxito",
        });

        // Limpiamos el formulario
        setFormData({
            product: "",
            location: "",
            movementType: "in",
            quantity: "",
            expiryDate: "",
            notes: "",
        });

        // Limpiar también la selección del producto
        setSelectedProductFromSearch(null);

        // Recargar los movimientos de la base de datos para mostrar el nuevo registro
        setTimeout(() => {
            loadInventoryMovements(1);
        }, 500); // Pequeño delay para que se procese el registro en el backend

        // Ocultamos la notificación después de 3 segundos
        setTimeout(() => {
            setNotification({ show: false, type: "", message: "" });
        }, 3000);
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
        { value: "adjustment", label: "Ajuste" },
    ];

    // Función para cargar ubicaciones desde la base de datos
    const loadLocations = useCallback(async () => {
        if (!authToken) {
            return;
        }

        setIsLoadingLocations(true);
        try {
            console.log("Intentando cargar ubicaciones...");
            const data = await inventoryService.getLocations(authToken);
            console.log("Ubicaciones recibidas:", data);
            if (data && data.length > 0) {
                console.log("Estructura de la primera ubicación:", data[0]);
            }
            setLocations(data || []);
        } catch (error) {
            console.error("Error al cargar ubicaciones:", error);
            // En caso de error, usar ubicaciones por defecto
            setLocations([
                { id: 1, name: "Sede Principal" },
                { id: 2, name: "Sede Norte" },
                { id: 3, name: "Sede Sur" },
                { id: 4, name: "Almacén Central" },
            ]);
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

    // Función para manejar el cambio en el campo de búsqueda simple
    const handleProductSearchChange = (e) => {
        setProductSearchTerm(e.target.value);
    };

    // Función para limpiar la búsqueda
    const handleClearSearch = () => {
        setProductSearchTerm("");
        setSearchResults([]);
        setHasSearched(false);
        setSearchCurrentPage(1);
        setSearchTotalPages(0);
        setSearchTotalCount(0);
        setSearchHasNext(false);
        setSearchHasPrev(false);
    };

    // Funciones de paginación para búsqueda
    const goToSearchPage = (page) => {
        if (page >= 1 && page <= searchTotalPages) {
            handleProductSearch(page);
        }
    };

    const goToNextSearchPage = () => {
        if (searchHasNext) {
            goToSearchPage(searchCurrentPage + 1);
        }
    };

    const goToPrevSearchPage = () => {
        if (searchHasPrev) {
            goToSearchPage(searchCurrentPage - 1);
        }
    };

    // Función para manejar el botón de búsqueda
    const handleProductSearch = async (page = 1) => {
        if (!authToken || !productSearchTerm.trim()) {
            return;
        }

        setIsSearchingSimple(true);

        // Solo marcar como buscado en la primera página
        if (page === 1) {
            setHasSearched(true);
        }

        try {
            // Buscar usando el parámetro 'name' como en InventoryPage
            const data = await inventoryService.getProducts(
                {
                    name: productSearchTerm.trim(),
                    page: page,
                    page_size: 25, // Usar el mismo tamaño que InventoryPage
                },
                authToken
            );

            setSearchResults(data.results || []);
            setSearchTotalCount(data.count || 0);
            setSearchCurrentPage(page);

            // Calcular total de páginas
            const totalPages = Math.ceil((data.count || 0) / 25);
            setSearchTotalPages(totalPages);

            // Determinar si hay páginas siguiente y anterior
            setSearchHasNext(!!data.next);
            setSearchHasPrev(!!data.previous);
        } catch (error) {
            console.error("Error al buscar productos:", error);
            setSearchResults([]);
            setSearchTotalCount(0);
            setSearchCurrentPage(1);
            setSearchTotalPages(0);
            setSearchHasNext(false);
            setSearchHasPrev(false);
        } finally {
            setIsSearchingSimple(false);
        }
    };

    // Función para cargar movimientos de inventario desde la base de datos
    const loadInventoryMovements = useCallback(
        async (page = 1, additionalFilters = {}) => {
            if (!authToken) {
                return;
            }

            setIsLoadingMovements(true);
            setMovementsError(null);

            try {
                // Construir parámetros para la API
                const params = {
                    page: page,
                    page_size: 25, // Mismo tamaño que otras tablas
                    ...additionalFilters, // Filtros adicionales (fechas, productos, etc.)
                };

                // Agregar filtros actuales si existen
                if (filters.dateFrom) {
                    params.date_from = filters.dateFrom;
                }
                if (filters.dateTo) {
                    params.date_to = filters.dateTo;
                }
                if (filters.locationFilter) {
                    params.location = filters.locationFilter;
                }
                if (filters.movementTypeFilter) {
                    params.movement_type = filters.movementTypeFilter;
                }
                if (filters.searchQuery) {
                    params.search = filters.searchQuery;
                }

                console.log("Parámetros enviados a la API:", params);
                console.log(
                    "Filtro de ubicación seleccionado:",
                    filters.locationFilter
                );

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
                setMovementsError(
                    "Error al cargar los movimientos de inventario"
                );
                setRealMovements([]);
            } finally {
                setIsLoadingMovements(false);
            }
        },
        [authToken, filters]
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
                padding: "20px",
                maxWidth: "1400px",
                margin: "0 auto",
                fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            }}
        >
            {/* Título de la página */}
            <div
                style={{
                    marginBottom: "30px",
                    borderBottom: "2px solid #eee",
                    paddingBottom: "15px",
                }}
            >
                <h1
                    style={{
                        color: "#2c3e50",
                        fontSize: "28px",
                        fontWeight: "700",
                        margin: "0 0 8px 0",
                    }}
                >
                    Movimientos de Stock
                </h1>
                <p style={{ color: "#6c757d", fontSize: "16px", margin: 0 }}>
                    Registra y consulta todos los movimientos de inventario
                </p>
            </div>

            {/* Campo de búsqueda de productos */}
            <div
                style={{
                    backgroundColor: "#fff",
                    borderRadius: "8px",
                    padding: "20px",
                    marginBottom: "30px",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                }}
            >
                <h3
                    style={{
                        fontSize: "18px",
                        margin: "0 0 15px 0",
                        color: "#2c3e50",
                    }}
                >
                    Buscar Producto
                </h3>

                <div
                    style={{
                        display: "flex",
                        gap: "10px",
                        alignItems: "flex-end",
                    }}
                >
                    <div style={{ flex: "1" }}>
                        <label
                            htmlFor="productSearch"
                            style={{
                                display: "block",
                                marginBottom: "5px",
                                fontWeight: "500",
                                color: "#495057",
                                fontSize: "14px",
                            }}
                        >
                            Nombre del producto:
                        </label>
                        <input
                            type="text"
                            id="productSearch"
                            value={productSearchTerm}
                            onChange={handleProductSearchChange}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleProductSearch();
                                }
                            }}
                            style={{
                                width: "100%",
                                padding: "10px",
                                borderRadius: "4px",
                                border: "1px solid #ced4da",
                                fontSize: "16px",
                                boxSizing: "border-box",
                            }}
                            placeholder="Ingrese el nombre del producto a buscar..."
                        />
                    </div>

                    <button
                        onClick={handleProductSearch}
                        disabled={
                            isSearchingSimple || !productSearchTerm.trim()
                        }
                        style={{
                            backgroundColor:
                                isSearchingSimple || !productSearchTerm.trim()
                                    ? "#6c757d"
                                    : "#2c3e50",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            padding: "10px 20px",
                            fontSize: "16px",
                            cursor:
                                isSearchingSimple || !productSearchTerm.trim()
                                    ? "not-allowed"
                                    : "pointer",
                            fontWeight: "500",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {isSearchingSimple ? "Buscando..." : "Buscar"}
                    </button>

                    {hasSearched && (
                        <button
                            onClick={handleClearSearch}
                            style={{
                                backgroundColor: "#6c757d",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                padding: "10px 15px",
                                fontSize: "16px",
                                cursor: "pointer",
                                fontWeight: "500",
                                whiteSpace: "nowrap",
                            }}
                        >
                            Limpiar
                        </button>
                    )}
                </div>
            </div>

            {/* Tabla de resultados de búsqueda */}
            {hasSearched && (
                <div
                    style={{
                        backgroundColor: "#fff",
                        borderRadius: "8px",
                        padding: "20px",
                        marginBottom: "30px",
                        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                    }}
                >
                    <h3
                        style={{
                            fontSize: "18px",
                            margin: "0 0 15px 0",
                            color: "#2c3e50",
                        }}
                    >
                        Resultados de Búsqueda
                        {searchTotalCount > 0 && (
                            <span
                                style={{
                                    color: "#6c757d",
                                    fontSize: "14px",
                                    fontWeight: "normal",
                                }}
                            >
                                {" "}
                                ({searchTotalCount} producto
                                {searchTotalCount !== 1 ? "s" : ""} encontrado
                                {searchTotalCount !== 1 ? "s" : ""})
                                {searchTotalPages > 1 && (
                                    <span>
                                        {" "}
                                        - Página {searchCurrentPage} de{" "}
                                        {searchTotalPages}
                                    </span>
                                )}
                            </span>
                        )}
                    </h3>

                    {searchResults.length > 0 ? (
                        <div style={{ overflowX: "auto" }}>
                            <table
                                style={{
                                    width: "100%",
                                    borderCollapse: "collapse",
                                    minWidth: "500px",
                                }}
                            >
                                <thead>
                                    <tr
                                        style={{
                                            backgroundColor: "#2c3e50",
                                            color: "white",
                                        }}
                                    >
                                        <th
                                            style={{
                                                padding: "12px 8px",
                                                textAlign: "left",
                                                border: "1px solid #34495e",
                                            }}
                                        >
                                            Nombre del Producto
                                        </th>
                                        <th
                                            style={{
                                                padding: "12px 8px",
                                                textAlign: "left",
                                                border: "1px solid #34495e",
                                            }}
                                        >
                                            Categoría
                                        </th>
                                        <th
                                            style={{
                                                padding: "12px 8px",
                                                textAlign: "center",
                                                border: "1px solid #34495e",
                                            }}
                                        >
                                            Seleccionar
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {searchResults.map((product) => (
                                        <tr key={product.id}>
                                            <td
                                                style={{
                                                    padding: "10px 8px",
                                                    borderBottom:
                                                        "1px solid #dee2e6",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        fontWeight: "500",
                                                        color: "#2c3e50",
                                                    }}
                                                >
                                                    {product.name}
                                                </div>
                                            </td>
                                            <td
                                                style={{
                                                    padding: "10px 8px",
                                                    borderBottom:
                                                        "1px solid #dee2e6",
                                                }}
                                            >
                                                {product.category_name || "-"}
                                            </td>
                                            <td
                                                style={{
                                                    padding: "10px 8px",
                                                    borderBottom:
                                                        "1px solid #dee2e6",
                                                    textAlign: "center",
                                                }}
                                            >
                                                <button
                                                    onClick={() => {
                                                        // Seleccionar este producto para el formulario
                                                        setFormData({
                                                            ...formData,
                                                            product:
                                                                product.name,
                                                        });
                                                        setSelectedProductFromSearch(
                                                            product
                                                        );
                                                        // Limpiar la búsqueda automáticamente
                                                        handleClearSearch();
                                                    }}
                                                    style={{
                                                        backgroundColor:
                                                            "#007bff",
                                                        color: "white",
                                                        border: "none",
                                                        borderRadius: "4px",
                                                        padding: "6px 12px",
                                                        fontSize: "12px",
                                                        cursor: "pointer",
                                                        fontWeight: "500",
                                                    }}
                                                >
                                                    Seleccionar
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div
                            style={{
                                textAlign: "center",
                                padding: "40px 20px",
                                backgroundColor: "#f8f9fa",
                                borderRadius: "8px",
                                border: "1px solid #dee2e6",
                            }}
                        >
                            <p
                                style={{
                                    color: "#6c757d",
                                    fontSize: "16px",
                                    margin: 0,
                                }}
                            >
                                No se encontraron productos que coincidan con "
                                {productSearchTerm}"
                            </p>
                        </div>
                    )}

                    {/* Paginación de resultados de búsqueda */}
                    {searchTotalPages > 1 && (
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginTop: "20px",
                                padding: "10px 0",
                            }}
                        >
                            <div style={{ color: "#6c757d", fontSize: "14px" }}>
                                Mostrando{" "}
                                {Math.min(
                                    25 * (searchCurrentPage - 1) + 1,
                                    searchTotalCount
                                )}
                                -
                                {Math.min(
                                    25 * searchCurrentPage,
                                    searchTotalCount
                                )}{" "}
                                de {searchTotalCount} productos
                            </div>
                            <div style={{ display: "flex", gap: "5px" }}>
                                <button
                                    onClick={goToPrevSearchPage}
                                    disabled={
                                        !searchHasPrev || isSearchingSimple
                                    }
                                    style={{
                                        padding: "6px 12px",
                                        border: "1px solid #ced4da",
                                        backgroundColor:
                                            searchHasPrev && !isSearchingSimple
                                                ? "#fff"
                                                : "#f8f9fa",
                                        borderRadius: "4px",
                                        color:
                                            searchHasPrev && !isSearchingSimple
                                                ? "#2c3e50"
                                                : "#6c757d",
                                        cursor:
                                            searchHasPrev && !isSearchingSimple
                                                ? "pointer"
                                                : "not-allowed",
                                        fontSize: "14px",
                                    }}
                                >
                                    Anterior
                                </button>

                                {/* Mostrar algunas páginas */}
                                {Array.from(
                                    { length: Math.min(5, searchTotalPages) },
                                    (_, i) => {
                                        const pageNum =
                                            Math.max(1, searchCurrentPage - 2) +
                                            i;
                                        if (pageNum > searchTotalPages)
                                            return null;

                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() =>
                                                    goToSearchPage(pageNum)
                                                }
                                                disabled={isSearchingSimple}
                                                style={{
                                                    padding: "6px 12px",
                                                    border: `1px solid ${
                                                        pageNum ===
                                                        searchCurrentPage
                                                            ? "#2c3e50"
                                                            : "#ced4da"
                                                    }`,
                                                    backgroundColor:
                                                        pageNum ===
                                                        searchCurrentPage
                                                            ? "#2c3e50"
                                                            : "#fff",
                                                    borderRadius: "4px",
                                                    color:
                                                        pageNum ===
                                                        searchCurrentPage
                                                            ? "#fff"
                                                            : "#2c3e50",
                                                    cursor: !isSearchingSimple
                                                        ? "pointer"
                                                        : "not-allowed",
                                                    fontSize: "14px",
                                                }}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    }
                                )}

                                <button
                                    onClick={goToNextSearchPage}
                                    disabled={
                                        !searchHasNext || isSearchingSimple
                                    }
                                    style={{
                                        padding: "6px 12px",
                                        border: "1px solid #ced4da",
                                        backgroundColor:
                                            searchHasNext && !isSearchingSimple
                                                ? "#fff"
                                                : "#f8f9fa",
                                        borderRadius: "4px",
                                        color:
                                            searchHasNext && !isSearchingSimple
                                                ? "#2c3e50"
                                                : "#6c757d",
                                        cursor:
                                            searchHasNext && !isSearchingSimple
                                                ? "pointer"
                                                : "not-allowed",
                                        fontSize: "14px",
                                    }}
                                >
                                    Siguiente
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Notificación */}
            {notification.show && (
                <div
                    style={{
                        padding: "10px 15px",
                        marginBottom: "20px",
                        borderRadius: "4px",
                        backgroundColor:
                            notification.type === "success"
                                ? "#d4edda"
                                : "#f8d7da",
                        color:
                            notification.type === "success"
                                ? "#155724"
                                : "#721c24",
                        border: `1px solid ${
                            notification.type === "success"
                                ? "#c3e6cb"
                                : "#f5c6cb"
                        }`,
                    }}
                >
                    {notification.message}
                </div>
            )}

            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "30px",
                }}
            >
                {/* Formulario para registrar nuevo movimiento */}
                <div style={{ width: "100%" }}>
                    <div
                        style={{
                            backgroundColor: "#fff",
                            borderRadius: "8px",
                            padding: "20px",
                            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                            maxWidth: "800px",
                            margin: "0 auto",
                        }}
                    >
                        <h2
                            style={{
                                fontSize: "20px",
                                margin: "0 0 20px 0",
                                color: "#2c3e50",
                            }}
                        >
                            Registrar Nuevo Movimiento
                        </h2>

                        <form onSubmit={handleSubmit}>
                            {/* Producto */}
                            <div
                                style={{
                                    marginBottom: "15px",
                                    position: "relative",
                                }}
                            >
                                <label
                                    htmlFor="product"
                                    style={{
                                        display: "block",
                                        marginBottom: "5px",
                                        fontWeight: "500",
                                        color: "#495057",
                                    }}
                                >
                                    Producto *
                                </label>

                                {selectedProductFromSearch ? (
                                    // Vista cuando hay un producto seleccionado
                                    <div style={{ position: "relative" }}>
                                        <input
                                            type="text"
                                            value={
                                                selectedProductFromSearch.name
                                            }
                                            readOnly
                                            style={{
                                                width: "100%",
                                                padding: "10px 80px 10px 10px",
                                                borderRadius: "4px",
                                                border: "1px solid #28a745",
                                                fontSize: "16px",
                                                boxSizing: "border-box",
                                                backgroundColor: "#f8fff9",
                                                color: "#155724",
                                                fontWeight: "500",
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleProductSelectionCleared}
                                            style={{
                                                position: "absolute",
                                                right: "5px",
                                                top: "50%",
                                                transform: "translateY(-50%)",
                                                backgroundColor: "#dc3545",
                                                color: "white",
                                                border: "none",
                                                borderRadius: "3px",
                                                padding: "5px 8px",
                                                fontSize: "12px",
                                                cursor: "pointer",
                                                fontWeight: "500",
                                            }}
                                        >
                                            Cambiar
                                        </button>

                                        {/* Información adicional del producto seleccionado */}
                                        <div
                                            style={{
                                                fontSize: "12px",
                                                color: "#28a745",
                                                marginTop: "5px",
                                                fontWeight: "500",
                                            }}
                                        >
                                            ✓ Producto seleccionado
                                            {selectedProductFromSearch.sku && (
                                                <span
                                                    style={{
                                                        marginLeft: "10px",
                                                        color: "#6c757d",
                                                    }}
                                                >
                                                    SKU:{" "}
                                                    {
                                                        selectedProductFromSearch.sku
                                                    }
                                                </span>
                                            )}
                                            {selectedProductFromSearch.category_name && (
                                                <span
                                                    style={{
                                                        marginLeft: "10px",
                                                        color: "#6c757d",
                                                    }}
                                                >
                                                    Categoría:{" "}
                                                    {
                                                        selectedProductFromSearch.category_name
                                                    }
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    // Vista normal para búsqueda/edición
                                    <div
                                        style={{ position: "relative" }}
                                    >
                                        <ProductSearchSelector
                                            onProductSelected={handleProductSelected}
                                            onSelectionCleared={handleProductSelectionCleared}
                                            placeholder="Ej: jeringa, guante, algodón..."
                                            maxResults={50}
                                            showSelectedProduct={false}
                                            allowClearSelection={false}
                                            initialProduct={selectedProductFromSearch}
                                            inputId="product"
                                        />
                                            </div>
                                        )}
                            </div>

                            {/* Ubicación */}
                            <div style={{ marginBottom: "15px" }}>
                                <label
                                    htmlFor="location"
                                    style={{
                                        display: "block",
                                        marginBottom: "5px",
                                        fontWeight: "500",
                                        color: "#495057",
                                    }}
                                >
                                    Ubicación *
                                </label>
                                <select
                                    id="location"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleInputChange}
                                    disabled={isLoadingLocations}
                                    style={{
                                        width: "100%",
                                        padding: "10px",
                                        borderRadius: "4px",
                                        border: "1px solid #ced4da",
                                        fontSize: "16px",
                                        backgroundColor: isLoadingLocations
                                            ? "#f8f9fa"
                                            : "#fff",
                                    }}
                                    required
                                >
                                    <option value="">
                                        {isLoadingLocations
                                            ? "Cargando ubicaciones..."
                                            : "Seleccionar ubicación"}
                                    </option>
                                    {locations.map((location) => (
                                        <option
                                            key={location.id || location.name}
                                            value={location.id || location.name}
                                        >
                                            {location.name || location}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Tipo de Movimiento */}
                            <div style={{ marginBottom: "15px" }}>
                                <label
                                    style={{
                                        display: "block",
                                        marginBottom: "5px",
                                        fontWeight: "500",
                                        color: "#495057",
                                    }}
                                >
                                    Tipo de Movimiento *
                                </label>
                                <div
                                    style={{
                                        display: "flex",
                                        gap: "15px",
                                        flexWrap: "wrap",
                                    }}
                                >
                                    <label
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            padding: "10px 15px",
                                            border: "1px solid #ced4da",
                                            borderRadius: "4px",
                                            backgroundColor:
                                                formData.movementType === "in"
                                                    ? "#e8f4fe"
                                                    : "transparent",
                                            cursor: "pointer",
                                        }}
                                    >
                                        <input
                                            type="radio"
                                            name="movementType"
                                            value="in"
                                            checked={
                                                formData.movementType === "in"
                                            }
                                            onChange={handleInputChange}
                                            style={{ marginRight: "8px" }}
                                        />
                                        Entrada
                                    </label>
                                    <label
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            padding: "10px 15px",
                                            border: "1px solid #ced4da",
                                            borderRadius: "4px",
                                            backgroundColor:
                                                formData.movementType === "out"
                                                    ? "#fef3e8"
                                                    : "transparent",
                                            cursor: "pointer",
                                        }}
                                    >
                                        <input
                                            type="radio"
                                            name="movementType"
                                            value="out"
                                            checked={
                                                formData.movementType === "out"
                                            }
                                            onChange={handleInputChange}
                                            style={{ marginRight: "8px" }}
                                        />
                                        Salida
                                    </label>
                                    <label
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            padding: "10px 15px",
                                            border: "1px solid #ced4da",
                                            borderRadius: "4px",
                                            backgroundColor:
                                                formData.movementType ===
                                                "adjustment"
                                                    ? "#f0f8ff"
                                                    : "transparent",
                                            cursor: "pointer",
                                        }}
                                    >
                                        <input
                                            type="radio"
                                            name="movementType"
                                            value="adjustment"
                                            checked={
                                                formData.movementType ===
                                                "adjustment"
                                            }
                                            onChange={handleInputChange}
                                            style={{ marginRight: "8px" }}
                                        />
                                        Ajuste
                                    </label>
                                </div>
                            </div>

                            {/* Fila con Cantidad y Fecha de Vencimiento */}
                            <div
                                style={{
                                    display: "flex",
                                    gap: "15px",
                                    marginBottom: "15px",
                                }}
                            >
                                {/* Cantidad */}
                                <div style={{ flex: "1" }}>
                                    <label
                                        htmlFor="quantity"
                                        style={{
                                            display: "block",
                                            marginBottom: "5px",
                                            fontWeight: "500",
                                            color: "#495057",
                                        }}
                                    >
                                        Cantidad *
                                    </label>
                                    <input
                                        type="number"
                                        id="quantity"
                                        name="quantity"
                                        value={formData.quantity}
                                        onChange={handleInputChange}
                                        min="1"
                                        style={{
                                            width: "100%",
                                            padding: "10px",
                                            borderRadius: "4px",
                                            border: "1px solid #ced4da",
                                            fontSize: "16px",
                                        }}
                                        placeholder="Ingrese la cantidad"
                                        required
                                    />
                                </div>

                                {/* Fecha de Vencimiento */}
                                <div style={{ flex: "1" }}>
                                    <label
                                        htmlFor="expiryDate"
                                        style={{
                                            display: "block",
                                            marginBottom: "5px",
                                            fontWeight: "500",
                                            color: "#495057",
                                        }}
                                    >
                                        Fecha de Vencimiento *
                                    </label>
                                    <input
                                        type="date"
                                        id="expiryDate"
                                        name="expiryDate"
                                        value={formData.expiryDate}
                                        onChange={handleInputChange}
                                        style={{
                                            width: "100%",
                                            padding: "10px",
                                            borderRadius: "4px",
                                            border: "1px solid #ced4da",
                                            fontSize: "16px",
                                        }}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Notas/Motivo */}
                            <div style={{ marginBottom: "20px" }}>
                                <label
                                    htmlFor="notes"
                                    style={{
                                        display: "block",
                                        marginBottom: "5px",
                                        fontWeight: "500",
                                        color: "#495057",
                                    }}
                                >
                                    Notas/Motivo (opcional)
                                </label>
                                <textarea
                                    id="notes"
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleInputChange}
                                    rows="3"
                                    style={{
                                        width: "100%",
                                        padding: "10px",
                                        borderRadius: "4px",
                                        border: "1px solid #ced4da",
                                        fontSize: "16px",
                                        resize: "vertical",
                                    }}
                                    placeholder="Ingrese notas o motivo del movimiento"
                                ></textarea>
                            </div>

                            {/* Botón de envío */}
                            <div style={{ textAlign: "center" }}>
                                <button
                                    type="submit"
                                    style={{
                                        backgroundColor: "#2c3e50",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "4px",
                                        padding: "12px 40px",
                                        fontSize: "16px",
                                        cursor: "pointer",
                                        fontWeight: "500",
                                        minWidth: "200px",
                                    }}
                                >
                                    Registrar Movimiento
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Historial de Movimientos */}
                <div style={{ width: "100%" }}>
                    <div
                        style={{
                            backgroundColor: "#fff",
                            borderRadius: "8px",
                            padding: "20px",
                            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                        }}
                    >
                        <h2
                            style={{
                                fontSize: "20px",
                                margin: "0 0 20px 0",
                                color: "#2c3e50",
                            }}
                        >
                            Historial de Movimientos
                            {!isLoadingMovements && movementsTotalCount > 0 && (
                                <span
                                    style={{
                                        color: "#6c757d",
                                        fontSize: "16px",
                                        fontWeight: "normal",
                                        marginLeft: "10px",
                                    }}
                                >
                                    ({movementsTotalCount} movimiento
                                    {movementsTotalCount !== 1 ? "s" : ""})
                                </span>
                            )}
                        </h2>

                        {/* Sección de Filtros */}
                        <div
                            style={{
                                backgroundColor: "#f8f9fa",
                                borderRadius: "6px",
                                padding: "15px",
                                marginBottom: "20px",
                                border: "1px solid #e9ecef",
                            }}
                        >
                            <h3
                                style={{
                                    fontSize: "16px",
                                    margin: "0 0 15px 0",
                                    color: "#495057",
                                }}
                            >
                                Filtros de Búsqueda
                            </h3>

                            <div
                                style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: "15px",
                                    marginBottom: "15px",
                                }}
                            >
                                {/* Filtro de Rango de Fechas */}
                                <div style={{ flex: "1", minWidth: "220px" }}>
                                    <label
                                        htmlFor="dateFrom"
                                        style={{
                                            display: "block",
                                            marginBottom: "5px",
                                            fontWeight: "500",
                                            fontSize: "14px",
                                            color: "#495057",
                                        }}
                                    >
                                        Desde:
                                    </label>
                                    <input
                                        type="date"
                                        id="dateFrom"
                                        name="dateFrom"
                                        value={filters.dateFrom}
                                        onChange={handleFilterChange}
                                        style={{
                                            width: "100%",
                                            padding: "8px",
                                            borderRadius: "4px",
                                            border: "1px solid #ced4da",
                                            fontSize: "14px",
                                        }}
                                    />
                                </div>

                                <div style={{ flex: "1", minWidth: "220px" }}>
                                    <label
                                        htmlFor="dateTo"
                                        style={{
                                            display: "block",
                                            marginBottom: "5px",
                                            fontWeight: "500",
                                            fontSize: "14px",
                                            color: "#495057",
                                        }}
                                    >
                                        Hasta:
                                    </label>
                                    <input
                                        type="date"
                                        id="dateTo"
                                        name="dateTo"
                                        value={filters.dateTo}
                                        onChange={handleFilterChange}
                                        style={{
                                            width: "100%",
                                            padding: "8px",
                                            borderRadius: "4px",
                                            border: "1px solid #ced4da",
                                            fontSize: "14px",
                                        }}
                                    />
                                </div>
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: "15px",
                                    marginBottom: "15px",
                                }}
                            >
                                {/* Filtro de Ubicación */}
                                <div style={{ flex: "1", minWidth: "220px" }}>
                                    <label
                                        htmlFor="locationFilter"
                                        style={{
                                            display: "block",
                                            marginBottom: "5px",
                                            fontWeight: "500",
                                            fontSize: "14px",
                                            color: "#495057",
                                        }}
                                    >
                                        Ubicación:
                                    </label>
                                    <select
                                        id="locationFilter"
                                        name="locationFilter"
                                        value={filters.locationFilter}
                                        onChange={handleFilterChange}
                                        disabled={isLoadingLocations}
                                        style={{
                                            width: "100%",
                                            padding: "8px",
                                            borderRadius: "4px",
                                            border: "1px solid #ced4da",
                                            fontSize: "14px",
                                            backgroundColor: isLoadingLocations
                                                ? "#f8f9fa"
                                                : "#fff",
                                        }}
                                    >
                                        <option value="">
                                            {isLoadingLocations
                                                ? "Cargando ubicaciones..."
                                                : "Todas las ubicaciones"}
                                        </option>
                                        {locations.map((location) => (
                                            <option
                                                key={
                                                    location.id || location.name
                                                }
                                                value={
                                                    location.id || location.name
                                                }
                                            >
                                                {location.name || location}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: "15px",
                                    marginBottom: "15px",
                                }}
                            >
                                {/* Filtro de Tipo de Movimiento */}
                                <div style={{ flex: "1", minWidth: "220px" }}>
                                    <label
                                        htmlFor="movementTypeFilter"
                                        style={{
                                            display: "block",
                                            marginBottom: "5px",
                                            fontWeight: "500",
                                            fontSize: "14px",
                                            color: "#495057",
                                        }}
                                    >
                                        Tipo de Movimiento:
                                    </label>
                                    <select
                                        id="movementTypeFilter"
                                        name="movementTypeFilter"
                                        value={filters.movementTypeFilter}
                                        onChange={handleFilterChange}
                                        style={{
                                            width: "100%",
                                            padding: "8px",
                                            borderRadius: "4px",
                                            border: "1px solid #ced4da",
                                            fontSize: "14px",
                                        }}
                                    >
                                        <option value="">
                                            Todos los tipos
                                        </option>
                                        {movementTypes.map((type, index) => (
                                            <option
                                                key={index}
                                                value={type.value}
                                            >
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Barra de búsqueda general */}
                            <div style={{ marginBottom: "20px" }}>
                                <label
                                    htmlFor="searchQuery"
                                    style={{
                                        display: "block",
                                        marginBottom: "5px",
                                        fontWeight: "500",
                                        fontSize: "14px",
                                        color: "#495057",
                                    }}
                                >
                                    Búsqueda general:
                                </label>
                                <input
                                    type="text"
                                    id="searchQuery"
                                    name="searchQuery"
                                    value={filters.searchQuery}
                                    onChange={handleFilterChange}
                                    style={{
                                        width: "100%",
                                        padding: "8px",
                                        borderRadius: "4px",
                                        border: "1px solid #ced4da",
                                        fontSize: "14px",
                                    }}
                                    placeholder="Buscar por SKU, nombre de producto, notas..."
                                />
                            </div>

                            {/* Botones de acción para filtros */}
                            <div
                                style={{
                                    display: "flex",
                                    gap: "10px",
                                    justifyContent: "flex-end",
                                }}
                            >
                                <button
                                    onClick={clearFilters}
                                    style={{
                                        backgroundColor: "#f8f9fa",
                                        color: "#6c757d",
                                        border: "1px solid #ced4da",
                                        borderRadius: "4px",
                                        padding: "8px 16px",
                                        fontSize: "14px",
                                        cursor: "pointer",
                                        fontWeight: "500",
                                    }}
                                >
                                    Limpiar Filtros
                                </button>
                                <button
                                    onClick={applyFilters}
                                    style={{
                                        backgroundColor: "#2c3e50",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "4px",
                                        padding: "8px 16px",
                                        fontSize: "14px",
                                        cursor: "pointer",
                                        fontWeight: "500",
                                    }}
                                >
                                    Aplicar Filtros
                                </button>
                            </div>
                        </div>

                        <div style={{ overflowX: "auto" }}>
                            {/* Mensaje de error si existe */}
                            {movementsError && (
                                <div
                                    style={{
                                        padding: "10px 15px",
                                        marginBottom: "15px",
                                        borderRadius: "4px",
                                        backgroundColor: "#f8d7da",
                                        color: "#721c24",
                                        border: "1px solid #f5c6cb",
                                    }}
                                >
                                    {movementsError}
                                </div>
                            )}

                            {/* Indicador de carga */}
                            {isLoadingMovements && (
                                <div
                                    style={{
                                        textAlign: "center",
                                        padding: "40px 20px",
                                        backgroundColor: "#f8f9fa",
                                        borderRadius: "8px",
                                        border: "1px solid #dee2e6",
                                        marginBottom: "20px",
                                    }}
                                >
                                    <p
                                        style={{
                                            color: "#6c757d",
                                            fontSize: "16px",
                                            margin: 0,
                                        }}
                                    >
                                        Cargando movimientos de inventario...
                                    </p>
                                </div>
                            )}

                            <table
                                style={{
                                    width: "100%",
                                    borderCollapse: "collapse",
                                    minWidth: "900px",
                                }}
                            >
                                <thead>
                                    <tr
                                        style={{
                                            backgroundColor: "#2c3e50",
                                            color: "white",
                                        }}
                                    >
                                        <th
                                            style={{
                                                padding: "12px 8px",
                                                textAlign: "left",
                                                border: "1px solid #34495e",
                                            }}
                                        >
                                            Fecha y Hora
                                        </th>
                                        <th
                                            style={{
                                                padding: "12px 8px",
                                                textAlign: "left",
                                                border: "1px solid #34495e",
                                            }}
                                        >
                                            Producto
                                        </th>
                                        <th
                                            style={{
                                                padding: "12px 8px",
                                                textAlign: "left",
                                                border: "1px solid #34495e",
                                            }}
                                        >
                                            SKU
                                        </th>
                                        <th
                                            style={{
                                                padding: "12px 8px",
                                                textAlign: "left",
                                                border: "1px solid #34495e",
                                            }}
                                        >
                                            Ubicación
                                        </th>
                                        <th
                                            style={{
                                                padding: "12px 8px",
                                                textAlign: "center",
                                                border: "1px solid #34495e",
                                            }}
                                        >
                                            Tipo
                                        </th>
                                        <th
                                            style={{
                                                padding: "12px 8px",
                                                textAlign: "center",
                                                border: "1px solid #34495e",
                                            }}
                                        >
                                            Cantidad
                                        </th>
                                        <th
                                            style={{
                                                padding: "12px 8px",
                                                textAlign: "left",
                                                border: "1px solid #34495e",
                                            }}
                                        >
                                            Usuario
                                        </th>
                                        <th
                                            style={{
                                                padding: "12px 8px",
                                                textAlign: "left",
                                                border: "1px solid #34495e",
                                            }}
                                        >
                                            F. Vencimiento
                                        </th>
                                        <th
                                            style={{
                                                padding: "12px 8px",
                                                textAlign: "left",
                                                border: "1px solid #34495e",
                                            }}
                                        >
                                            Notas
                                        </th>
                                        <th
                                            style={{
                                                padding: "12px 8px",
                                                textAlign: "left",
                                                border: "1px solid #34495e",
                                            }}
                                        >
                                            Referencia
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {!isLoadingMovements &&
                                        realMovements.map((movement) => (
                                            <tr key={movement.id}>
                                                <td
                                                    style={{
                                                        padding: "10px 8px",
                                                        borderBottom:
                                                            "1px solid #dee2e6",
                                                    }}
                                                >
                                                    {new Date(
                                                        movement.created_at ||
                                                            movement.date
                                                    ).toLocaleString("es")}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "10px 8px",
                                                        borderBottom:
                                                            "1px solid #dee2e6",
                                                    }}
                                                >
                                                    {movement.product_name ||
                                                        movement.product}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "10px 8px",
                                                        borderBottom:
                                                            "1px solid #dee2e6",
                                                    }}
                                                >
                                                    {movement.product_sku ||
                                                        movement.sku ||
                                                        "-"}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "10px 8px",
                                                        borderBottom:
                                                            "1px solid #dee2e6",
                                                    }}
                                                >
                                                    {movement.location_name ||
                                                        movement.location ||
                                                        "-"}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "10px 8px",
                                                        borderBottom:
                                                            "1px solid #dee2e6",
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            display:
                                                                "inline-block",
                                                            padding: "4px 8px",
                                                            borderRadius: "4px",
                                                            backgroundColor:
                                                                movement.movement_type ===
                                                                    "IN" ||
                                                                movement.movementType ===
                                                                    "in"
                                                                    ? "#e8f4fe"
                                                                    : "#fef3e8",
                                                            color:
                                                                movement.movement_type ===
                                                                    "IN" ||
                                                                movement.movementType ===
                                                                    "in"
                                                                    ? "#0077c2"
                                                                    : "#e67e22",
                                                            fontSize: "14px",
                                                        }}
                                                    >
                                                        {movement.movement_type ===
                                                            "IN" ||
                                                        movement.movementType ===
                                                            "in"
                                                            ? "Entrada"
                                                            : "Salida"}
                                                    </span>
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "10px 8px",
                                                        borderBottom:
                                                            "1px solid #dee2e6",
                                                        textAlign: "center",
                                                        fontWeight: "600",
                                                    }}
                                                >
                                                    {movement.quantity}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "10px 8px",
                                                        borderBottom:
                                                            "1px solid #dee2e6",
                                                    }}
                                                >
                                                    {movement.user_name ||
                                                        movement.user ||
                                                        "-"}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "10px 8px",
                                                        borderBottom:
                                                            "1px solid #dee2e6",
                                                    }}
                                                >
                                                    {movement.expiry_date ||
                                                        movement.expiryDate ||
                                                        "-"}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "10px 8px",
                                                        borderBottom:
                                                            "1px solid #dee2e6",
                                                    }}
                                                >
                                                    {movement.notes || "-"}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "10px 8px",
                                                        borderBottom:
                                                            "1px solid #dee2e6",
                                                    }}
                                                >
                                                    {movement.reference || "-"}
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>

                            {!isLoadingMovements &&
                                realMovements.length === 0 &&
                                !movementsError && (
                                    <div
                                        style={{
                                            textAlign: "center",
                                            padding: "40px 20px",
                                            backgroundColor: "#f8f9fa",
                                            borderRadius: "8px",
                                            border: "1px solid #dee2e6",
                                        }}
                                    >
                                        <p
                                            style={{
                                                color: "#6c757d",
                                                fontSize: "16px",
                                                margin: 0,
                                            }}
                                        >
                                            No hay movimientos de stock
                                            registrados.
                                        </p>
                                    </div>
                                )}

                            {/* Paginación de movimientos reales */}
                            {!isLoadingMovements &&
                                realMovements.length > 0 &&
                                movementsTotalPages > 0 && (
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            marginTop: "20px",
                                            padding: "10px 0",
                                        }}
                                    >
                                        <div
                                            style={{
                                                color: "#6c757d",
                                                fontSize: "14px",
                                            }}
                                        >
                                            Mostrando{" "}
                                            {Math.min(
                                                25 *
                                                    (movementsCurrentPage - 1) +
                                                    1,
                                                movementsTotalCount
                                            )}
                                            -
                                            {Math.min(
                                                25 * movementsCurrentPage,
                                                movementsTotalCount
                                            )}{" "}
                                            de {movementsTotalCount} movimientos
                                            {movementsTotalPages > 1 && (
                                                <span>
                                                    {" "}
                                                    - Página{" "}
                                                    {
                                                        movementsCurrentPage
                                                    } de {movementsTotalPages}
                                                </span>
                                            )}
                                        </div>
                                        <div
                                            style={{
                                                display: "flex",
                                                gap: "5px",
                                            }}
                                        >
                                            <button
                                                onClick={goToPrevMovementsPage}
                                                disabled={
                                                    movementsCurrentPage <= 1
                                                }
                                                style={{
                                                    padding: "6px 12px",
                                                    border: "1px solid #ced4da",
                                                    backgroundColor:
                                                        movementsCurrentPage > 1
                                                            ? "#fff"
                                                            : "#f8f9fa",
                                                    borderRadius: "4px",
                                                    color:
                                                        movementsCurrentPage > 1
                                                            ? "#2c3e50"
                                                            : "#6c757d",
                                                    cursor:
                                                        movementsCurrentPage > 1
                                                            ? "pointer"
                                                            : "not-allowed",
                                                    fontSize: "14px",
                                                }}
                                            >
                                                Anterior
                                            </button>

                                            {/* Mostrar páginas */}
                                            {Array.from(
                                                {
                                                    length: Math.min(
                                                        5,
                                                        movementsTotalPages
                                                    ),
                                                },
                                                (_, i) => {
                                                    const pageNum =
                                                        Math.max(
                                                            1,
                                                            movementsCurrentPage -
                                                                2
                                                        ) + i;
                                                    if (
                                                        pageNum >
                                                        movementsTotalPages
                                                    )
                                                        return null;

                                                    return (
                                                        <button
                                                            key={pageNum}
                                                            onClick={() =>
                                                                goToMovementsPage(
                                                                    pageNum
                                                                )
                                                            }
                                                            style={{
                                                                padding:
                                                                    "6px 12px",
                                                                border: `1px solid ${
                                                                    pageNum ===
                                                                    movementsCurrentPage
                                                                        ? "#2c3e50"
                                                                        : "#ced4da"
                                                                }`,
                                                                backgroundColor:
                                                                    pageNum ===
                                                                    movementsCurrentPage
                                                                        ? "#2c3e50"
                                                                        : "#fff",
                                                                borderRadius:
                                                                    "4px",
                                                                color:
                                                                    pageNum ===
                                                                    movementsCurrentPage
                                                                        ? "#fff"
                                                                        : "#2c3e50",
                                                                cursor: "pointer",
                                                                fontSize:
                                                                    "14px",
                                                            }}
                                                        >
                                                            {pageNum}
                                                        </button>
                                                    );
                                                }
                                            )}

                                            <button
                                                onClick={goToNextMovementsPage}
                                                disabled={
                                                    movementsCurrentPage >=
                                                    movementsTotalPages
                                                }
                                                style={{
                                                    padding: "6px 12px",
                                                    border: "1px solid #ced4da",
                                                    backgroundColor:
                                                        movementsCurrentPage <
                                                        movementsTotalPages
                                                            ? "#fff"
                                                            : "#f8f9fa",
                                                    borderRadius: "4px",
                                                    color:
                                                        movementsCurrentPage <
                                                        movementsTotalPages
                                                            ? "#2c3e50"
                                                            : "#6c757d",
                                                    cursor:
                                                        movementsCurrentPage <
                                                        movementsTotalPages
                                                            ? "pointer"
                                                            : "not-allowed",
                                                    fontSize: "14px",
                                                }}
                                            >
                                                Siguiente
                                            </button>
                                        </div>
                                    </div>
                                )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MovimientosDeStockPage;
