// SearchFiltersContainer.jsx

import React, { useState, useEffect, useCallback, useMemo } from "react";
import NameSearch from "./NameSearch";
import CategoryFilter from "./CategoryFilter";

const SearchFiltersContainer = ({
    onSearch,
    onReset,
    nameFilter = "",
    skuFilter = "", // ✨ NUEVO: Agregar skuFilter prop
    selectedCategories = [],
    availableCategories = [],
    isCategoriesLoading = false,
}) => {
    // Estado local para almacenar los valores de los filtros
    const [filters, setFilters] = useState({
        name: nameFilter,
        sku: skuFilter, // ✨ NUEVO: Agregar SKU al estado
        categories: selectedCategories,
    });

    // ✨ OPTIMIZADO: Estado para controlar si la búsqueda en tiempo real está habilitada
    const [realTimeSearchEnabled, setRealTimeSearchEnabled] = useState(true);

    // Actualizar el estado local cuando cambian los props
    useEffect(() => {
        setFilters((prev) => ({
            ...prev,
            name: nameFilter,
            sku: skuFilter, // ✨ NUEVO: Sincronizar SKU
            categories: selectedCategories,
        }));
    }, [nameFilter, skuFilter, selectedCategories]); // ✨ Agregar skuFilter a las dependencias

    // ✨ OPTIMIZADO: Manejadores de cambio que ejecutan búsqueda INMEDIATAMENTE si está en modo tiempo real
    const handleNameChange = useCallback(
        (value) => {
            const newFilters = { ...filters, name: value };
            setFilters(newFilters);

            // 🚀 OPTIMIZACIÓN CLAVE: Búsqueda inmediata sin debouncing local
            // El debouncing lo maneja useNameSearch (300ms) que es más eficiente
            if (realTimeSearchEnabled) {
                console.log(
                    "🚀 Búsqueda inmediata (sin debounce local):",
                    newFilters
                );
                onSearch(newFilters);
            }
        },
        [filters, onSearch, realTimeSearchEnabled]
    );

    // ✨ NUEVO: Manejador para cambios en el SKU
    const handleSkuChange = useCallback(
        (value) => {
            const newFilters = { ...filters, sku: value };
            setFilters(newFilters);

            // 🚀 Búsqueda inmediata para SKU también
            if (realTimeSearchEnabled) {
                console.log("🚀 Búsqueda inmediata por SKU:", newFilters);
                console.log(`📊 SKU Debug Info:
                  - Valor ingresado: "${value}"
                  - Longitud: ${value.length} caracteres
                  - Tipo de búsqueda: ${
                      value.includes("-") ? "SKU completo" : "Búsqueda parcial"
                  }
                  - Búsqueda debería encontrar: SKUs que contengan "${value}"`);

                onSearch(newFilters);
            }
        },
        [filters, onSearch, realTimeSearchEnabled]
    );

    const handleCategoriesChange = useCallback(
        (categories) => {
            const newFilters = { ...filters, categories };
            setFilters(newFilters);

            // 🚀 Búsqueda inmediata para categorías también
            if (realTimeSearchEnabled) {
                console.log(
                    "🚀 Búsqueda inmediata por categorías:",
                    newFilters
                );
                onSearch(newFilters);
            }
        },
        [filters, onSearch, realTimeSearchEnabled]
    );

    // Manejador para la búsqueda manual (memoizado) - Para modo manual
    const handleSearch = useCallback(
        (e) => {
            e.preventDefault();
            console.log("🔍 Búsqueda manual:", filters);
            onSearch(filters);
        },
        [filters, onSearch]
    );

    // Manejador para el reseteo (memoizado)
    const handleReset = useCallback(() => {
        setFilters({ name: "", sku: "", categories: [] }); // ✨ Limpiar SKU también
        onReset();
    }, [onReset]);

    // ✨ OPTIMIZADO: Manejador para alternar búsqueda en tiempo real
    const toggleRealTimeSearch = useCallback(() => {
        setRealTimeSearchEnabled((prev) => !prev);
        // Si se activa tiempo real, ejecutar búsqueda inmediata
        if (!realTimeSearchEnabled) {
            console.log("🔄 Activando tiempo real - búsqueda inmediata");
            onSearch(filters);
        }
    }, [realTimeSearchEnabled, onSearch, filters]);

    // Estilos para el contenedor de filtros (memoizados)
    const styles = useMemo(
        () => ({
            container: {
                marginBottom: "20px",
                padding: "20px",
                backgroundColor: "#f8f9fa",
                borderRadius: "8px",
                border: "1px solid #dee2e6",
            },
            title: {
                fontSize: "16px",
                fontWeight: "600",
                marginBottom: "15px",
                color: "#495057",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
            },
            // ✨ OPTIMIZADO: Estilos para el indicador de tiempo real con mejor UX
            realTimeToggle: {
                background: "none",
                border: "none",
                color: realTimeSearchEnabled ? "#28a745" : "#6c757d",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "12px",
                fontWeight: "500",
                padding: "4px 8px",
                borderRadius: "4px",
                transition: "all 0.2s ease",
            },
            form: {
                display: "flex",
                flexDirection: "column",
                gap: "20px",
            },
            // --- ESTILO PARA LA FILA DE INPUTS ---
            filterRow: {
                display: "flex",
                flexDirection: "row",
                alignItems: "flex-end",
                gap: "5px", // Reducido de 20px a 5px para acercar los campos
                justifyContent: "flex-start", // Cambiado a flex-start para no distribuir espacio
            },
            buttonContainer: {
                display: "flex",
                gap: "10px",
                marginTop: "10px",
            },
            searchButton: {
                backgroundColor: realTimeSearchEnabled ? "#6c757d" : "#2c3e50",
                color: "white",
                border: "none",
                padding: "8px 16px",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
                minWidth: "100px",
                opacity: realTimeSearchEnabled ? 0.7 : 1,
            },
            resetButton: {
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                padding: "8px 16px",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
                minWidth: "100px",
            },
            // ✨ NUEVO: Badge de estado para feedback visual
            performanceBadge: {
                display: "none", // Ocultar el badge completamente
            },
        }),
        [realTimeSearchEnabled]
    );

    return (
        <div style={styles.container}>
            <div style={styles.title}>
                <span>Búsqueda y Filtros</span>
                {/* Toggle con mejor feedback */}
                <button
                    onClick={toggleRealTimeSearch}
                    style={styles.realTimeToggle}
                    title={
                        realTimeSearchEnabled
                            ? "Modo Optimizado: Búsqueda instantánea con debounce inteligente (300ms)"
                            : "Modo Manual: Requiere clic en buscar"
                    }
                >
                    {realTimeSearchEnabled ? "" : "Manual"}
                </button>
            </div>
            <form onSubmit={handleSearch}>
                <div style={styles.form}>
                    {/* Fila para las categorías */}
                    <CategoryFilter
                        categories={availableCategories}
                        selectedCategories={filters.categories}
                        onChange={handleCategoriesChange}
                        isLoading={isCategoriesLoading}
                    />

                    {/* Fila para los campos de búsqueda por nombre - movido debajo de categorías */}
                    <div style={styles.filterRow}>
                        <NameSearch
                            value={filters.name}
                            onChange={handleNameChange}
                        />

                        {/* Campo de búsqueda por SKU */}
                        <div style={{ display: "block" }}>
                            <label
                                htmlFor="sku-search"
                                style={{
                                    display: "block",
                                    marginBottom: "5px",
                                    fontSize: "14px",
                                    fontWeight: "500",
                                    color: "#495057",
                                }}
                            >
                                Buscar por SKU:
                            </label>
                            <div style={{ position: "relative" }}>
                                <input
                                    id="sku-search"
                                    type="text"
                                    value={filters.sku}
                                    onChange={(e) =>
                                        handleSkuChange(e.target.value)
                                    }
                                    placeholder="Ej: LAB-ART-BIO-050"
                                    style={{
                                        width: "250px",
                                        padding: "8px 12px",
                                        fontSize: "14px",
                                        border: "1px solid #ddd",
                                        borderRadius: "4px",
                                        outline: "none",
                                        transition: "border-color 0.2s ease",
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = "#007bff";
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = "#ddd";
                                    }}
                                />
                                {/* Indicador de búsqueda */}
                                {filters.sku.length > 0 &&
                                    filters.sku.length < 3 && (
                                        <small
                                            style={{
                                                color: "#6c757d",
                                                fontSize: "12px",
                                                marginTop: "4px",
                                                display: "block",
                                            }}
                                        >
                                            Ingrese al menos 3 caracteres para
                                            búsqueda completa
                                        </small>
                                    )}
                            </div>
                        </div>
                    </div>
                </div>

                <div style={styles.buttonContainer}>
                    <button
                        type="submit"
                        style={styles.searchButton}
                        title={
                            realTimeSearchEnabled
                                ? "Búsqueda automática activada - Este botón es opcional"
                                : "Buscar manualmente"
                        }
                    >
                        {realTimeSearchEnabled ? "Buscar (Manual)" : "Buscar"}
                    </button>
                    <button
                        type="button"
                        style={styles.resetButton}
                        onClick={handleReset}
                    >
                        Limpiar Filtros
                    </button>
                </div>
            </form>
        </div>
    );
};

export default React.memo(SearchFiltersContainer);
