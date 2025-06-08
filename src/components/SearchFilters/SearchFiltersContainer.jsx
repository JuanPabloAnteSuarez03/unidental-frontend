// SearchFiltersContainer.jsx

import React, { useState, useEffect } from "react";
import NameSearch from "./NameSearch";
import CategoryFilter from "./CategoryFilter";

const SearchFiltersContainer = ({
    onSearch,
    onReset,
    nameFilter = "",
    selectedCategories = [],
    availableCategories = [],
    isCategoriesLoading = false,
}) => {
    // Estado local para almacenar los valores de los filtros
    const [filters, setFilters] = useState({
        name: nameFilter,
        categories: selectedCategories,
    });

    // Actualizar el estado local cuando cambian los props
    useEffect(() => {
        setFilters((prev) => ({
            ...prev,
            name: nameFilter,
            categories: selectedCategories,
        }));
    }, [nameFilter, selectedCategories]);

    // Manejadores de cambio para los filtros
    const handleNameChange = (value) => {
        setFilters((prev) => ({ ...prev, name: value }));
    };
    const handleCategoriesChange = (categories) => {
        setFilters((prev) => ({ ...prev, categories }));
    };

    // Manejador para la búsqueda
    const handleSearch = (e) => {
        e.preventDefault();
        onSearch(filters);
    };

    // Manejador para el reseteo
    const handleReset = () => {
        setFilters({ name: "", categories: [] });
        onReset();
    };

    // Estilos para el contenedor de filtros
    const styles = {
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
            marginBottom: "20px",
            color: "#495057",
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
            backgroundColor: "#2c3e50",
            color: "white",
            border: "none",
            padding: "8px 16px",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500",
            minWidth: "100px",
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
    };

    return (
        <div style={styles.container}>
            <div style={styles.title}>Búsqueda y Filtros</div>
            <form onSubmit={handleSearch}>
                <div style={styles.form}>
                    {/* Fila para los campos de texto */}
                    <div style={styles.filterRow}>
                        <NameSearch
                            value={filters.name}
                            onChange={handleNameChange}
                        />
                    </div>

                    {/* Fila para las categorías */}
                    <CategoryFilter
                        categories={availableCategories}
                        selectedCategories={filters.categories}
                        onChange={handleCategoriesChange}
                        isLoading={isCategoriesLoading}
                    />
                </div>

                <div style={styles.buttonContainer}>
                    <button type="submit" style={styles.searchButton}>
                        Buscar
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

export default SearchFiltersContainer;
