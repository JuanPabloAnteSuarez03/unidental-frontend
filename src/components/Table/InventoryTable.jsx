// src/components/Table/InventoryTable.jsx
import React, { useMemo } from "react";
import TableRow from "./TableRow";


const InventoryTable = ({ products = [] }) => {
    // Estilos memoizados para mejorar rendimiento
    const styles = useMemo(
        () => ({
            container: {
                overflowX: "auto",
                marginTop: "15px",
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
        }),
        []
    );

    // Comprobar si hay productos válidos (podrían ser undefined o null)
    const hasProducts = Array.isArray(products) && products.length > 0;

    return (
        <div style={styles.container}>
            {/* Mensaje cuando no hay productos */}
            {!hasProducts && (
                <div style={styles.emptyState}>
                    <p style={styles.emptyText}>
                        No se encontraron productos que coincidan con los
                        filtros de búsqueda.
                    </p>
                </div>
            )}

            {/* Tabla de productos */}
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
                        {products.map((item, index) => (
                            <TableRow
                                key={item.id || index}
                                item={item}
                                index={index}
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
