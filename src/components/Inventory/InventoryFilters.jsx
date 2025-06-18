import React from "react";
import SearchFiltersContainer from "../SearchFilters/SearchFiltersContainer";

const InventoryFilters = ({
    onSearch,
    onReset,
    nameFilter,
    skuFilter, // ✨ NUEVO: Agregar skuFilter prop
    selectedCategories,
    availableCategories,
}) => {
    return (
        <div
            className="inventory-card"
            style={{
                backgroundColor: "white",
                borderRadius: "12px",
                padding: "25px",
                marginBottom: "20px",
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                border: "1px solid #e9ecef",
            }}
        >
            <div
                className="inventory-section-header"
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "20px",
                }}
            >
                <div
                    style={{
                        width: "3px",
                        height: "24px",
                        backgroundColor: "#28a745",
                        borderRadius: "2px",
                    }}
                />
                <h3
                    className="inventory-section-title"
                    style={{
                        color: "#2c3e50",
                        fontSize: "18px",
                        fontWeight: "600",
                        margin: 0,
                    }}
                >
                    Filtros de Búsqueda
                </h3>
            </div>
            <SearchFiltersContainer
                onSearch={onSearch}
                onReset={onReset}
                nameFilter={nameFilter}
                skuFilter={skuFilter} // ✨ NUEVO: Pasar skuFilter al contenedor
                selectedCategories={selectedCategories}
                availableCategories={availableCategories}
                isCategoriesLoading={false}
            />
        </div>
    );
};

export default InventoryFilters;
