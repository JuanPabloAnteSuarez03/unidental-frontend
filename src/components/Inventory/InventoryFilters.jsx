import React from "react";
import SearchFiltersContainer from "../SearchFilters/SearchFiltersContainer";

const InventoryFilters = ({
    onSearch,
    onReset,
    nameFilter,
    skuFilter, // ✨ NUEVO: Agregar skuFilter prop
    selectedCategories,
    availableCategories,
    // 🚀 NUEVO: props de sede
    availableLocations = [],
    selectedStockLocation = null,
    setSelectedStockLocation = () => {},
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

            {/* 🚀 NUEVO: Filtro por sede Norte/Sur */}
            <div style={{ marginTop: 12 }}>
                <label
                    htmlFor="location-filter"
                    style={{
                        display: "block",
                        marginBottom: 6,
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#2c3e50",
                    }}
                >
                    Filtrar por sede (stock):
                </label>
                <select
                    id="location-filter"
                    value={selectedStockLocation || ""}
                    onChange={(e) => {
                        const value = e.target.value;
                        setSelectedStockLocation(value ? Number(value) : null);
                    }}
                    style={{
                        padding: "8px 12px",
                        border: "1px solid #dee2e6",
                        borderRadius: 6,
                        minWidth: 240,
                        background: "#fff",
                    }}
                >
                    <option value="">Todas las sedes</option>
                    {availableLocations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                            {loc.name}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default InventoryFilters;
