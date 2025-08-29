// src/pages/InventoryPage.jsx
import React from "react";
import useInventory from "../hooks/useInventory";
import InventoryHeader from "../components/Inventory/InventoryHeader";
import ErrorMessage from "../components/Inventory/ErrorMessage";
import InventoryFilters from "../components/Inventory/InventoryFilters";
import InventoryContent from "../components/Inventory/InventoryContent";
import InventoryStyles from "../components/Inventory/InventoryStyles";
import Modal from "../components/Common/Modal";
import ProductSearchSelector from "../components/Common/ProductSearchSelector";
import { useAuth } from "../context/AuthContext";

const InventoryPage = () => {
    // Utilizamos el hook personalizado para obtener toda la lógica de inventario
    const {
        // Datos procesados y de estado de la API
        filteredProducts, // Productos de la página actual, ya filtrados por API
        totalGeneralProducts, // Total general de productos sin filtros

        // Paginación
        isLoading,
        isStockLoading, // ✨ Nuevo estado para carga de stock separado
        isPurchasePricesLoading, // 🚀 NUEVO: Estado para carga de precios de compra
        error,
        goToNextPage,
        goToPrevPage,
        goToPage, // Nueva función para ir a una página específica
        hasNextPage,
        hasPrevPage,
        currentPage,
        totalPages, // Total de páginas disponibles

        // Filtros
        searchByName,
        nameFilter,

        // ✨ NUEVO: Filtro por SKU
        searchBySku,
        skuFilter,

        // Filtro de categorías
        selectedCategories,
        availableCategories,
        updateSelectedCategories,

        // Reseteo de filtros
        resetAllFilters,

        // 🚀 NUEVO: Funciones de cache persistente
        refrescarCacheInventario,
        eliminarCacheInventario,
        obtenerInfoCacheInventario,
        cacheInventarioData,
    } = useInventory(); // [cite: src/hooks/useInventory.js]

    const { authToken } = useAuth();
    // Estado para el modal de conversión global
    const [showGlobalConversionModal, setShowGlobalConversionModal] =
        React.useState(false);
    const [conversionForm, setConversionForm] = React.useState({
        from_product: null,
        to_product: null,
        conversion_rate: 1,
        is_reversible: false,
    });
    const [isSubmittingConversion, setIsSubmittingConversion] =
        React.useState(false);
    // Estado para mensaje de actualización
    const [refreshMsg, setRefreshMsg] = React.useState("");
    const [refreshKey, setRefreshKey] = React.useState(0);

    // Manejador para la búsqueda global
    const handleSearch = (filters) => {
        // Filtro de nombre
        searchByName(filters.name);

        // ✨ NUEVO: Filtro de SKU
        searchBySku(filters.sku);

        // Filtro de categorías
        updateSelectedCategories(filters.categories);
    };

    return (
        <>
            {/* CSS para animación del spinner y responsive design */}
            <InventoryStyles />
            {/* Botón flotante para crear conversión */}
            <button
                onClick={() => setShowGlobalConversionModal(true)}
                style={{
                    position: "fixed",
                    bottom: 32,
                    right: 32,
                    background: "#0984e3",
                    color: "white",
                    border: "none",
                    borderRadius: 50,
                    width: 64,
                    height: 64,
                    fontSize: 32,
                    boxShadow: "0 4px 16px rgba(9,132,227,0.18)",
                    cursor: "pointer",
                    zIndex: 1200,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
                title="Crear conversión de productos"
            >
                ↔️
            </button>
            <Modal
                isOpen={showGlobalConversionModal}
                onClose={() => setShowGlobalConversionModal(false)}
            >
                <h2>Crear conversión de productos</h2>
                <p>
                    Transforma un producto en otro (por ejemplo, caja a blister,
                    blister a pastilla, etc).
                </p>
                <button
                    onClick={async () => {
                        setRefreshMsg("Eliminando cache y recargando datos...");

                        // Eliminar todos los caches de inventario
                        eliminarCacheInventario();

                        // Recargar todos los datos de inventario desde la API
                        await refrescarCacheInventario();

                        // Actualizar el refreshKey para forzar re-render de los selectores
                        setRefreshKey((k) => k + 1);

                        setRefreshMsg("Datos de inventario actualizados");
                        setTimeout(() => setRefreshMsg(""), 2000);
                    }}
                    style={{
                        marginBottom: 10,
                        background: "#00b894",
                        color: "white",
                        border: "none",
                        borderRadius: 6,
                        padding: "6px 16px",
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "background 0.2s",
                    }}
                    onMouseOver={(e) =>
                        (e.currentTarget.style.background = "#019267")
                    }
                    onMouseOut={(e) =>
                        (e.currentTarget.style.background = "#00b894")
                    }
                >
                    Actualizar inventario
                </button>
                {refreshMsg && (
                    <span style={{ color: "#00b894", marginLeft: 10 }}>
                        {refreshMsg}
                    </span>
                )}
                <div style={{ margin: "16px 0" }}>
                    <label>Producto origen:</label>
                    <ProductSearchSelector
                        key={refreshKey + "-from"}
                        showSelectedProduct={false}
                        refreshKey={refreshKey}
                        onProductSelected={(prod) =>
                            setConversionForm((f) => ({
                                ...f,
                                from_product: prod,
                            }))
                        }
                        placeholder="Buscar producto origen por nombre, SKU o código..."
                        minSearchLength={2}
                        maxResults={10}
                    />
                    {conversionForm.from_product && (
                        <div
                            style={{
                                marginTop: 8,
                                color: "#2c3e50",
                                border: "1px solid #27ae60",
                                borderRadius: 8,
                                padding: 8,
                                background: "#eafaf1",
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                            }}
                        >
                            <div style={{ flex: 1 }}>
                                <strong>
                                    {conversionForm.from_product.name}
                                </strong>
                                <br />
                                SKU: {conversionForm.from_product.sku}
                                <br />
                                <span style={{ color: "#888", fontSize: 13 }}>
                                    Unidad: {conversionForm.from_product.unit} |
                                    Categoría:{" "}
                                    {conversionForm.from_product
                                        .category_name || ""}
                                </span>
                            </div>
                            <button
                                onClick={() =>
                                    setConversionForm((f) => ({
                                        ...f,
                                        from_product: null,
                                    }))
                                }
                                style={{
                                    background: "#ff7675",
                                    color: "white",
                                    border: "none",
                                    borderRadius: 4,
                                    fontWeight: 700,
                                    fontSize: 18,
                                    width: 32,
                                    height: 32,
                                    cursor: "pointer",
                                }}
                            >
                                ×
                            </button>
                        </div>
                    )}
                    <label style={{ marginTop: 12 }}>Producto destino:</label>
                    <ProductSearchSelector
                        key={refreshKey + "-to"}
                        showSelectedProduct={false}
                        refreshKey={refreshKey}
                        onProductSelected={(prod) =>
                            setConversionForm((f) => ({
                                ...f,
                                to_product: prod,
                            }))
                        }
                        placeholder="Buscar producto destino por nombre, SKU o código..."
                        minSearchLength={2}
                        maxResults={10}
                    />
                    {conversionForm.to_product && (
                        <div
                            style={{
                                marginTop: 8,
                                color: "#2c3e50",
                                border: "1px solid #2ecc71",
                                borderRadius: 8,
                                padding: 8,
                                background: "#eafaf1",
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                            }}
                        >
                            <div style={{ flex: 1 }}>
                                <strong>
                                    {conversionForm.to_product.name}
                                </strong>
                                <br />
                                SKU: {conversionForm.to_product.sku}
                                <br />
                                <span style={{ color: "#888", fontSize: 13 }}>
                                    Unidad: {conversionForm.to_product.unit} |
                                    Categoría:{" "}
                                    {conversionForm.to_product.category_name ||
                                        ""}
                                </span>
                            </div>
                            <button
                                onClick={() =>
                                    setConversionForm((f) => ({
                                        ...f,
                                        to_product: null,
                                    }))
                                }
                                style={{
                                    background: "#ff7675",
                                    color: "white",
                                    border: "none",
                                    borderRadius: 4,
                                    fontWeight: 700,
                                    fontSize: 18,
                                    width: 32,
                                    height: 32,
                                    cursor: "pointer",
                                }}
                            >
                                ×
                            </button>
                        </div>
                    )}
                    {conversionForm.from_product &&
                        conversionForm.to_product && (
                            <div style={{ marginTop: 18 }}>
                                <label style={{ fontWeight: 600 }}>
                                    ¿Cuántas{" "}
                                    <span style={{ color: "#0984e3" }}>
                                        {conversionForm.to_product.unit}
                                    </span>{" "}
                                    de{" "}
                                    <span style={{ color: "#0984e3" }}>
                                        {conversionForm.to_product.name}
                                    </span>{" "}
                                    salen de 1{" "}
                                    <span style={{ color: "#27ae60" }}>
                                        {conversionForm.from_product.unit}
                                    </span>{" "}
                                    de{" "}
                                    <span style={{ color: "#27ae60" }}>
                                        {conversionForm.from_product.name}
                                    </span>
                                    ?
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    value={conversionForm.conversion_rate}
                                    onChange={(e) =>
                                        setConversionForm((f) => ({
                                            ...f,
                                            conversion_rate: Math.max(
                                                1,
                                                Number(e.target.value)
                                            ),
                                        }))
                                    }
                                    style={{ width: 80, marginLeft: 8 }}
                                />
                                <div style={{ marginTop: 12 }}>
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={
                                                conversionForm.is_reversible
                                            }
                                            onChange={(e) =>
                                                setConversionForm((f) => ({
                                                    ...f,
                                                    is_reversible:
                                                        e.target.checked,
                                                }))
                                            }
                                        />{" "}
                                        Conversión reversible
                                    </label>
                                </div>
                            </div>
                        )}
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                    <button
                        onClick={async () => {
                            if (
                                !conversionForm.from_product ||
                                !conversionForm.to_product ||
                                !conversionForm.conversion_rate
                            )
                                return;
                            setIsSubmittingConversion(true);
                            try {
                                const resp = await fetch(
                                    "https://unidental-backend.onrender.com/api/catalogs/product-conversions/",
                                    {
                                        method: "POST",
                                        headers: {
                                            "Content-Type": "application/json",
                                            Authorization: `Token ${authToken}`,
                                        },
                                        body: JSON.stringify({
                                            from_product:
                                                conversionForm.from_product.id,
                                            to_product:
                                                conversionForm.to_product.id,
                                            conversion_rate:
                                                conversionForm.conversion_rate,
                                            is_reversible:
                                                conversionForm.is_reversible,
                                        }),
                                    }
                                );
                                if (resp.ok) {
                                    alert("¡Conversión creada exitosamente!");
                                    setShowGlobalConversionModal(false);
                                } else {
                                    alert("Error al crear la conversión");
                                }
                            } finally {
                                setIsSubmittingConversion(false);
                            }
                        }}
                        disabled={isSubmittingConversion}
                        style={{
                            background: isSubmittingConversion
                                ? "#b2bec3"
                                : "#0984e3",
                            color: "white",
                            border: "none",
                            borderRadius: 6,
                            padding: "8px 20px",
                            fontWeight: 600,
                            fontSize: 16,
                            cursor: isSubmittingConversion
                                ? "not-allowed"
                                : "pointer",
                            transition: "background 0.2s",
                            opacity: isSubmittingConversion ? 0.7 : 1,
                        }}
                        onMouseOver={(e) => {
                            if (!isSubmittingConversion)
                                e.currentTarget.style.background = "#0652DD";
                        }}
                        onMouseOut={(e) => {
                            if (!isSubmittingConversion)
                                e.currentTarget.style.background = "#0984e3";
                        }}
                    >
                        {isSubmittingConversion
                            ? "Creando..."
                            : "Crear conversión"}
                    </button>
                    <button
                        onClick={() => setShowGlobalConversionModal(false)}
                        style={{
                            background: "#636e72",
                            color: "white",
                            border: "none",
                            borderRadius: 6,
                            padding: "8px 20px",
                            fontWeight: 600,
                            fontSize: 16,
                            cursor: "pointer",
                        }}
                    >
                        Cerrar
                    </button>
                </div>
            </Modal>
            <div
                className="inventory-container"
                style={{
                    padding: "20px",
                    maxWidth: "1400px",
                    margin: "0 auto",
                    fontFamily:
                        "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                    backgroundColor: "#f8f9fa",
                    minHeight: "calc(100vh - 140px)",
                }}
            >
                {/* Título de la página */}
                <InventoryHeader
                    totalGeneralProducts={totalGeneralProducts}
                    refrescarCacheInventario={refrescarCacheInventario}
                    eliminarCacheInventario={eliminarCacheInventario}
                    obtenerInfoCacheInventario={obtenerInfoCacheInventario}
                    cacheInventarioData={cacheInventarioData}
                    isLoading={isLoading}
                />

                {/* Estado de Error */}
                <ErrorMessage error={error} />

                {/* Componente de búsqueda y filtros */}
                <InventoryFilters
                    onSearch={handleSearch}
                    onReset={resetAllFilters}
                    nameFilter={nameFilter}
                    skuFilter={skuFilter} // ✨ NUEVO: Pasar skuFilter
                    selectedCategories={selectedCategories}
                    availableCategories={availableCategories}
                />

                {/* Tabla de inventario y paginación */}
                <InventoryContent
                    filteredProducts={filteredProducts}
                    isLoading={isLoading}
                    isStockLoading={isStockLoading}
                    isPurchasePricesLoading={isPurchasePricesLoading}
                    totalGeneralProducts={totalGeneralProducts}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    goToPage={goToPage}
                    goToNextPage={goToNextPage}
                    goToPrevPage={goToPrevPage}
                    hasNextPage={hasNextPage}
                    hasPrevPage={hasPrevPage}
                    error={error}
                />
            </div>
        </>
    );
};

export default InventoryPage;
