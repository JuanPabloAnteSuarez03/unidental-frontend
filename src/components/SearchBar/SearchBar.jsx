// src/components/SearchBar/SearchBar.jsx
import React, { useMemo, useCallback } from "react";

const SearchBar = ({
    searchText,
    searchCode,
    searchCategory,
    onSearchTextChange,
    onSearchCodeChange,
    onSearchCategoryChange,
    onClearFilters,
    filteredCount,
    totalProducts,
}) => {
    // Memoizamos los estilos para evitar recálculos en cada renderizado
    const styles = useMemo(
        () => ({
            container: {
                backgroundColor: "#f8f9fa",
                padding: "20px",
                borderRadius: "8px",
                marginBottom: "20px",
                border: "1px solid #dee2e6",
            },
            headerContainer: {
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "15px",
            },
            title: {
                margin: 0,
                color: "#2c3e50",
                fontSize: "18px",
                fontWeight: "600",
            },
            countLabel: {
                color: "#6c757d",
                fontSize: "14px",
                fontWeight: "500",
            },
            formGrid: {
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "15px",
                marginBottom: "15px",
            },
            label: {
                display: "block",
                marginBottom: "5px",
                fontSize: "14px",
                fontWeight: "500",
                color: "#495057",
            },
            input: {
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #ced4da",
                borderRadius: "6px",
                fontSize: "14px",
                transition: "border-color 0.2s ease",
                outline: "none",
                boxSizing: "border-box",
            },
            monospaceInput: {
                fontFamily: "monospace",
            },
            buttonContainer: {
                display: "flex",
                justifyContent: "flex-end",
            },
            button: (isActive) => ({
                padding: "8px 16px",
                backgroundColor: isActive ? "#6c757d" : "#e9ecef",
                color: isActive ? "#ffffff" : "#6c757d",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: isActive ? "pointer" : "not-allowed",
                transition: "all 0.2s ease",
            }),
        }),
        []
    );

    // Determinar si hay filtros activos
    const hasActiveFilters = useMemo(
        () => searchText || searchCode || searchCategory,
        [searchText, searchCode, searchCategory]
    );

    // Manejadores de eventos optimizados con useCallback
    const handleTextChange = useCallback(
        (e) => {
            onSearchTextChange(e.target.value);
        },
        [onSearchTextChange]
    );

    const handleCodeChange = useCallback(
        (e) => {
            onSearchCodeChange(e.target.value);
        },
        [onSearchCodeChange]
    );

    const handleCategoryChange = useCallback(
        (e) => {
            onSearchCategoryChange(e.target.value);
        },
        [onSearchCategoryChange]
    );

    const handleInputFocus = useCallback((e) => {
        e.target.style.borderColor = "#007bff";
    }, []);

    const handleInputBlur = useCallback((e) => {
        e.target.style.borderColor = "#ced4da";
    }, []);

    const handleButtonHover = useCallback(
        (e) => {
            if (hasActiveFilters) {
                e.target.style.backgroundColor = "#5a6268";
            }
        },
        [hasActiveFilters]
    );

    const handleButtonLeave = useCallback(
        (e) => {
            if (hasActiveFilters) {
                e.target.style.backgroundColor = "#6c757d";
            }
        },
        [hasActiveFilters]
    );

    return (
        <div style={styles.container}>
            {/* Título y contador */}
            <div style={styles.headerContainer}>
                <h3 style={styles.title}>Buscar Productos</h3>
                <span style={styles.countLabel}>
                    {filteredCount} de {totalProducts} productos
                </span>
            </div>

            {/* Campos de búsqueda */}
            <div style={styles.formGrid}>
                {/* Campo de búsqueda por texto (nombre/marca) */}
                <div>
                    <label style={styles.label}>Nombre o Marca</label>
                    <input
                        type="text"
                        placeholder="Buscar por nombre o marca..."
                        value={searchText}
                        onChange={handleTextChange}
                        style={styles.input}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                    />
                </div>

                {/* Campo de búsqueda por código */}
                <div>
                    <label style={styles.label}>Código de Producto</label>
                    <input
                        type="text"
                        placeholder="Buscar por código..."
                        value={searchCode}
                        onChange={handleCodeChange}
                        style={{ ...styles.input, ...styles.monospaceInput }}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                    />
                </div>

                {/* Campo de búsqueda por categoría */}
                <div>
                    <label style={styles.label}>Categoría</label>
                    <input
                        type="text"
                        placeholder="Buscar por categoría..."
                        value={searchCategory}
                        onChange={handleCategoryChange}
                        style={styles.input}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                    />
                </div>
            </div>

            {/* Botón para limpiar filtros */}
            <div style={styles.buttonContainer}>
                <button
                    onClick={onClearFilters}
                    disabled={!hasActiveFilters}
                    style={styles.button(hasActiveFilters)}
                    onMouseOver={handleButtonHover}
                    onMouseOut={handleButtonLeave}
                >
                    Limpiar Filtros
                </button>
            </div>
        </div>
    );
};

// Utilizamos React.memo para evitar renderizados innecesarios
export default React.memo(SearchBar);
