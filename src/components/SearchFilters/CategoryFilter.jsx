import React, { useCallback, useMemo } from "react";

const CategoryFilter = ({
    categories = [],
    selectedCategories = [],
    onChange,
    isLoading = false,
}) => {
    // Manejador para seleccionar/deseleccionar una categoría (memoizado)
    const handleCategoryClick = useCallback(
        (categoryId) => {
            let newSelected;

            if (selectedCategories.includes(categoryId)) {
                // Si ya está seleccionada, la deseleccionamos (array vacío)
                newSelected = [];
            } else {
                // Si es una nueva selección, reemplazamos la anterior
                newSelected = [categoryId];
            }

            // Notificamos el cambio
            onChange(newSelected);
        },
        [selectedCategories, onChange]
    );

    // Estilos para el componente (memoizados)
    const styles = useMemo(
        () => ({
            container: {
                width: "100%",
            },
            label: {
                display: "block",
                marginBottom: "8px",
                fontSize: "14px",
                fontWeight: "500",
                color: "#495057",
            },
            categoriesContainer: {
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
                maxHeight: "150px",
                overflowY: "auto",
                padding: "5px 0",
                width: "100%",
            },
            categoryItem: {
                padding: "6px 12px",
                fontSize: "13px",
                border: "1px solid #dee2e6",
                borderRadius: "20px",
                cursor: "pointer",
                backgroundColor: "#fff",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
            },
            categorySelected: {
                backgroundColor: "#2c3e50",
                color: "white",
                borderColor: "#2c3e50",
            },
            loadingText: {
                padding: "8px 0",
                color: "#6c757d",
            },
            noCategories: {
                padding: "8px 0",
                color: "#6c757d",
            },
        }),
        []
    );

    return (
        <div style={styles.container}>
            <label style={styles.label}>Categorías</label>

            {isLoading ? (
                <div style={styles.loadingText}>Cargando categorías...</div>
            ) : categories.length === 0 ? (
                <div style={styles.noCategories}>
                    No hay categorías disponibles
                </div>
            ) : (
                <div style={styles.categoriesContainer}>
                    {categories.map((category) => (
                        <div
                            key={category.id}
                            style={{
                                ...styles.categoryItem,
                                ...(selectedCategories.includes(category.id)
                                    ? styles.categorySelected
                                    : {}),
                            }}
                            onClick={() => handleCategoryClick(category.id)}
                        >
                            {category.name}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default React.memo(CategoryFilter);
