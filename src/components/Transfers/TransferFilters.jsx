import React from "react";

const TransferFilters = ({
    filters,
    handleFilterChange,
    applyFilters,
    clearFilters,
}) => {
    // Manejar cambio en el campo de búsqueda de productos
    const handleProductSearchChange = (e) => {
        const value = e.target.value;
        // Actualizar el filtro directamente
        handleFilterChange({
            target: {
                name: "producto",
                value: value,
            },
        });
    };

    return (
        <div
            style={{
                backgroundColor: "#fff",
                borderRadius: "12px",
                padding: "24px",
                marginBottom: "24px",
                border: "1px solid #e9ecef",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "24px",
                }}
            >
                <div
                    style={{
                        backgroundColor: "#f8f9fa",
                        borderRadius: "8px",
                        padding: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <span style={{ fontSize: "20px" }}>🔍</span>
                </div>
                <h3
                    style={{
                        fontSize: "20px",
                        fontWeight: "600",
                        margin: "0",
                        color: "#2c3e50",
                    }}
                >
                    Filtros de Búsqueda
                </h3>
            </div>

            {/* Búsqueda de productos */}
            <div style={{ marginBottom: "20px" }}>
                <label
                    htmlFor="productSearch"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        marginBottom: "6px",
                        fontWeight: "500",
                        fontSize: "14px",
                        color: "#495057",
                    }}
                >
                    🔎 Búsqueda de productos:
                </label>
                <input
                    type="text"
                    id="productSearch"
                    placeholder="Buscar producto por nombre, SKU o código..."
                    value={filters.producto || ""}
                    onChange={handleProductSearchChange}
                    style={{
                        width: "100%",
                        padding: "12px 16px",
                        borderRadius: "8px",
                        border: "2px solid #e9ecef",
                        fontSize: "14px",
                        fontWeight: "500",
                        backgroundColor: "#fff",
                        transition: "all 0.2s ease",
                        outline: "none",
                    }}
                    onFocus={(e) => {
                        e.target.style.borderColor = "#2c3e50";
                        e.target.style.boxShadow =
                            "0 0 0 3px rgba(44, 62, 80, 0.1)";
                    }}
                    onBlur={(e) => {
                        e.target.style.borderColor = "#e9ecef";
                        e.target.style.boxShadow = "none";
                    }}
                />
            </div>

            {/* Botones de acción */}
            <div
                style={{
                    display: "flex",
                    gap: "12px",
                    justifyContent: "flex-end",
                    paddingTop: "16px",
                    borderTop: "1px solid #e9ecef",
                }}
            >
                <button
                    onClick={clearFilters}
                    style={{
                        backgroundColor: "#f8f9fa",
                        color: "#6c757d",
                        border: "2px solid #e9ecef",
                        borderRadius: "8px",
                        padding: "10px 20px",
                        fontSize: "14px",
                        cursor: "pointer",
                        fontWeight: "500",
                        transition: "all 0.2s ease",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.backgroundColor = "#e9ecef";
                        e.target.style.borderColor = "#ced4da";
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.backgroundColor = "#f8f9fa";
                        e.target.style.borderColor = "#e9ecef";
                    }}
                >
                    🗑️ Limpiar Filtros
                </button>
                <button
                    onClick={applyFilters}
                    style={{
                        backgroundColor: "#2c3e50",
                        color: "white",
                        border: "2px solid #2c3e50",
                        borderRadius: "8px",
                        padding: "10px 20px",
                        fontSize: "14px",
                        cursor: "pointer",
                        fontWeight: "500",
                        transition: "all 0.2s ease",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.backgroundColor = "#34495e";
                        e.target.style.borderColor = "#34495e";
                        e.target.style.transform = "translateY(-1px)";
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.backgroundColor = "#2c3e50";
                        e.target.style.borderColor = "#2c3e50";
                        e.target.style.transform = "translateY(0)";
                    }}
                >
                    ✅ Aplicar Filtros
                </button>
            </div>
        </div>
    );
};

export default TransferFilters;
