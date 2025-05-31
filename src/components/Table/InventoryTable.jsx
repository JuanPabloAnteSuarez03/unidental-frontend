// src/components/Table/InventoryTable.jsx
import React, { useMemo, useCallback } from "react";
import TableRow from "./TableRow";

// Eliminamos la dependencia en los datos de mock si no es necesaria
// import mockInventoryItems from "../../data/mockInventoryData";

const InventoryTable = ({ products = [], sortConfig, onSort }) => {
    // Función para obtener el icono de ordenamiento (memoizada)
    const getSortIcon = useCallback(
        (columnKey) => {
            if (sortConfig.key !== columnKey) {
                return " ↕️"; // Icono neutral cuando no está ordenado
            }
            return sortConfig.direction === "ascending" ? " ⬆️" : " ⬇️";
        },
        [sortConfig.key, sortConfig.direction]
    );

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
            },
            thead: {
                backgroundColor: "#2c3e50",
                color: "white",
            },
            headerCell: {
                border: "1px solid #34495e",
                padding: "12px",
                fontWeight: "600",
                cursor: "pointer",
                userSelect: "none",
                transition: "background-color 0.2s ease",
                position: "relative",
            },
            headerCellLeft: {
                textAlign: "left",
            },
            headerCellCenter: {
                textAlign: "center",
            },
            headerCellRight: {
                textAlign: "right",
            },
            nonSortableHeader: {
                border: "1px solid #34495e",
                padding: "12px",
                textAlign: "center",
                fontWeight: "600",
            },
        }),
        []
    );

    // Evento de hover para encabezados (memoizado)
    const handleHeaderMouseOver = useCallback((e) => {
        e.target.style.backgroundColor = "#34495e";
    }, []);

    const handleHeaderMouseOut = useCallback((e) => {
        e.target.style.backgroundColor = "transparent";
    }, []);

    // Manejadores de ordenamiento (memoizados)
    const handleSortBySku = useCallback(() => onSort("sku"), [onSort]);
    const handleSortByName = useCallback(() => onSort("name"), [onSort]);
    const handleSortByBrand = useCallback(() => onSort("brand"), [onSort]);
    const handleSortByCategory = useCallback(
        () => onSort("category_name"),
        [onSort]
    );
    const handleSortByStock = useCallback(() => onSort("stock"), [onSort]);
    const handleSortByPurchasePrice = useCallback(
        () => onSort("purchase_price"),
        [onSort]
    );
    const handleSortBySalePrice = useCallback(
        () => onSort("sale_price"),
        [onSort]
    );
    const handleSortByLocation = useCallback(
        () => onSort("location"),
        [onSort]
    );
    const handleSortBySupplier = useCallback(
        () => onSort("supplier"),
        [onSort]
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
                                    ...styles.headerCell,
                                    ...styles.headerCellLeft,
                                }}
                                onClick={handleSortBySku}
                                onMouseOver={handleHeaderMouseOver}
                                onMouseOut={handleHeaderMouseOut}
                                title="Clic para ordenar por código"
                            >
                                Código{getSortIcon("sku")}
                            </th>
                            <th
                                style={{
                                    ...styles.headerCell,
                                    ...styles.headerCellLeft,
                                }}
                                onClick={handleSortByName}
                                onMouseOver={handleHeaderMouseOver}
                                onMouseOut={handleHeaderMouseOut}
                                title="Clic para ordenar por nombre"
                            >
                                Producto{getSortIcon("name")}
                            </th>
                            <th
                                style={{
                                    ...styles.headerCell,
                                    ...styles.headerCellLeft,
                                }}
                                onClick={handleSortByBrand}
                                onMouseOver={handleHeaderMouseOver}
                                onMouseOut={handleHeaderMouseOut}
                                title="Clic para ordenar por marca"
                            >
                                Marca{getSortIcon("brand")}
                            </th>
                            <th
                                style={{
                                    ...styles.headerCell,
                                    ...styles.headerCellLeft,
                                }}
                                onClick={handleSortByCategory}
                                onMouseOver={handleHeaderMouseOver}
                                onMouseOut={handleHeaderMouseOut}
                                title="Clic para ordenar por categoría"
                            >
                                Categoría{getSortIcon("category_name")}
                            </th>
                            <th
                                style={{
                                    ...styles.headerCell,
                                    ...styles.headerCellCenter,
                                }}
                                onClick={handleSortByStock}
                                onMouseOver={handleHeaderMouseOver}
                                onMouseOut={handleHeaderMouseOut}
                                title="Clic para ordenar por stock"
                            >
                                Stock{getSortIcon("stock")}
                            </th>
                            <th
                                style={{
                                    ...styles.headerCell,
                                    ...styles.headerCellRight,
                                }}
                                onClick={handleSortByPurchasePrice}
                                onMouseOver={handleHeaderMouseOver}
                                onMouseOut={handleHeaderMouseOut}
                                title="Clic para ordenar por precio de compra"
                            >
                                P. Compra{getSortIcon("purchase_price")}
                            </th>
                            <th
                                style={{
                                    ...styles.headerCell,
                                    ...styles.headerCellRight,
                                }}
                                onClick={handleSortBySalePrice}
                                onMouseOver={handleHeaderMouseOver}
                                onMouseOut={handleHeaderMouseOut}
                                title="Clic para ordenar por precio de venta"
                            >
                                P. Venta{getSortIcon("sale_price")}
                            </th>
                            <th
                                style={styles.nonSortableHeader}
                                title="Margen calculado (no ordenable)"
                            >
                                Margen
                            </th>
                            <th
                                style={{
                                    ...styles.headerCell,
                                    ...styles.headerCellLeft,
                                }}
                                onClick={handleSortByLocation}
                                onMouseOver={handleHeaderMouseOver}
                                onMouseOut={handleHeaderMouseOut}
                                title="Clic para ordenar por sede"
                            >
                                Sede{getSortIcon("location")}
                            </th>
                            <th
                                style={{
                                    ...styles.headerCell,
                                    ...styles.headerCellLeft,
                                }}
                                onClick={handleSortBySupplier}
                                onMouseOver={handleHeaderMouseOver}
                                onMouseOut={handleHeaderMouseOut}
                                title="Clic para ordenar por proveedor"
                            >
                                Proveedor{getSortIcon("supplier")}
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
