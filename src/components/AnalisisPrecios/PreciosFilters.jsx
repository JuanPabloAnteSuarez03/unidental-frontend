import React from "react";
import CategoryFilter from "../SearchFilters/CategoryFilter";

const PreciosFilters = ({
    searchInput,
    onSearchChange,
    categories,
    selectedCategory,
    onCategoryChange,
    categoriesLoading,
    minPrice,
    maxPrice,
    onMinPriceChange,
    onMaxPriceChange,
}) => {
    return (
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
                <div style={{ position: "relative", width: "100%" }}>
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
                        onChange={(e) => onSearchChange(e.target.value)}
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
                            transition: "border 0.2s, box-shadow 0.2s",
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
                    onChange={onCategoryChange}
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
                            if (/^\d*\.?\d*$/.test(val)) onMinPriceChange(val);
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
                            transition: "border 0.2s, box-shadow 0.2s",
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
                            if (/^\d*\.?\d*$/.test(val)) onMaxPriceChange(val);
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
                            transition: "border 0.2s, box-shadow 0.2s",
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default PreciosFilters;
