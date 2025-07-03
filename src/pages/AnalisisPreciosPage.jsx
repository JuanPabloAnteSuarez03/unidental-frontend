import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import {
    getSupplierPurchaseOptions,
    getAllSuppliers,
} from "../services/suppliersService";
import { getCategories } from "../services/inventoryService";
import CategoryFilter from "../components/SearchFilters/CategoryFilter";

function getPageFromUrl(url) {
    if (!url) return null;
    const match = url.match(/[?&]page=(\d+)/);
    return match ? parseInt(match[1], 10) : 1;
}

const AnalisisPreciosPage = () => {
    const { authToken } = useAuth();
    const [data, setData] = useState([]);
    const [raw, setRaw] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [nextUrl, setNextUrl] = useState(null);
    const [prevUrl, setPrevUrl] = useState(null);
    const [currentUrl, setCurrentUrl] = useState(null);
    const [count, setCount] = useState(0);
    const [pageSize, setPageSize] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const debounceRef = useRef();
    const [viewMode, setViewMode] = useState("tabla"); // 'tabla' o 'otros'

    // Estados para la sección "otros campos"
    const [suppliers, setSuppliers] = useState([]);
    const [leftSupplier, setLeftSupplier] = useState("");
    const [rightSupplier, setRightSupplier] = useState("");
    const [leftTableData, setLeftTableData] = useState([]);
    const [rightTableData, setRightTableData] = useState([]);
    const [leftLoading, setLeftLoading] = useState(false);
    const [rightLoading, setRightLoading] = useState(false);

    // Estados para búsqueda global
    const [globalSearchTerm, setGlobalSearchTerm] = useState("");
    const [globalSearchInput, setGlobalSearchInput] = useState("");
    const globalSearchDebounceRef = useRef();

    // Estado para categorías y filtro de categoría
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState([]);
    const [categoriesLoading, setCategoriesLoading] = useState(false);

    // Estado para los filtros de precio
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");

    const BASE_URL =
        "https://unidental-backend.onrender.com/api/suppliers/purchase-options/";

    const fetchData = async (
        url = null,
        page = 1,
        searchTerm = "",
        categoryFilter = []
    ) => {
        setLoading(true);
        setError(null);
        try {
            let result;
            let finalUrl = url;
            if (!finalUrl) {
                let params = [];
                if (searchTerm)
                    params.push(`search=${encodeURIComponent(searchTerm)}`);
                if (categoryFilter && categoryFilter.length > 0)
                    params.push(`category=${categoryFilter[0]}`);
                if (page > 1) params.push(`page=${page}`);
                finalUrl =
                    BASE_URL + (params.length ? "?" + params.join("&") : "");
            }
            const response = await fetch(finalUrl, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Token ${authToken}`,
                },
            });
            if (!response.ok) throw new Error("Error al obtener los datos");
            result = await response.json();
            setRaw(result);
            if (Array.isArray(result)) {
                setData(result);
                setNextUrl(null);
                setPrevUrl(null);
                setCount(result.length);
                setPageSize(result.length);
                setCurrentPage(1);
                setTotalPages(1);
            } else if (result && Array.isArray(result.results)) {
                setData(result.results);
                setNextUrl(result.next);
                setPrevUrl(result.previous);
                setCount(result.count || 0);
                setPageSize(result.results.length);
                let pageNum = page;
                if (result.next) {
                    const nextPage = getPageFromUrl(result.next);
                    if (nextPage) pageNum = nextPage - 1;
                } else if (result.previous) {
                    const prevPage = getPageFromUrl(result.previous);
                    if (prevPage) pageNum = prevPage + 1;
                } else {
                    pageNum = 1;
                }
                setCurrentPage(pageNum);
                setTotalPages(
                    result.count && result.results.length
                        ? Math.ceil(result.count / result.results.length)
                        : 1
                );
            } else {
                setData([]);
                setNextUrl(null);
                setPrevUrl(null);
                setCount(0);
                setPageSize(0);
                setCurrentPage(1);
                setTotalPages(1);
            }
        } catch (err) {
            setError("Error al obtener los datos de análisis de precios");
        } finally {
            setLoading(false);
        }
    };

    // Debounce para búsqueda en tiempo real
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setSearch(searchInput);
        }, 500);
        return () => clearTimeout(debounceRef.current);
    }, [searchInput]);

    // Buscar cada vez que cambia el término de búsqueda
    useEffect(() => {
        if (authToken && viewMode === "tabla") fetchData(null, 1, search);
        // eslint-disable-next-line
    }, [authToken, search, viewMode]);

    // Cargar proveedores cuando se cambia a la vista "otros"
    useEffect(() => {
        if (viewMode === "otros" && authToken) {
            loadSuppliers();
            setCategoriesLoading(true);
            getCategories(authToken)
                .then((cats) => setCategories(cats))
                .catch(() => setCategories([]))
                .finally(() => setCategoriesLoading(false));
        }
    }, [viewMode, authToken]);

    // Cargar datos del proveedor izquierdo cuando cambia
    useEffect(() => {
        if (leftSupplier && authToken) {
            loadSupplierData(leftSupplier, "left");
        }
    }, [leftSupplier, authToken]);

    // Cargar datos del proveedor derecho cuando cambia
    useEffect(() => {
        if (rightSupplier && authToken) {
            loadSupplierData(rightSupplier, "right");
        }
    }, [rightSupplier, authToken]);

    // Debounce para búsqueda global
    useEffect(() => {
        if (globalSearchDebounceRef.current)
            clearTimeout(globalSearchDebounceRef.current);
        globalSearchDebounceRef.current = setTimeout(() => {
            setGlobalSearchTerm(globalSearchInput);
        }, 500);
        return () => clearTimeout(globalSearchDebounceRef.current);
    }, [globalSearchInput]);

    // Buscar en ambas tablas cuando cambia el término de búsqueda global
    useEffect(() => {
        if (authToken && viewMode === "otros") {
            if (globalSearchTerm) {
                loadGlobalSearchData();
            } else {
                // Si no hay término de búsqueda, volver a cargar datos de proveedores específicos
                if (leftSupplier) {
                    loadSupplierData(leftSupplier, "left");
                }
                if (rightSupplier) {
                    loadSupplierData(rightSupplier, "right");
                }
            }
        }
    }, [globalSearchTerm, authToken, viewMode]);

    // Limpiar búsqueda y filtros al cambiar a 'otros'
    useEffect(() => {
        if (viewMode === "otros") {
            setSearchInput("");
            setSearch("");
            setData([]);
            setRaw(null);
            setCount(0);
            setPageSize(0);
            setCurrentPage(1);
            setTotalPages(1);
            setLoading(false);
            setError(null);

            // Limpiar búsqueda global
            setGlobalSearchInput("");
            setGlobalSearchTerm("");
            // No limpiar las tablas aquí, se manejarán en el efecto de búsqueda global
            setSelectedCategory([]);
        }
    }, [viewMode]);

    // Función para cargar proveedores
    const loadSuppliers = async () => {
        try {
            const suppliersData = await getAllSuppliers(authToken);
            setSuppliers(suppliersData);
        } catch (err) {
            console.error("Error loading suppliers:", err);
        }
    };

    // Función para cargar datos de búsqueda global
    const loadGlobalSearchData = async () => {
        if (!globalSearchTerm.trim() && selectedCategory.length === 0) return;
        setLeftLoading(true);
        setRightLoading(true);
        try {
            // Buscar en todos los proveedores con el término de búsqueda y categoría
            let url = `${BASE_URL}?`;
            const params = [];
            if (globalSearchTerm.trim())
                params.push(`search=${encodeURIComponent(globalSearchTerm)}`);
            if (selectedCategory.length > 0)
                params.push(`category=${selectedCategory[0]}`);
            url += params.join("&");
            const response = await fetch(url, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Token ${authToken}`,
                },
            });
            if (!response.ok) throw new Error("Error al buscar datos");
            const result = await response.json();
            const data = Array.isArray(result) ? result : result.results || [];
            // Filtrar datos por proveedor si están seleccionados
            const leftData = leftSupplier
                ? data.filter(
                      (item) =>
                          item.supplier_id === parseInt(leftSupplier) ||
                          item.supplier === parseInt(leftSupplier) ||
                          item.supplier_name ===
                              suppliers.find(
                                  (s) => s.id === parseInt(leftSupplier)
                              )?.name
                  )
                : data;
            const rightData = rightSupplier
                ? data.filter(
                      (item) =>
                          item.supplier_id === parseInt(rightSupplier) ||
                          item.supplier === parseInt(rightSupplier) ||
                          item.supplier_name ===
                              suppliers.find(
                                  (s) => s.id === parseInt(rightSupplier)
                              )?.name
                  )
                : data;
            // Ordenar los datos por precio de compra
            const sortedLeftData = sortByPurchasePrice(leftData);
            const sortedRightData = sortByPurchasePrice(rightData);
            setLeftTableData(sortedLeftData);
            setRightTableData(sortedRightData);
        } catch (err) {
            console.error("Error loading global search data:", err);
            setLeftTableData([]);
            setRightTableData([]);
        } finally {
            setLeftLoading(false);
            setRightLoading(false);
        }
    };

    // Función para cargar datos de un proveedor específico
    const loadSupplierData = async (supplierId, side) => {
        if (!supplierId) return;
        const setLoadingState =
            side === "left" ? setLeftLoading : setRightLoading;
        const setTableData =
            side === "left" ? setLeftTableData : setRightTableData;
        setLoadingState(true);
        try {
            let url = `${BASE_URL}?supplier=${supplierId}`;
            if (selectedCategory.length > 0) {
                url += `&category=${selectedCategory[0]}`;
            }
            const response = await fetch(url, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Token ${authToken}`,
                },
            });
            if (!response.ok)
                throw new Error("Error al obtener datos del proveedor");
            const result = await response.json();
            const data = Array.isArray(result) ? result : result.results || [];
            // Ordenar los datos por precio de compra
            const sortedData = sortByPurchasePrice(data);
            setTableData(sortedData);
        } catch (err) {
            console.error(`Error loading ${side} supplier data:`, err);
            setTableData([]);
        } finally {
            setLoadingState(false);
        }
    };

    // Función auxiliar para obtener el valor correcto de un campo
    const getFieldValue = (row, fieldName, alternatives = []) => {
        // Buscar el campo principal
        if (row[fieldName] !== undefined && row[fieldName] !== null) {
            return row[fieldName];
        }

        // Buscar en alternativas
        for (const alt of alternatives) {
            if (row[alt] !== undefined && row[alt] !== null) {
                return row[alt];
            }
        }

        return null;
    };

    // Función para ordenar datos por precio de compra (menor a mayor)
    const sortByPurchasePrice = (data) => {
        return [...data].sort((a, b) => {
            const priceA = getFieldValue(a, "purchase_price", [
                "price",
                "cost",
                "unit_price",
            ]);
            const priceB = getFieldValue(b, "purchase_price", [
                "price",
                "cost",
                "unit_price",
            ]);

            // Si ambos tienen precio, comparar
            if (priceA !== null && priceB !== null) {
                return parseFloat(priceA) - parseFloat(priceB);
            }

            // Si solo uno tiene precio, el que tiene precio va primero
            if (priceA !== null && priceB === null) return -1;
            if (priceA === null && priceB !== null) return 1;

            // Si ninguno tiene precio, mantener orden original
            return 0;
        });
    };

    const goToPage = (page) => {
        if (page < 1 || page > totalPages) return;
        fetchData(null, page, search);
    };

    // Lanzar useEffect para recargar datos cuando cambia el filtro de categoría
    useEffect(() => {
        if (viewMode === "otros" && authToken) {
            if (globalSearchTerm) {
                loadGlobalSearchData();
            } else {
                // Si no hay búsqueda global, recargar datos de proveedores
                if (leftSupplier) loadSupplierData(leftSupplier, "left");
                if (rightSupplier) loadSupplierData(rightSupplier, "right");
            }
        }
        if (viewMode === "tabla" && authToken) {
            // Forzar recarga de la tabla principal con el filtro de categoría
            fetchData(null, 1, search, selectedCategory);
        }
        // eslint-disable-next-line
    }, [selectedCategory]);

    // Cargar categorías cuando se entra a la vista 'tabla' o 'otros', si no están cargadas
    useEffect(() => {
        if (
            (viewMode === "tabla" || viewMode === "otros") &&
            authToken &&
            categories.length === 0 &&
            !categoriesLoading
        ) {
            setCategoriesLoading(true);
            getCategories(authToken)
                .then((cats) => setCategories(cats))
                .catch(() => setCategories([]))
                .finally(() => setCategoriesLoading(false));
        }
    }, [viewMode, authToken]);

    // Filtrado por precio en la tabla principal
    const filteredData = data.filter((row) => {
        const price = parseFloat(
            row.purchase_price || row.price || row.cost || row.unit_price || ""
        );
        if (minPrice && (isNaN(price) || price < parseFloat(minPrice)))
            return false;
        if (maxPrice && (isNaN(price) || price > parseFloat(maxPrice)))
            return false;
        return true;
    });

    return (
        <div style={{ padding: 24 }}>
            {/* Header */}
            <div
                style={{
                    background:
                        "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)",
                    borderRadius: "12px",
                    padding: "32px",
                    marginBottom: "24px",
                    boxShadow: "0 4px 16px rgba(44,62,80,0.15)",
                    border: "1px solid #2c3e50",
                    color: "white",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "24px",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "16px",
                        }}
                    >
                        <div
                            style={{
                                width: "56px",
                                height: "56px",
                                backgroundColor: "rgba(255,255,255,0.2)",
                                borderRadius: "12px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                backdropFilter: "blur(10px)",
                            }}
                        >
                            <svg
                                width="28"
                                height="28"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                style={{ color: "white" }}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </div>
                        <div>
                            <h1
                                style={{
                                    fontSize: "32px",
                                    fontWeight: "800",
                                    color: "white",
                                    margin: "0",
                                    letterSpacing: "-0.5px",
                                }}
                            >
                                Análisis de Precios
                            </h1>
                            <p
                                style={{
                                    color: "rgba(255,255,255,0.8)",
                                    margin: "8px 0 0 0",
                                    fontSize: "16px",
                                    fontWeight: "500",
                                }}
                            >
                                Compara precios entre proveedores y productos
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            {/* Selector de vista */}
            <div style={{ marginBottom: 24, display: "flex", gap: 12 }}>
                <button
                    onClick={() => setViewMode("tabla")}
                    style={{
                        padding: "10px 20px",
                        borderRadius: 6,
                        border: "1px solid #1976d2",
                        background:
                            viewMode === "tabla" ? "#1976d2" : "#f5f5f5",
                        color: viewMode === "tabla" ? "white" : "#1976d2",
                        fontWeight: "bold",
                        cursor: viewMode === "tabla" ? "default" : "pointer",
                        boxShadow:
                            viewMode === "tabla"
                                ? "0 2px 8px #1976d233"
                                : "none",
                    }}
                >
                    Ver tabla de precios
                </button>
                <button
                    onClick={() => setViewMode("otros")}
                    style={{
                        padding: "10px 20px",
                        borderRadius: 6,
                        border: "1px solid #1976d2",
                        background:
                            viewMode === "otros" ? "#1976d2" : "#f5f5f5",
                        color: viewMode === "otros" ? "white" : "#1976d2",
                        fontWeight: "bold",
                        cursor: viewMode === "otros" ? "default" : "pointer",
                        boxShadow:
                            viewMode === "otros"
                                ? "0 2px 8px #1976d233"
                                : "none",
                    }}
                >
                    Comparar Proveedores
                </button>
            </div>
            {/* Vista de tabla */}
            {viewMode === "tabla" && (
                <>
                    {/* Barra de búsqueda y filtros agrupados con estilo de tarjeta */}
                    <div
                        style={{
                            background: "#fff",
                            padding: 24,
                            borderRadius: 12,
                            boxShadow: "0 2px 8px rgba(25, 118, 210, 0.08)",
                            marginBottom: 32,
                            display: "flex",
                            flexDirection: "column",
                            gap: 20,
                            alignItems: "flex-start",
                        }}
                    >
                        {/* Campo de búsqueda */}
                        <div style={{ width: "100%", maxWidth: 600 }}>
                            <div
                                style={{ position: "relative", width: "100%" }}
                            >
                                <span
                                    style={{
                                        position: "absolute",
                                        left: 16,
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        color: "#1976d2",
                                        fontSize: 22,
                                        opacity: 0.7,
                                        pointerEvents: "none",
                                    }}
                                >
                                    🔍
                                </span>
                                <input
                                    type="text"
                                    placeholder="Buscar producto, proveedor, etc..."
                                    value={searchInput}
                                    onChange={(e) =>
                                        setSearchInput(e.target.value)
                                    }
                                    style={{
                                        width: "100%",
                                        padding: "14px 16px 14px 44px",
                                        borderRadius: 8,
                                        border: "1.5px solid #1976d2",
                                        background: "#f8fafc",
                                        fontSize: 16,
                                        color: "#22292f",
                                        outline: "none",
                                        boxShadow: searchInput
                                            ? "0 2px 8px #1976d233"
                                            : "none",
                                        transition:
                                            "border 0.2s, box-shadow 0.2s",
                                        fontWeight: 500,
                                    }}
                                />
                            </div>
                        </div>
                        {/* Filtro de categorías */}
                        <div style={{ width: "100%" }}>
                            <CategoryFilter
                                categories={categories}
                                selectedCategories={selectedCategory}
                                onChange={setSelectedCategory}
                                isLoading={categoriesLoading}
                            />
                        </div>
                        {/* Filtro de precio mínimo y máximo */}
                        <div
                            style={{
                                display: "flex",
                                gap: 32,
                                alignItems: "center",
                                width: "100%",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    width: 180,
                                }}
                            >
                                <label
                                    style={{
                                        fontWeight: 600,
                                        color: "#1976d2",
                                        marginBottom: 6,
                                        fontSize: 15,
                                    }}
                                >
                                    Precio mínimo
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    inputMode="decimal"
                                    pattern="[0-9]*"
                                    value={minPrice}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (/^\d*\.?\d*$/.test(val))
                                            setMinPrice(val);
                                    }}
                                    placeholder="Mínimo"
                                    style={{
                                        padding: "12px 14px",
                                        borderRadius: 8,
                                        border: "1.5px solid #1976d2",
                                        background: "#f8fafc",
                                        fontSize: 16,
                                        color: "#22292f",
                                        outline: "none",
                                        fontWeight: 500,
                                        width: "100%",
                                        marginRight: 12,
                                    }}
                                />
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    width: 180,
                                }}
                            >
                                <label
                                    style={{
                                        fontWeight: 600,
                                        color: "#1976d2",
                                        marginBottom: 6,
                                        fontSize: 15,
                                    }}
                                >
                                    Precio máximo
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    inputMode="decimal"
                                    pattern="[0-9]*"
                                    value={maxPrice}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (/^\d*\.?\d*$/.test(val))
                                            setMaxPrice(val);
                                    }}
                                    placeholder="Máximo"
                                    style={{
                                        padding: "12px 14px",
                                        borderRadius: 8,
                                        border: "1.5px solid #1976d2",
                                        background: "#f8fafc",
                                        fontSize: 16,
                                        color: "#22292f",
                                        outline: "none",
                                        fontWeight: 500,
                                        width: "100%",
                                        marginLeft: 12,
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                    <div style={{ overflowX: "auto" }}>
                        <div
                            style={{
                                background: "#fff",
                                borderRadius: 16,
                                boxShadow: "0 4px 18px 0 rgba(44,62,80,0.08)",
                                border: "1.5px solid #e3e6ea",
                                marginTop: 20,
                                marginBottom: 24,
                                overflowX: "auto",
                                transition: "box-shadow 0.2s",
                                minHeight: 180,
                            }}
                        >
                            <table
                                style={{
                                    width: "100%",
                                    borderCollapse: "separate",
                                    borderSpacing: 0,
                                    minWidth: 700,
                                    background: "#fff",
                                }}
                            >
                                <thead>
                                    <tr
                                        style={{
                                            background:
                                                "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)",
                                            color: "white",
                                            borderTopLeftRadius: 16,
                                            borderTopRightRadius: 16,
                                        }}
                                    >
                                        <th
                                            style={{
                                                padding: "18px 14px 18px 20px",
                                                textAlign: "left",
                                                fontWeight: 700,
                                                fontSize: 15,
                                                letterSpacing: "0.5px",
                                                textTransform: "uppercase",
                                                borderTopLeftRadius: 16,
                                                borderRight:
                                                    "2px solid #34495e",
                                                boxShadow: "2px 0 0 #34495e",
                                            }}
                                        >
                                            <span
                                                style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: 8,
                                                }}
                                            >
                                                <span style={{ fontSize: 18 }}>
                                                    📦
                                                </span>
                                                Producto
                                            </span>
                                        </th>
                                        <th
                                            style={{
                                                padding: "18px 14px",
                                                textAlign: "left",
                                                fontWeight: 700,
                                                fontSize: 15,
                                                letterSpacing: "0.5px",
                                                textTransform: "uppercase",
                                                borderRight:
                                                    "2px solid #34495e",
                                                boxShadow: "2px 0 0 #34495e",
                                            }}
                                        >
                                            <span
                                                style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: 8,
                                                }}
                                            >
                                                <span style={{ fontSize: 18 }}>
                                                    🏢
                                                </span>
                                                Proveedor
                                            </span>
                                        </th>

                                        <th
                                            style={{
                                                padding: "18px 14px",
                                                textAlign: "left",
                                                fontWeight: 700,
                                                fontSize: 15,
                                                letterSpacing: "0.5px",
                                                textTransform: "uppercase",
                                                borderRight:
                                                    "2px solid #34495e",
                                                boxShadow: "2px 0 0 #34495e",
                                            }}
                                        >
                                            <span
                                                style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: 8,
                                                }}
                                            >
                                                <span style={{ fontSize: 18 }}>
                                                    🗂️
                                                </span>
                                                Categoría
                                            </span>
                                        </th>
                                        <th
                                            style={{
                                                padding: "18px 20px 18px 14px",
                                                textAlign: "left",
                                                fontWeight: 700,
                                                fontSize: 15,
                                                letterSpacing: "0.5px",
                                                textTransform: "uppercase",
                                                borderTopRightRadius: 16,
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 6,
                                            }}
                                        >
                                            <span
                                                style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: 6,
                                                }}
                                            >
                                                <span style={{ fontSize: 18 }}>
                                                    💲
                                                </span>
                                                Precio de Compra
                                            </span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                style={{
                                                    padding: 48,
                                                    textAlign: "center",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: "inline-block",
                                                        margin: "0 auto",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            width: 36,
                                                            height: 36,
                                                            border: "4px solid #e3e6ea",
                                                            borderTop:
                                                                "4px solid #1976d2",
                                                            borderRadius: "50%",
                                                            animation:
                                                                "spin 1s linear infinite",
                                                            margin: "0 auto 16px",
                                                        }}
                                                    ></div>
                                                    <div
                                                        style={{
                                                            color: "#1976d2",
                                                            fontWeight: 600,
                                                            fontSize: 16,
                                                        }}
                                                    >
                                                        Cargando productos...
                                                    </div>
                                                    <style>{`@keyframes spin {0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}`}</style>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredData.length > 0 ? (
                                        filteredData.map((row, idx) => {
                                            const productName =
                                                row.product_name ||
                                                row.nombre ||
                                                row.name ||
                                                "N/A";
                                            const supplier =
                                                row.supplier_name ||
                                                row.supplier ||
                                                "N/A";

                                            const category =
                                                row.category ||
                                                row.categoria ||
                                                row.product_category ||
                                                row.category_name ||
                                                "N/A";
                                            const price =
                                                row.purchase_price ||
                                                row.price ||
                                                row.cost ||
                                                row.unit_price;
                                            return (
                                                <tr
                                                    key={idx}
                                                    style={{
                                                        backgroundColor:
                                                            idx % 2 === 0
                                                                ? "#fff"
                                                                : "#f6f8fa",
                                                        transition:
                                                            "background 0.18s",
                                                        cursor: "pointer",
                                                    }}
                                                    onMouseEnter={(e) =>
                                                        (e.currentTarget.style.background =
                                                            "#e3f2fd")
                                                    }
                                                    onMouseLeave={(e) =>
                                                        (e.currentTarget.style.background =
                                                            idx % 2 === 0
                                                                ? "#fff"
                                                                : "#f6f8fa")
                                                    }
                                                >
                                                    <td
                                                        style={{
                                                            padding:
                                                                "15px 14px 15px 20px",
                                                            borderBottom:
                                                                "1.5px solid #e3e6ea",
                                                            fontSize: 16,
                                                            fontWeight: 700,
                                                            color: "#2c3e50",
                                                            borderLeft:
                                                                idx === 0
                                                                    ? "none"
                                                                    : undefined,
                                                            letterSpacing: 0.2,
                                                        }}
                                                    >
                                                        {productName}
                                                    </td>
                                                    <td
                                                        style={{
                                                            padding:
                                                                "15px 14px",
                                                            borderBottom:
                                                                "1.5px solid #e3e6ea",
                                                            fontSize: 15,
                                                            fontWeight: 500,
                                                            color: "#495057",
                                                        }}
                                                    >
                                                        <span
                                                            style={{
                                                                background:
                                                                    "#e3f2fd",
                                                                color: "#1976d2",
                                                                borderRadius: 12,
                                                                padding:
                                                                    "3px 12px",
                                                                fontWeight: 600,
                                                                fontSize: 14,
                                                                letterSpacing: 0.2,
                                                            }}
                                                        >
                                                            {supplier}
                                                        </span>
                                                    </td>

                                                    <td
                                                        style={{
                                                            padding:
                                                                "15px 14px",
                                                            borderBottom:
                                                                "1.5px solid #e3e6ea",
                                                            fontSize: 15,
                                                            fontWeight: 500,
                                                            color: "#495057",
                                                        }}
                                                    >
                                                        <span
                                                            style={{
                                                                background:
                                                                    "#f3e8ff",
                                                                color: "#7c3aed",
                                                                borderRadius: 12,
                                                                padding:
                                                                    "3px 12px",
                                                                fontWeight: 600,
                                                                fontSize: 14,
                                                                letterSpacing: 0.2,
                                                            }}
                                                        >
                                                            {category}
                                                        </span>
                                                    </td>
                                                    <td
                                                        style={{
                                                            padding:
                                                                "15px 20px 15px 14px",
                                                            borderBottom:
                                                                "1.5px solid #e3e6ea",
                                                            fontSize: 18,
                                                            fontWeight: 800,
                                                            color: "#1976d2",
                                                            letterSpacing: 0.5,
                                                        }}
                                                    >
                                                        {price
                                                            ? `$${parseFloat(
                                                                  price
                                                              ).toFixed(2)}`
                                                            : "N/A"}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                style={{
                                                    textAlign: "center",
                                                    padding: "60px 40px",
                                                }}
                                            >
                                                <div
                                                    style={{ marginBottom: 16 }}
                                                >
                                                    <span
                                                        style={{
                                                            fontSize: 48,
                                                            opacity: 0.5,
                                                        }}
                                                    >
                                                        📋
                                                    </span>
                                                </div>
                                                <h3
                                                    style={{
                                                        color: "#6c757d",
                                                        fontSize: 18,
                                                        fontWeight: 600,
                                                        margin: "0 0 8px 0",
                                                    }}
                                                >
                                                    No hay datos para mostrar
                                                </h3>
                                                <p
                                                    style={{
                                                        color: "#6c757d",
                                                        fontSize: 14,
                                                        margin: 0,
                                                        opacity: 0.8,
                                                    }}
                                                >
                                                    No hay resultados para los
                                                    filtros actuales.
                                                </p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div
                            style={{
                                marginTop: 16,
                                display: "flex",
                                gap: 8,
                                alignItems: "center",
                                flexWrap: "wrap",
                            }}
                        >
                            <button
                                onClick={() => goToPage(1)}
                                disabled={currentPage === 1}
                                style={{
                                    padding: "8px 12px",
                                    borderRadius: 4,
                                    border: "1px solid #ccc",
                                    background:
                                        currentPage === 1 ? "#eee" : "#f5f5f5",
                                    cursor:
                                        currentPage === 1
                                            ? "not-allowed"
                                            : "pointer",
                                }}
                            >
                                « Primera
                            </button>
                            <button
                                onClick={() => goToPage(currentPage - 1)}
                                disabled={currentPage === 1}
                                style={{
                                    padding: "8px 12px",
                                    borderRadius: 4,
                                    border: "1px solid #ccc",
                                    background:
                                        currentPage === 1 ? "#eee" : "#f5f5f5",
                                    cursor:
                                        currentPage === 1
                                            ? "not-allowed"
                                            : "pointer",
                                }}
                            >
                                ‹ Anterior
                            </button>
                            {Array.from(
                                { length: totalPages },
                                (_, i) => i + 1
                            ).map((page) => {
                                if (
                                    page === 1 ||
                                    page === totalPages ||
                                    (page >= currentPage - 2 &&
                                        page <= currentPage + 2)
                                ) {
                                    return (
                                        <button
                                            key={page}
                                            onClick={() => goToPage(page)}
                                            disabled={page === currentPage}
                                            style={{
                                                padding: "8px 12px",
                                                borderRadius: 4,
                                                border: "1px solid #ccc",
                                                background:
                                                    page === currentPage
                                                        ? "#1976d2"
                                                        : "#f5f5f5",
                                                color:
                                                    page === currentPage
                                                        ? "white"
                                                        : "black",
                                                fontWeight:
                                                    page === currentPage
                                                        ? "bold"
                                                        : "normal",
                                                cursor:
                                                    page === currentPage
                                                        ? "default"
                                                        : "pointer",
                                                marginLeft: 2,
                                                marginRight: 2,
                                            }}
                                        >
                                            {page}
                                        </button>
                                    );
                                } else if (
                                    (page === currentPage - 3 && page > 1) ||
                                    (page === currentPage + 3 &&
                                        page < totalPages)
                                ) {
                                    return (
                                        <span
                                            key={page}
                                            style={{
                                                padding: "0 6px",
                                            }}
                                        >
                                            ...
                                        </span>
                                    );
                                }
                                return null;
                            })}
                            <button
                                onClick={() => goToPage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                style={{
                                    padding: "8px 12px",
                                    borderRadius: 4,
                                    border: "1px solid #ccc",
                                    background:
                                        currentPage === totalPages
                                            ? "#eee"
                                            : "#f5f5f5",
                                    cursor:
                                        currentPage === totalPages
                                            ? "not-allowed"
                                            : "pointer",
                                }}
                            >
                                Siguiente ›
                            </button>
                            <button
                                onClick={() => goToPage(totalPages)}
                                disabled={currentPage === totalPages}
                                style={{
                                    padding: "8px 12px",
                                    borderRadius: 4,
                                    border: "1px solid #ccc",
                                    background:
                                        currentPage === totalPages
                                            ? "#eee"
                                            : "#f5f5f5",
                                    cursor:
                                        currentPage === totalPages
                                            ? "not-allowed"
                                            : "pointer",
                                }}
                            >
                                Última »
                            </button>
                            <span
                                style={{
                                    marginLeft: 12,
                                    fontSize: 14,
                                }}
                            >
                                Página {currentPage} de {totalPages} ({count}{" "}
                                resultados)
                            </span>
                        </div>
                    </div>
                </>
            )}
            {/* Vista de otros campos */}
            {viewMode === "otros" && (
                <div style={{ marginBottom: 24 }}>
                    {/* Búsqueda global mejorada */}
                    <div
                        style={{
                            background: "#fff",
                            padding: 24,
                            borderRadius: 12,
                            boxShadow: "0 2px 8px rgba(25, 118, 210, 0.08)",
                            marginBottom: 24,
                            display: "flex",
                            flexDirection: "column",
                            gap: 16,
                            alignItems: "flex-start",
                        }}
                    >
                        <label
                            style={{
                                fontWeight: 700,
                                fontSize: 16,
                                color: "#1976d2",
                                marginBottom: 4,
                            }}
                        >
                            🔍 Búsqueda global de productos
                        </label>
                        <div
                            style={{
                                display: "flex",
                                gap: 12,
                                alignItems: "center",
                                width: "100%",
                            }}
                        >
                            <input
                                type="text"
                                placeholder="Buscar productos por nombre, categoría, etc... (búsqueda automática)"
                                value={globalSearchInput}
                                onChange={(e) =>
                                    setGlobalSearchInput(e.target.value)
                                }
                                style={{
                                    flex: 1,
                                    padding: "14px 18px",
                                    borderRadius: 8,
                                    border: "1.5px solid #1976d2",
                                    fontSize: 16,
                                    minWidth: 320,
                                    background: "#f8fafc",
                                    outline: "none",
                                    transition: "border 0.2s",
                                    boxShadow: globalSearchInput
                                        ? "0 2px 8px #1976d233"
                                        : "none",
                                }}
                            />
                            {globalSearchInput && (
                                <button
                                    onClick={() => {
                                        setGlobalSearchInput("");
                                        setGlobalSearchTerm("");
                                        if (leftSupplier)
                                            loadSupplierData(
                                                leftSupplier,
                                                "left"
                                            );
                                        if (rightSupplier)
                                            loadSupplierData(
                                                rightSupplier,
                                                "right"
                                            );
                                    }}
                                    style={{
                                        padding: "12px 18px",
                                        borderRadius: 8,
                                        border: "1.5px solid #dc3545",
                                        background: "#fff",
                                        color: "#dc3545",
                                        fontWeight: 700,
                                        fontSize: 16,
                                        cursor: "pointer",
                                        transition:
                                            "background 0.2s, color 0.2s",
                                    }}
                                >
                                    Limpiar
                                </button>
                            )}
                        </div>
                        {globalSearchInput && (
                            <p
                                style={{
                                    marginTop: 4,
                                    fontSize: 13,
                                    color: "#666",
                                    fontStyle: "italic",
                                }}
                            >
                                Buscando productos que coincidan con: "
                                {globalSearchInput}"
                            </p>
                        )}
                    </div>
                    {/* Filtro de categorías mejorado */}
                    <div
                        style={{
                            background: "#fff",
                            padding: 20,
                            borderRadius: 12,
                            boxShadow: "0 2px 8px rgba(25, 118, 210, 0.08)",
                            marginBottom: 24,
                        }}
                    >
                        <CategoryFilter
                            categories={categories}
                            selectedCategories={selectedCategory}
                            onChange={setSelectedCategory}
                            isLoading={categoriesLoading}
                        />
                    </div>
                    {/* Selectores de proveedor mejorados */}
                    <div
                        style={{
                            display: "flex",
                            gap: 32,
                            flexWrap: "wrap",
                            marginBottom: 12,
                        }}
                    >
                        <div style={{ flex: 1, minWidth: 320 }}>
                            <label
                                style={{
                                    fontWeight: 700,
                                    color: "#1976d2",
                                    marginRight: 10,
                                    fontSize: 15,
                                    marginBottom: 6,
                                    display: "block",
                                }}
                            >
                                Proveedor A:
                            </label>
                            <select
                                value={leftSupplier}
                                onChange={(e) =>
                                    setLeftSupplier(e.target.value)
                                }
                                style={{
                                    padding: "12px 16px",
                                    borderRadius: 8,
                                    border: "1.5px solid #1976d2",
                                    fontSize: 16,
                                    minWidth: 220,
                                    background: leftSupplier
                                        ? "#e3f2fd"
                                        : "#f8fafc",
                                    color: leftSupplier ? "#1976d2" : "#333",
                                    fontWeight: leftSupplier ? 700 : 400,
                                    outline: "none",
                                    marginBottom: 8,
                                    boxShadow: leftSupplier
                                        ? "0 2px 8px #1976d233"
                                        : "none",
                                    transition: "all 0.2s",
                                }}
                            >
                                <option value="">Seleccionar proveedor</option>
                                {suppliers.map((supplier) => (
                                    <option
                                        key={supplier.id}
                                        value={supplier.id}
                                    >
                                        {supplier.name}
                                    </option>
                                ))}
                            </select>
                            <div
                                style={{
                                    background: "#fff",
                                    borderRadius: 12,
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                                    border: "1px solid #e9ecef",
                                    minHeight: 300,
                                    marginTop: 8,
                                    overflowX: "auto",
                                }}
                            >
                                <h3
                                    style={{
                                        marginTop: 0,
                                        marginBottom: 16,
                                        padding: "18px 18px 0 18px",
                                        color: "#2c3e50",
                                        fontWeight: 700,
                                        fontSize: 18,
                                    }}
                                >
                                    Catálogo del Proveedor A
                                </h3>
                                {leftLoading ? (
                                    <div
                                        style={{
                                            textAlign: "center",
                                            padding: 40,
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: 32,
                                                height: 32,
                                                border: "3px solid #e3e6ea",
                                                borderTop: "3px solid #007bff",
                                                borderRadius: "50%",
                                                animation:
                                                    "spin 1s linear infinite",
                                                margin: "0 auto 16px",
                                            }}
                                        ></div>
                                        <p
                                            style={{
                                                color: "#6c757d",
                                                margin: 0,
                                            }}
                                        >
                                            Cargando datos...
                                        </p>
                                        <style>{`@keyframes spin {0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}`}</style>
                                    </div>
                                ) : leftTableData.length > 0 ? (
                                    <table
                                        style={{
                                            width: "100%",
                                            borderCollapse: "collapse",
                                            minWidth: 400,
                                            background: "#fff",
                                        }}
                                    >
                                        <thead>
                                            <tr
                                                style={{
                                                    background:
                                                        "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)",
                                                    color: "white",
                                                }}
                                            >
                                                <th
                                                    style={{
                                                        padding: "16px 12px",
                                                        textAlign: "left",
                                                        fontWeight: 600,
                                                        fontSize: 14,
                                                        letterSpacing: "0.5px",
                                                        textTransform:
                                                            "uppercase",
                                                    }}
                                                >
                                                    Nombre
                                                </th>
                                                <th
                                                    style={{
                                                        padding: "16px 12px",
                                                        textAlign: "left",
                                                        fontWeight: 600,
                                                        fontSize: 14,
                                                        letterSpacing: "0.5px",
                                                        textTransform:
                                                            "uppercase",
                                                    }}
                                                >
                                                    Precio de Compra
                                                </th>
                                                <th
                                                    style={{
                                                        padding: "16px 12px",
                                                        textAlign: "left",
                                                        fontWeight: 600,
                                                        fontSize: 14,
                                                        letterSpacing: "0.5px",
                                                        textTransform:
                                                            "uppercase",
                                                    }}
                                                >
                                                    Categoría
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {leftTableData.map((row, idx) => (
                                                <tr
                                                    key={idx}
                                                    style={{
                                                        backgroundColor:
                                                            idx % 2 === 0
                                                                ? "#fff"
                                                                : "#f8f9fa",
                                                    }}
                                                >
                                                    <td
                                                        style={{
                                                            padding:
                                                                "16px 12px",
                                                            borderBottom:
                                                                "1px solid #e9ecef",
                                                            fontSize: 14,
                                                            fontWeight: 500,
                                                            color: "#495057",
                                                        }}
                                                    >
                                                        {getFieldValue(
                                                            row,
                                                            "nombre",
                                                            [
                                                                "name",
                                                                "product_name",
                                                                "product_name_es",
                                                            ]
                                                        ) || "N/A"}
                                                    </td>
                                                    <td
                                                        style={{
                                                            padding:
                                                                "16px 12px",
                                                            borderBottom:
                                                                "1px solid #e9ecef",
                                                            fontSize: 15,
                                                            fontWeight: 700,
                                                            color: "#2c3e50",
                                                        }}
                                                    >
                                                        {(() => {
                                                            const price =
                                                                getFieldValue(
                                                                    row,
                                                                    "purchase_price",
                                                                    [
                                                                        "price",
                                                                        "cost",
                                                                        "unit_price",
                                                                    ]
                                                                );
                                                            return price
                                                                ? `$${parseFloat(
                                                                      price
                                                                  ).toFixed(2)}`
                                                                : "N/A";
                                                        })()}
                                                    </td>
                                                    <td
                                                        style={{
                                                            padding:
                                                                "16px 12px",
                                                            borderBottom:
                                                                "1px solid #e9ecef",
                                                            fontSize: 14,
                                                            fontWeight: 500,
                                                            color: "#495057",
                                                        }}
                                                    >
                                                        {getFieldValue(
                                                            row,
                                                            "categoria",
                                                            [
                                                                "category",
                                                                "product_category",
                                                                "category_name",
                                                            ]
                                                        ) || "N/A"}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div
                                        style={{
                                            textAlign: "center",
                                            padding: "60px 40px",
                                            background: "#f8f9fa",
                                            borderRadius: 12,
                                            border: "2px dashed #dee2e6",
                                            margin: 20,
                                        }}
                                    >
                                        <div style={{ marginBottom: 16 }}>
                                            <span
                                                style={{
                                                    fontSize: 48,
                                                    opacity: 0.5,
                                                }}
                                            >
                                                📋
                                            </span>
                                        </div>
                                        <h3
                                            style={{
                                                color: "#6c757d",
                                                fontSize: 18,
                                                fontWeight: 600,
                                                margin: "0 0 8px 0",
                                            }}
                                        >
                                            No hay datos para mostrar
                                        </h3>
                                        <p
                                            style={{
                                                color: "#6c757d",
                                                fontSize: 14,
                                                margin: 0,
                                                opacity: 0.8,
                                            }}
                                        >
                                            {leftSupplier
                                                ? "No hay datos para mostrar"
                                                : "Selecciona un proveedor"}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div style={{ flex: 1, minWidth: 320 }}>
                            <label
                                style={{
                                    fontWeight: 700,
                                    color: "#1976d2",
                                    marginRight: 10,
                                    fontSize: 15,
                                    marginBottom: 6,
                                    display: "block",
                                }}
                            >
                                Proveedor B:
                            </label>
                            <select
                                value={rightSupplier}
                                onChange={(e) =>
                                    setRightSupplier(e.target.value)
                                }
                                style={{
                                    padding: "12px 16px",
                                    borderRadius: 8,
                                    border: "1.5px solid #1976d2",
                                    fontSize: 16,
                                    minWidth: 220,
                                    background: rightSupplier
                                        ? "#e3f2fd"
                                        : "#f8fafc",
                                    color: rightSupplier ? "#1976d2" : "#333",
                                    fontWeight: rightSupplier ? 700 : 400,
                                    outline: "none",
                                    marginBottom: 8,
                                    boxShadow: rightSupplier
                                        ? "0 2px 8px #1976d233"
                                        : "none",
                                    transition: "all 0.2s",
                                }}
                            >
                                <option value="">Seleccionar proveedor</option>
                                {suppliers.map((supplier) => (
                                    <option
                                        key={supplier.id}
                                        value={supplier.id}
                                    >
                                        {supplier.name}
                                    </option>
                                ))}
                            </select>
                            <div
                                style={{
                                    background: "#fff",
                                    borderRadius: 12,
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                                    border: "1px solid #e9ecef",
                                    minHeight: 300,
                                    marginTop: 8,
                                    overflowX: "auto",
                                }}
                            >
                                <h3
                                    style={{
                                        marginTop: 0,
                                        marginBottom: 16,
                                        padding: "18px 18px 0 18px",
                                        color: "#2c3e50",
                                        fontWeight: 700,
                                        fontSize: 18,
                                    }}
                                >
                                    Catálogo del Proveedor B
                                </h3>
                                {rightLoading ? (
                                    <div
                                        style={{
                                            textAlign: "center",
                                            padding: 40,
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: 32,
                                                height: 32,
                                                border: "3px solid #e3e6ea",
                                                borderTop: "3px solid #007bff",
                                                borderRadius: "50%",
                                                animation:
                                                    "spin 1s linear infinite",
                                                margin: "0 auto 16px",
                                            }}
                                        ></div>
                                        <p
                                            style={{
                                                color: "#6c757d",
                                                margin: 0,
                                            }}
                                        >
                                            Cargando datos...
                                        </p>
                                        <style>{`@keyframes spin {0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}`}</style>
                                    </div>
                                ) : rightTableData.length > 0 ? (
                                    <table
                                        style={{
                                            width: "100%",
                                            borderCollapse: "collapse",
                                            minWidth: 400,
                                            background: "#fff",
                                        }}
                                    >
                                        <thead>
                                            <tr
                                                style={{
                                                    background:
                                                        "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)",
                                                    color: "white",
                                                }}
                                            >
                                                <th
                                                    style={{
                                                        padding: "16px 12px",
                                                        textAlign: "left",
                                                        fontWeight: 600,
                                                        fontSize: 14,
                                                        letterSpacing: "0.5px",
                                                        textTransform:
                                                            "uppercase",
                                                    }}
                                                >
                                                    Nombre
                                                </th>
                                                <th
                                                    style={{
                                                        padding: "16px 12px",
                                                        textAlign: "left",
                                                        fontWeight: 600,
                                                        fontSize: 14,
                                                        letterSpacing: "0.5px",
                                                        textTransform:
                                                            "uppercase",
                                                    }}
                                                >
                                                    Precio de Compra
                                                </th>
                                                <th
                                                    style={{
                                                        padding: "16px 12px",
                                                        textAlign: "left",
                                                        fontWeight: 600,
                                                        fontSize: 14,
                                                        letterSpacing: "0.5px",
                                                        textTransform:
                                                            "uppercase",
                                                    }}
                                                >
                                                    Categoría
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rightTableData.map((row, idx) => (
                                                <tr
                                                    key={idx}
                                                    style={{
                                                        backgroundColor:
                                                            idx % 2 === 0
                                                                ? "#fff"
                                                                : "#f8f9fa",
                                                    }}
                                                >
                                                    <td
                                                        style={{
                                                            padding:
                                                                "16px 12px",
                                                            borderBottom:
                                                                "1px solid #e9ecef",
                                                            fontSize: 14,
                                                            fontWeight: 500,
                                                            color: "#495057",
                                                        }}
                                                    >
                                                        {getFieldValue(
                                                            row,
                                                            "nombre",
                                                            [
                                                                "name",
                                                                "product_name",
                                                                "product_name_es",
                                                            ]
                                                        ) || "N/A"}
                                                    </td>
                                                    <td
                                                        style={{
                                                            padding:
                                                                "16px 12px",
                                                            borderBottom:
                                                                "1px solid #e9ecef",
                                                            fontSize: 15,
                                                            fontWeight: 700,
                                                            color: "#2c3e50",
                                                        }}
                                                    >
                                                        {(() => {
                                                            const price =
                                                                getFieldValue(
                                                                    row,
                                                                    "purchase_price",
                                                                    [
                                                                        "price",
                                                                        "cost",
                                                                        "unit_price",
                                                                    ]
                                                                );
                                                            return price
                                                                ? `$${parseFloat(
                                                                      price
                                                                  ).toFixed(2)}`
                                                                : "N/A";
                                                        })()}
                                                    </td>
                                                    <td
                                                        style={{
                                                            padding:
                                                                "16px 12px",
                                                            borderBottom:
                                                                "1px solid #e9ecef",
                                                            fontSize: 14,
                                                            fontWeight: 500,
                                                            color: "#495057",
                                                        }}
                                                    >
                                                        {getFieldValue(
                                                            row,
                                                            "categoria",
                                                            [
                                                                "category",
                                                                "product_category",
                                                                "category_name",
                                                            ]
                                                        ) || "N/A"}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div
                                        style={{
                                            textAlign: "center",
                                            padding: "60px 40px",
                                            background: "#f8f9fa",
                                            borderRadius: 12,
                                            border: "2px dashed #dee2e6",
                                            margin: 20,
                                        }}
                                    >
                                        <div style={{ marginBottom: 16 }}>
                                            <span
                                                style={{
                                                    fontSize: 48,
                                                    opacity: 0.5,
                                                }}
                                            >
                                                📋
                                            </span>
                                        </div>
                                        <h3
                                            style={{
                                                color: "#6c757d",
                                                fontSize: 18,
                                                fontWeight: 600,
                                                margin: "0 0 8px 0",
                                            }}
                                        >
                                            No hay datos para mostrar
                                        </h3>
                                        <p
                                            style={{
                                                color: "#6c757d",
                                                fontSize: 14,
                                                margin: 0,
                                                opacity: 0.8,
                                            }}
                                        >
                                            {rightSupplier
                                                ? "No hay datos para mostrar"
                                                : "Selecciona un proveedor"}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnalisisPreciosPage;
