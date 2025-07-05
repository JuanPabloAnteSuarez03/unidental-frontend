import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import {
    getSupplierPurchaseOptions,
    getAllSuppliers,
} from "../services/suppliersService";
import { getCategories } from "../services/inventoryService";
import CategoryFilter from "../components/SearchFilters/CategoryFilter";
import SupplierComparisonTable from "../components/AnalisisPrecios/SupplierComparisonTable";

function getPageFromUrl(url) {
    if (!url) return null;
    const match = url.match(/[?&]page=(\d+)/);
    return match ? parseInt(match[1], 10) : 1;
}

// Función para normalizar tildes y caracteres especiales
const normalizeText = (text) => {
    if (!text) return "";
    return text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remover diacríticos (tildes)
        .toLowerCase()
        .trim();
};

const AnalisisPreciosPage = () => {
    const { authToken } = useAuth();
    const [data, setData] = useState([]);
    const [allProducts, setAllProducts] = useState([]); // Lista completa de productos
    const [filteredData, setFilteredData] = useState([]); // Datos filtrados localmente
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
    const [suppliersLoading, setSuppliersLoading] = useState(false);
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

    // Estados para búsqueda local en productos de proveedores
    const [supplierProducts, setSupplierProducts] = useState([]);
    const [localSearchResults, setLocalSearchResults] = useState([]);

    // Estados para almacenar datos originales de proveedores
    const [originalLeftData, setOriginalLeftData] = useState([]);
    const [originalRightData, setOriginalRightData] = useState([]);

    // Estado para categorías y filtro de categoría
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState([]);
    const [categoriesLoading, setCategoriesLoading] = useState(false);

    // Estado para los filtros de precio
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");

    // Estados para paginación
    const [pageSizeLocal] = useState(25); // Productos por página
    const [searchResults, setSearchResults] = useState([]); // Resultados de búsqueda del backend

    const BASE_URL =
        "https://unidental-backend.onrender.com/api/suppliers/purchase-options/";

    // Función para cargar productos paginados
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
                if (searchTerm) {
                    // Enviar el término original al backend (sin normalizar)
                    params.push(`search=${encodeURIComponent(searchTerm)}`);
                }
                if (categoryFilter && categoryFilter.length > 0)
                    params.push(`category=${categoryFilter[0]}`);
                if (page > 1) params.push(`page=${page}`);
                params.push(`page_size=${pageSizeLocal}`);
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
                setFilteredData(result);
                setNextUrl(null);
                setPrevUrl(null);
                setCount(result.length);
                setPageSize(result.length);
                setCurrentPage(1);
                setTotalPages(1);
            } else if (result && Array.isArray(result.results)) {
                setData(result.results);
                setFilteredData(result.results);
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
                        ? Math.ceil(result.count / pageSizeLocal)
                        : 1
                );
            } else {
                setData([]);
                setFilteredData([]);
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

    // Función para filtrar productos localmente (solo en la página actual)
    const filterProductsLocally = (searchTerm, categoryFilter = []) => {
        if (!data.length) return [];

        let filtered = [...data];

        // Filtrar por término de búsqueda con normalización local
        if (searchTerm.trim()) {
            const normalizedSearchTerm = normalizeText(searchTerm);

            filtered = filtered.filter((item) => {
                // Buscar en diferentes campos del producto
                const productName = getFieldValue(item, "product_name", [
                    "name",
                    "product_name",
                ]);
                const sku = getFieldValue(item, "sku", ["product_sku"]);
                const description = getFieldValue(item, "description", [
                    "product_description",
                ]);

                // Normalizar los campos del producto
                const normalizedProductName = normalizeText(productName);
                const normalizedSku = normalizeText(sku);
                const normalizedDescription = normalizeText(description);

                // Verificar si el término de búsqueda coincide en algún campo
                return (
                    normalizedProductName.includes(normalizedSearchTerm) ||
                    normalizedSku.includes(normalizedSearchTerm) ||
                    normalizedDescription.includes(normalizedSearchTerm)
                );
            });
        }

        // Filtrar por categoría (por ID)
        if (categoryFilter && categoryFilter.length > 0) {
            filtered = filtered.filter((item) => {
                // Obtener el ID de la categoría del producto
                let itemCategoryId = null;
                // Si el producto tiene el campo category (ID)
                if (item.category && typeof item.category === "number") {
                    itemCategoryId = item.category;
                } else if (
                    item.category &&
                    typeof item.category === "string" &&
                    !isNaN(Number(item.category))
                ) {
                    // Si viene como string numérico
                    itemCategoryId = Number(item.category);
                } else if (item.category_name) {
                    // Si solo tiene el nombre, buscar el ID en categories
                    const found = categories.find(
                        (cat) => cat.name === item.category_name
                    );
                    if (found) itemCategoryId = found.id;
                } else if (item.product_category) {
                    // Si tiene otro campo de nombre
                    const found = categories.find(
                        (cat) => cat.name === item.product_category
                    );
                    if (found) itemCategoryId = found.id;
                }
                return (
                    itemCategoryId && categoryFilter.includes(itemCategoryId)
                );
            });
        }

        return filtered;
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

    // Cargar datos paginados al montar el componente
    useEffect(() => {
        if (authToken && viewMode === "tabla") {
            fetchData(null, 1, "", selectedCategory);
        }
    }, [authToken, viewMode]);

    // Debounce para búsqueda en tiempo real
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setSearch(searchInput);
        }, 300);
        return () => clearTimeout(debounceRef.current);
    }, [searchInput]);

    // Filtrar productos localmente cuando cambia el término de búsqueda
    useEffect(() => {
        if (data.length > 0) {
            const filtered = filterProductsLocally(search, selectedCategory);
            const sortedFiltered = sortByPurchasePrice(filtered);
            setFilteredData(sortedFiltered);
            setCount(sortedFiltered.length);
        }
    }, [search, selectedCategory, data]);

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

    // Debounce para búsqueda global
    useEffect(() => {
        if (globalSearchDebounceRef.current)
            clearTimeout(globalSearchDebounceRef.current);
        globalSearchDebounceRef.current = setTimeout(() => {
            setGlobalSearchTerm(globalSearchInput);
        }, 300);
        return () => clearTimeout(globalSearchDebounceRef.current);
    }, [globalSearchInput]);

    // Manejar búsqueda local cuando cambia el término de búsqueda
    useEffect(() => {
        if (authToken && viewMode === "otros") {
            if (globalSearchTerm.trim()) {
                // Usar búsqueda local en productos de proveedores
                performLocalSearch(globalSearchTerm);
            } else {
                // Restaurar datos originales cuando se limpia la búsqueda
                console.log(
                    "🔄 Restaurando datos originales de proveedores..."
                );
                setLeftTableData(originalLeftData);
                setRightTableData(originalRightData);
                setLocalSearchResults([]);
            }
        }
    }, [
        globalSearchTerm,
        authToken,
        viewMode,
        originalLeftData,
        originalRightData,
    ]);

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
            setSelectedCategory([]);
        }
    }, [viewMode]);

    // Función para cargar proveedores
    const loadSuppliers = async () => {
        setSuppliersLoading(true);
        try {
            const suppliersData = await getAllSuppliers(authToken);
            setSuppliers(suppliersData);
        } catch (err) {
            console.error("Error loading suppliers:", err);
        } finally {
            setSuppliersLoading(false);
        }
    };

    // Función para cargar datos de búsqueda global (usando búsqueda del backend)
    const loadGlobalSearchData = async () => {
        if (!globalSearchTerm.trim()) return;

        console.log("🔍 Iniciando búsqueda global...");
        console.log("Término de búsqueda:", globalSearchTerm);

        // Si tenemos productos de proveedores cargados, usar búsqueda local
        const allSupplierProducts = [...leftTableData, ...rightTableData];
        if (allSupplierProducts.length > 0) {
            console.log(
                "📱 Usando búsqueda local en productos de proveedores..."
            );
            performLocalSearch(globalSearchTerm);
            return;
        }

        // Si no tenemos productos de proveedores, usar búsqueda del backend
        console.log("🌐 Usando búsqueda del backend...");

        setLeftLoading(true);
        setRightLoading(true);

        try {
            const response = await fetch(
                `${BASE_URL}?search=${encodeURIComponent(
                    globalSearchTerm
                )}&page_size=1000`,
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Token ${authToken}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error(
                    `Error ${response.status}: ${response.statusText}`
                );
            }

            const result = await response.json();
            let data = [];

            if (Array.isArray(result)) {
                data = result;
            } else if (result && Array.isArray(result.results)) {
                data = result.results;
            } else if (result && result.data && Array.isArray(result.data)) {
                data = result.data;
            }

            console.log(
                `✅ Búsqueda global completada: ${data.length} productos encontrados`
            );

            // Filtrar por proveedor si están seleccionados
            const leftData = leftSupplier
                ? data.filter((item) => {
                      const itemSupplierId = item.supplier_id || item.supplier;
                      const itemSupplierName = item.supplier_name;
                      const selectedSupplierName = suppliers.find(
                          (s) => s.id === parseInt(leftSupplier)
                      )?.name;

                      return (
                          itemSupplierId === parseInt(leftSupplier) ||
                          itemSupplierName === selectedSupplierName
                      );
                  })
                : data;

            const rightData = rightSupplier
                ? data.filter((item) => {
                      const itemSupplierId = item.supplier_id || item.supplier;
                      const itemSupplierName = item.supplier_name;
                      const selectedSupplierName = suppliers.find(
                          (s) => s.id === parseInt(rightSupplier)
                      )?.name;

                      return (
                          itemSupplierId === parseInt(rightSupplier) ||
                          itemSupplierName === selectedSupplierName
                      );
                  })
                : data;

            // Ordenar y mostrar resultados
            const sortedLeftData = sortByPurchasePrice(leftData);
            const sortedRightData = sortByPurchasePrice(rightData);

            setLeftTableData(sortedLeftData);
            setRightTableData(sortedRightData);
        } catch (error) {
            console.error("❌ Error en búsqueda global:", error);
            setLeftTableData([]);
            setRightTableData([]);
        } finally {
            setLeftLoading(false);
            setRightLoading(false);
        }
    };

    // Función auxiliar para obtener todas las páginas de opciones de compra de un proveedor
    const fetchAllSupplierOptions = async (supplierId) => {
        let allData = [];
        let nextUrl = `${BASE_URL}?supplier=${supplierId}`;
        if (selectedCategory.length > 0) {
            nextUrl += `&category=${selectedCategory[0]}`;
        }
        nextUrl += `&page_size=100`;
        let pageCount = 0;
        const maxPages = 100;
        while (nextUrl && pageCount < maxPages) {
            pageCount++;
            const response = await fetch(nextUrl, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Token ${authToken}`,
                },
            });
            if (!response.ok)
                throw new Error(
                    `Error ${response.status}: ${response.statusText}`
                );
            const result = await response.json();
            let data = [];
            if (Array.isArray(result)) {
                data = result;
            } else if (result && Array.isArray(result.results)) {
                data = result.results;
            } else if (result && result.data && Array.isArray(result.data)) {
                data = result.data;
            }
            allData.push(...data);
            nextUrl = result.next ? result.next : null;
        }
        return allData;
    };

    // Función para cargar datos de un proveedor específico (usando búsqueda del backend)
    const loadSupplierData = async (supplierId, side) => {
        if (!supplierId) return;
        const setLoadingState =
            side === "left" ? setLeftLoading : setRightLoading;
        const setTableData =
            side === "left" ? setLeftTableData : setRightTableData;
        const setOriginalData =
            side === "left" ? setOriginalLeftData : setOriginalRightData;
        const supplierName =
            suppliers.find((s) => s.id === parseInt(supplierId))?.name ||
            `ID: ${supplierId}`;
        setLoadingState(true);
        try {
            // Obtener todas las páginas de opciones de compra
            const allData = await fetchAllSupplierOptions(supplierId);
            // Filtrar por proveedor específico (por si acaso el backend no filtró correctamente)
            const filteredData = allData.filter((item) => {
                const itemSupplierId =
                    item.supplier_id || item.supplier || item.supplier_id;
                const itemSupplierName =
                    item.supplier_name || item.supplier_name;
                return (
                    itemSupplierId === parseInt(supplierId) ||
                    itemSupplierName === supplierName
                );
            });
            const sortedData = sortByPurchasePrice(filteredData);
            setTableData(sortedData);
            setOriginalData(sortedData); // Guardar datos originales
        } catch (err) {
            setTableData([]);
            setOriginalData([]); // Limpiar datos originales en caso de error
        } finally {
            setLoadingState(false);
        }
    };

    // Función de búsqueda local en productos de proveedores seleccionados
    const performLocalSearch = (searchTerm) => {
        if (!searchTerm.trim()) {
            setLocalSearchResults([]);
            return;
        }

        console.log(
            "🔍 Realizando búsqueda local en productos de proveedores..."
        );
        console.log("Término de búsqueda:", searchTerm);

        // Obtener todos los productos de los proveedores seleccionados
        const allSupplierProducts = [...leftTableData, ...rightTableData];

        if (allSupplierProducts.length === 0) {
            console.log(
                "⚠️ No hay productos de proveedores cargados para buscar"
            );
            setLocalSearchResults([]);
            return;
        }

        // Normalizar el término de búsqueda del usuario
        const normalizedSearchTerm = normalizeText(searchTerm.trim());
        console.log("Término normalizado:", normalizedSearchTerm);

        // Buscar en los productos de proveedores
        const results = allSupplierProducts.filter((product) => {
            // Obtener campos de búsqueda del producto
            const productName =
                getFieldValue(product, "product_name", [
                    "name",
                    "product_name",
                ]) || "";
            const productSku =
                getFieldValue(product, "sku", ["product_sku"]) || "";
            const productDescription =
                getFieldValue(product, "description", [
                    "product_description",
                ]) || "";
            const productCategory =
                getFieldValue(product, "category", [
                    "category_name",
                    "product_category",
                ]) || "";

            // Normalizar todos los campos del producto
            const normalizedName = normalizeText(productName);
            const normalizedSku = normalizeText(productSku);
            const normalizedDescription = normalizeText(productDescription);
            const normalizedCategory = normalizeText(productCategory);

            // Verificar si el término de búsqueda coincide en algún campo
            const matches =
                normalizedName.includes(normalizedSearchTerm) ||
                normalizedSku.includes(normalizedSearchTerm) ||
                normalizedDescription.includes(normalizedSearchTerm) ||
                normalizedCategory.includes(normalizedSearchTerm);

            if (matches) {
                console.log(
                    `✅ Coincidencia encontrada: ${productName} (${productSku})`
                );
            }

            return matches;
        });

        console.log(
            `🎯 Resultados de búsqueda local: ${results.length} productos encontrados`
        );
        setLocalSearchResults(results);

        // Si no hay proveedores seleccionados, mostrar todos los resultados
        if (!leftSupplier && !rightSupplier) {
            const sortedResults = sortByPurchasePrice(results);
            setLeftTableData(sortedResults);
            setRightTableData(sortedResults);
        } else {
            // Si hay proveedores seleccionados, filtrar por ellos
            filterLocalSearchResultsBySupplier(results);
        }
    };

    // Función para filtrar resultados locales por proveedor
    const filterLocalSearchResultsBySupplier = (searchResults) => {
        const leftData = leftSupplier
            ? searchResults.filter((item) => {
                  const itemSupplierId = item.supplier_id || item.supplier;
                  const itemSupplierName = item.supplier_name;
                  const selectedSupplierName = suppliers.find(
                      (s) => s.id === parseInt(leftSupplier)
                  )?.name;

                  return (
                      itemSupplierId === parseInt(leftSupplier) ||
                      itemSupplierName === selectedSupplierName
                  );
              })
            : searchResults;

        const rightData = rightSupplier
            ? searchResults.filter((item) => {
                  const itemSupplierId = item.supplier_id || item.supplier;
                  const itemSupplierName = item.supplier_name;
                  const selectedSupplierName = suppliers.find(
                      (s) => s.id === parseInt(rightSupplier)
                  )?.name;

                  return (
                      itemSupplierId === parseInt(rightSupplier) ||
                      itemSupplierName === selectedSupplierName
                  );
              })
            : searchResults;

        // Ordenar y mostrar resultados
        const sortedLeftData = sortByPurchasePrice(leftData);
        const sortedRightData = sortByPurchasePrice(rightData);

        setLeftTableData(sortedLeftData);
        setRightTableData(sortedRightData);
    };

    // Filtrar resultados locales cuando cambien los proveedores seleccionados
    useEffect(() => {
        if (localSearchResults.length > 0 && (leftSupplier || rightSupplier)) {
            filterLocalSearchResultsBySupplier(localSearchResults);
        }
    }, [leftSupplier, rightSupplier, localSearchResults]);

    const goToPage = (page) => {
        if (page < 1 || page > totalPages) return;
        fetchData(null, page, search, selectedCategory);
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
            // Recargar datos con el nuevo filtro de categoría
            fetchData(null, 1, search, selectedCategory);
        }
    }, [selectedCategory, authToken]);

    // Cargar datos del proveedor izquierdo cuando cambia su selección
    useEffect(() => {
        if (viewMode === "otros" && authToken && !globalSearchTerm) {
            console.log("🔄 Cambio en proveedor A detectado:", leftSupplier);

            if (leftSupplier) {
                console.log("📥 Cargando datos del proveedor A...");
                loadSupplierData(leftSupplier, "left");
            } else {
                console.log("🧹 Limpiando datos del proveedor A");
                setLeftTableData([]);
                setLeftLoading(false);
                setOriginalLeftData([]); // Limpiar datos originales
            }
        }
    }, [leftSupplier, authToken, viewMode, globalSearchTerm]);

    // Cargar datos del proveedor derecho cuando cambia su selección
    useEffect(() => {
        if (viewMode === "otros" && authToken && !globalSearchTerm) {
            console.log("🔄 Cambio en proveedor B detectado:", rightSupplier);

            if (rightSupplier) {
                console.log("📥 Cargando datos del proveedor B...");
                loadSupplierData(rightSupplier, "right");
            } else {
                console.log("🧹 Limpiando datos del proveedor B");
                setRightTableData([]);
                setRightLoading(false);
                setOriginalRightData([]); // Limpiar datos originales
            }
        }
    }, [rightSupplier, authToken, viewMode, globalSearchTerm]);

    // Cargar categorías cuando se entra a la vista 'tabla' o 'otros', si no están cargadas
    useEffect(() => {
        if (
            viewMode === "tabla" &&
            categories.length === 0 &&
            !categoriesLoading
        ) {
            setCategoriesLoading(true);
            getCategories(authToken)
                .then((cats) => setCategories(cats))
                .catch(() => setCategories([]))
                .finally(() => setCategoriesLoading(false));
        }
    }, [viewMode, authToken, categories.length, categoriesLoading]);

    // Filtrado por precio en la tabla principal
    const finalFilteredData = filteredData.filter((row) => {
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
                                    ) : finalFilteredData.length > 0 ? (
                                        finalFilteredData.map((row, idx) => {
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
                                    borderRadius: 6,
                                    border: "1.5px solid #e3eaf3",
                                    background:
                                        currentPage === 1 ? "#f8f9fa" : "#fff",
                                    color: "#2c3e50",
                                    fontWeight: 600,
                                    fontSize: "14px",
                                    cursor:
                                        currentPage === 1
                                            ? "not-allowed"
                                            : "pointer",
                                    transition: "all 0.2s ease",
                                }}
                                title="Primera página"
                            >
                                ⏮
                            </button>
                            <button
                                onClick={() => goToPage(currentPage - 1)}
                                disabled={currentPage === 1}
                                style={{
                                    padding: "8px 12px",
                                    borderRadius: 6,
                                    border: "1.5px solid #e3eaf3",
                                    background:
                                        currentPage === 1 ? "#f8f9fa" : "#fff",
                                    color: "#2c3e50",
                                    fontWeight: 600,
                                    fontSize: "14px",
                                    cursor:
                                        currentPage === 1
                                            ? "not-allowed"
                                            : "pointer",
                                    transition: "all 0.2s ease",
                                }}
                                title="Página anterior"
                            >
                                ←
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
                                                borderRadius: 6,
                                                border: "1.5px solid #e3eaf3",
                                                background:
                                                    page === currentPage
                                                        ? "#2c3e50"
                                                        : "#fff",
                                                color:
                                                    page === currentPage
                                                        ? "#fff"
                                                        : "#2c3e50",
                                                fontWeight: 600,
                                                fontSize: "14px",
                                                cursor: "pointer",
                                                transition: "all 0.2s ease",
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
                                    borderRadius: 6,
                                    border: "1.5px solid #e3eaf3",
                                    background:
                                        currentPage === totalPages
                                            ? "#f8f9fa"
                                            : "#fff",
                                    color: "#2c3e50",
                                    fontWeight: 600,
                                    fontSize: "14px",
                                    cursor:
                                        currentPage === totalPages
                                            ? "not-allowed"
                                            : "pointer",
                                    transition: "all 0.2s ease",
                                }}
                                title="Página siguiente"
                            >
                                →
                            </button>
                            <span
                                style={{
                                    marginLeft: 12,
                                    fontSize: 14,
                                }}
                            >
                                Página {currentPage} de {totalPages} (
                                {finalFilteredData.length} resultados)
                            </span>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    marginLeft: "12px",
                                }}
                            >
                                <label
                                    htmlFor="page-input"
                                    style={{
                                        fontSize: "14px",
                                        color: "#495057",
                                        fontWeight: "500",
                                    }}
                                >
                                    Ir a:
                                </label>
                                <input
                                    id="page-input"
                                    type="number"
                                    min="1"
                                    max={totalPages}
                                    defaultValue={currentPage}
                                    style={{
                                        width: "60px",
                                        padding: "6px 8px",
                                        border: "1px solid #ced4da",
                                        borderRadius: "4px",
                                        fontSize: "14px",
                                        textAlign: "center",
                                        outline: "none",
                                        transition: "border-color 0.2s ease",
                                    }}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        const pageNumber = parseInt(value, 10);

                                        // Si el valor es mayor al total de páginas, no permitir escribirlo
                                        if (pageNumber > totalPages) {
                                            e.target.value = totalPages;
                                        }
                                        // Si el valor es menor a 1, no permitir escribirlo
                                        else if (
                                            pageNumber < 1 &&
                                            value !== ""
                                        ) {
                                            e.target.value = 1;
                                        }
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            const pageNumber = parseInt(
                                                e.target.value,
                                                10
                                            );
                                            if (
                                                !isNaN(pageNumber) &&
                                                pageNumber >= 1 &&
                                                pageNumber <= totalPages
                                            ) {
                                                goToPage(pageNumber);
                                            }
                                        }
                                    }}
                                    onBlur={(e) => {
                                        const pageNumber = parseInt(
                                            e.target.value,
                                            10
                                        );
                                        if (
                                            isNaN(pageNumber) ||
                                            pageNumber < 1 ||
                                            pageNumber > totalPages
                                        ) {
                                            e.target.value = currentPage;
                                        }
                                    }}
                                    aria-label="Número de página"
                                />
                                <button
                                    onClick={() => {
                                        const input =
                                            document.getElementById(
                                                "page-input"
                                            );
                                        const pageNumber = parseInt(
                                            input.value,
                                            10
                                        );
                                        if (
                                            !isNaN(pageNumber) &&
                                            pageNumber >= 1 &&
                                            pageNumber <= totalPages
                                        ) {
                                            goToPage(pageNumber);
                                        } else {
                                            input.value = currentPage;
                                        }
                                    }}
                                    style={{
                                        padding: "6px 12px",
                                        backgroundColor: "#2c3e50",
                                        color: "#ffffff",
                                        border: "none",
                                        borderRadius: "4px",
                                        fontSize: "14px",
                                        cursor: "pointer",
                                        transition:
                                            "background-color 0.2s ease",
                                    }}
                                    aria-label="Ir a la página especificada"
                                >
                                    Ir
                                </button>
                            </div>
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
                            padding: 12,
                            borderRadius: 12,
                            boxShadow: "0 2px 8px rgba(25, 118, 210, 0.08)",
                            marginBottom: 20,
                            display: "flex",
                            flexDirection: "column",
                            gap: 12,
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
                            {/* Campo de búsqueda */}
                            <div style={{ width: "100%", maxWidth: 900 }}>
                                <div
                                    style={{
                                        position: "relative",
                                        width: "100%",
                                    }}
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
                                        placeholder="Buscar productos entre proveedores seleccionados..."
                                        value={globalSearchInput}
                                        onChange={(e) =>
                                            setGlobalSearchInput(e.target.value)
                                        }
                                        disabled={suppliersLoading}
                                        style={{
                                            width: "100%",
                                            padding: "14px 16px 14px 44px",
                                            borderRadius: 8,
                                            border: "1.5px solid #1976d2",
                                            background: "#f8fafc",
                                            fontSize: 16,
                                            color: "#22292f",
                                            outline: "none",
                                            boxShadow: globalSearchInput
                                                ? "0 2px 8px #1976d233"
                                                : "none",
                                            transition:
                                                "border 0.2s, box-shadow 0.2s",
                                            fontWeight: 500,
                                            opacity: suppliersLoading ? 0.7 : 1,
                                            cursor: suppliersLoading
                                                ? "not-allowed"
                                                : "text",
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
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
                                disabled={suppliersLoading}
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
                                    opacity: suppliersLoading ? 0.7 : 1,
                                    cursor: suppliersLoading
                                        ? "not-allowed"
                                        : "pointer",
                                }}
                            >
                                <option value="">
                                    {suppliersLoading
                                        ? "🔄 Cargando proveedores..."
                                        : "Seleccionar proveedor"}
                                </option>
                                {suppliers.map((supplier) => (
                                    <option
                                        key={supplier.id}
                                        value={supplier.id}
                                    >
                                        {supplier.name}
                                    </option>
                                ))}
                            </select>
                            <SupplierComparisonTable
                                data={leftTableData}
                                loading={leftLoading}
                                supplierName={
                                    suppliers.find(
                                        (s) => s.id === parseInt(leftSupplier)
                                    )?.name || ""
                                }
                                side="left"
                                getFieldValue={getFieldValue}
                            />
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
                                disabled={suppliersLoading}
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
                                    opacity: suppliersLoading ? 0.7 : 1,
                                    cursor: suppliersLoading
                                        ? "not-allowed"
                                        : "pointer",
                                }}
                            >
                                <option value="">
                                    {suppliersLoading
                                        ? "🔄 Cargando proveedores..."
                                        : "Seleccionar proveedor"}
                                </option>
                                {suppliers.map((supplier) => (
                                    <option
                                        key={supplier.id}
                                        value={supplier.id}
                                    >
                                        {supplier.name}
                                    </option>
                                ))}
                            </select>
                            <SupplierComparisonTable
                                data={rightTableData}
                                loading={rightLoading}
                                supplierName={
                                    suppliers.find(
                                        (s) => s.id === parseInt(rightSupplier)
                                    )?.name || ""
                                }
                                side="right"
                                getFieldValue={getFieldValue}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnalisisPreciosPage;
