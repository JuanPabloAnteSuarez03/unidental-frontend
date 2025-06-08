// src/components/Table/InventoryTable.jsx
import React, { useMemo, memo } from "react";
import TableRow from "./TableRow";

const InventoryTable = memo(({ products = [], isLoading = false }) => {
    // Estilos memoizados para mejorar rendimiento
    const styles = useMemo(
        () => ({
            container: {
                overflowX: "auto",
                marginTop: "15px",
                position: "relative",
            },
            emptyState: {
                textAlign: "center",
                padding: "40px 20px",
                backgroundColor: "#f8f9fa",
                borderRadius: "8px",
                border: "1px solid #dee2e6",
            },
            emptyText: {
                color: "#6c757d",
                fontSize: "16px",
                margin: 0,
            },
            table: {
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "1000px",
                tableLayout: "fixed", // Ayuda a distribuir mejor las columnas
            },
            thead: {
                backgroundColor: "#2c3e50",
                color: "white",
            },
            header: {
                border: "1px solid #34495e",
                padding: "12px 8px",
                fontWeight: "600",
                textAlign: "center",
                verticalAlign: "middle",
                height: "50px",
            },
            headerLeft: {
                textAlign: "left",
            },
            headerCenter: {
                textAlign: "center",
            },
            headerRight: {
                textAlign: "right",
            },
            // Definición de anchos específicos para columnas
            skuColumn: { width: "10%" },
            nameColumn: { width: "18%" },
            brandColumn: { width: "10%" },
            categoryColumn: { width: "12%" },
            unitColumn: { width: "7%" },
            stockColumn: { width: "6%" },
            priceColumn: { width: "8%" },
            marginColumn: { width: "8%" },
            supplierColumn: { width: "13%" },
            // Optimized loading overlay - menos opaco para mejor UX
            loadingOverlay: {
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(255, 255, 255, 0.5)", // Menos opaco
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 10,
                borderRadius: "8px",
            },
            loadingSpinner: {
                width: "40px", // Más pequeño
                height: "40px",
                border: "3px solid #f3f3f3",
                borderTop: "3px solid #3498db",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
            },
            loadingText: {
                marginTop: "10px",
                fontWeight: "500", // Menos bold
                color: "#3498db",
                fontSize: "14px", // Más pequeño
            },
            // Nuevo indicador discreto para carga de stock
            stockLoadingIndicator: {
                position: "absolute",
                top: "10px",
                right: "10px",
                backgroundColor: "rgba(52, 152, 219, 0.9)",
                color: "white",
                padding: "5px 10px",
                borderRadius: "15px",
                fontSize: "12px",
                fontWeight: "500",
                zIndex: 20,
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            },
        }),
        []
    );

    // Comprobar si hay productos válidos
    const hasProducts = Array.isArray(products) && products.length > 0;

    // Memoizar la detección de stock cargando
    const isStockLoading = useMemo(() => {
        if (!hasProducts) return false;
        return products.some((product) => product.stock === undefined);
    }, [hasProducts, products]);

    // Estilo para la animación del spinner
    const spinnerKeyframes = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;

    return (
        <div style={styles.container}>
            {/* Estilo para la animación */}
            <style>{spinnerKeyframes}</style>

            {/* Indicador discreto de carga de stock */}
            {isStockLoading && hasProducts && (
                <div style={styles.stockLoadingIndicator}>
                    Actualizando stock...
                </div>
            )}

            {/* Loading Overlay solo para carga inicial */}
            {isLoading && !hasProducts && (
                <div style={styles.loadingOverlay}>
                    <div>
                        <div style={styles.loadingSpinner}></div>
                        <div style={styles.loadingText}>
                            Cargando productos...
                        </div>
                    </div>
                </div>
            )}

            {/* Mensaje cuando no hay productos */}
            {!hasProducts && !isLoading && (
                <div style={styles.emptyState}>
                    <p style={styles.emptyText}>
                        No se encontraron productos que coincidan con los
                        filtros de búsqueda.
                    </p>
                </div>
            )}

            {/* Tabla de productos - Se muestra inmediatamente aunque el stock esté cargando */}
            {hasProducts && (
                <table style={styles.table}>
                    <thead>
                        <tr style={styles.thead}>
                            <th
                                style={{
                                    ...styles.header,
                                    ...styles.headerLeft,
                                    ...styles.skuColumn,
                                }}
                            >
                                SKU
                            </th>
                            <th
                                style={{
                                    ...styles.header,
                                    ...styles.headerLeft,
                                    ...styles.nameColumn,
                                }}
                            >
                                Producto
                            </th>
                            <th
                                style={{
                                    ...styles.header,
                                    ...styles.headerLeft,
                                    ...styles.brandColumn,
                                }}
                            >
                                Marca
                            </th>
                            <th
                                style={{
                                    ...styles.header,
                                    ...styles.headerLeft,
                                    ...styles.categoryColumn,
                                }}
                            >
                                Categoría
                            </th>
                            <th
                                style={{
                                    ...styles.header,
                                    ...styles.headerCenter,
                                    ...styles.unitColumn,
                                }}
                            >
                                U. Medida
                            </th>
                            <th
                                style={{
                                    ...styles.header,
                                    ...styles.headerCenter,
                                    ...styles.stockColumn,
                                }}
                            >
                                Stock
                            </th>
                            <th
                                style={{
                                    ...styles.header,
                                    ...styles.headerRight,
                                    ...styles.priceColumn,
                                }}
                            >
                                Precio Unit.
                            </th>
                            <th
                                style={{
                                    ...styles.header,
                                    ...styles.headerRight,
                                    ...styles.marginColumn,
                                }}
                            >
                                Margen (%)
                            </th>
                            <th
                                style={{
                                    ...styles.header,
                                    ...styles.headerLeft,
                                    ...styles.supplierColumn,
                                }}
                            >
                                Proveedor
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((product) => (
                            <TableRow
                                key={product.id}
                                product={product}
                                isStockLoading={product.stock === undefined}
                            />
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
});

// Añadir displayName para mejor debugging
InventoryTable.displayName = "InventoryTable";

export default InventoryTable;
