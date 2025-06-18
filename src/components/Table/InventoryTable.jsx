// src/components/Table/InventoryTable.jsx
import React, { useMemo } from "react";
import TableRow from "./TableRow";

const InventoryTable = ({
    products = [],
    isLoading = false,
    isStockLoading = false,
}) => {
    // Estilos memoizados para mejorar rendimiento
    const styles = useMemo(
        () => ({
            container: {
                overflowX: "auto",
                marginTop: "15px",
                position: "relative",
                borderRadius: "12px",
                border: "1px solid #e9ecef",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
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
                backgroundColor: "#fff",
                tableLayout: "auto", // Cambiar a auto para mantener tamaño natural
            },
            thead: {
                background: "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)",
                color: "white",
            },
            header: {
                padding: "16px 12px",
                fontWeight: "600",
                fontSize: "14px",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
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
            // ✨ Loading completo para productos iniciales
            fullLoadingContainer: {
                textAlign: "center",
                padding: "50px 20px",
                backgroundColor: "#f8f9fa",
                borderRadius: "12px",
                border: "1px solid #e9ecef",
                marginTop: "15px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
            },
            loadingSpinner: {
                width: "40px",
                height: "40px",
                border: "3px solid #e9ecef",
                borderTop: "3px solid #007bff",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 16px auto",
            },
            loadingText: {
                marginTop: "8px",
                fontWeight: "600",
                color: "#007bff",
                fontSize: "16px",
                marginBottom: "8px",
            },
            loadingSubtext: {
                color: "#6c757d",
                fontSize: "14px",
                margin: 0,
            },
            // ✨ Indicador de carga de stock sobre la tabla - UNIFICADO
            stockLoadingBanner: {
                backgroundColor: "#f8f9fa",
                border: "1px solid #e9ecef",
                borderRadius: "12px",
                padding: "16px 20px",
                marginBottom: "15px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                color: "#007bff",
                fontSize: "16px",
                fontWeight: "600",
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                textAlign: "center",
            },
            stockLoadingSpinner: {
                width: "20px",
                height: "20px",
                border: "2px solid #e9ecef",
                borderTop: "2px solid #007bff",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
            },
        }),
        []
    );

    // Comprobar si hay productos válidos (podrían ser undefined o null)
    const hasProducts = Array.isArray(products) && products.length > 0;

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

            {/* ✨ Loading completo cuando se cargan productos inicialmente */}
            {isLoading && !hasProducts && (
                <div style={styles.fullLoadingContainer}>
                    <div style={styles.loadingSpinner}></div>
                    <div style={styles.loadingText}>
                        Cargando productos del inventario...
                    </div>
                    <p style={styles.loadingSubtext}>
                        Por favor espere mientras obtenemos los datos
                    </p>
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

            {/* ✨ Indicador de carga de stock - UNIFICADO */}
            {isStockLoading && (
                <div style={styles.stockLoadingBanner}>
                    <div style={styles.stockLoadingSpinner}></div>
                    <span>Actualizando información de stock...</span>
                </div>
            )}

            {/* Tabla de productos - se muestra inmediatamente cuando hay productos */}
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
                                P. Compra
                            </th>
                            <th
                                style={{
                                    ...styles.header,
                                    ...styles.headerRight,
                                    ...styles.priceColumn,
                                }}
                            >
                                P. Venta
                            </th>
                            <th
                                style={{
                                    ...styles.header,
                                    ...styles.headerCenter,
                                    ...styles.marginColumn,
                                }}
                            >
                                Margen
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
                        {products.map((product, index) => (
                            <TableRow
                                key={product.id || index}
                                product={product}
                            />
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

// Utilizamos React.memo para evitar renderizados innecesarios
export default React.memo(InventoryTable);
