// src/components/Table/TableRow.jsx
import React, { useMemo } from "react";

const TableRow = ({ item, index }) => {
    // Extraer sede y proveedor de la descripción
    const { margen, stockBajo, stockCritico, styles, supplier, location } =
        useMemo(() => {
            // Extrae proveedor de la descripción
            let extractedSupplier = "";
            if (item.description && item.description.includes("Proveedor:")) {
                const proveedorMatch =
                    item.description.match(/Proveedor: ([^\.]+)/);
                if (proveedorMatch && proveedorMatch[1]) {
                    extractedSupplier = proveedorMatch[1].trim();
                }
            }

            // Extrae información de sede/stock de la descripción
            let extractedLocation = "";
            if (item.description) {
                // Busca patrones como "Stock Sur: 1, Norte: 3"
                if (item.description.includes("Stock")) {
                    // Buscar todas las referencias a stock por sede
                    const stockInfo =
                        item.description.match(/Stock ([^:]+): (\d+)/g);

                    if (stockInfo) {
                        extractedLocation = stockInfo.join(", ");
                    }
                }
            }

            // Calcula el margen basado en los campos del API
            const margenValue =
                item.purchase_price && item.sale_price
                    ? ((item.sale_price - item.purchase_price) /
                          item.purchase_price) *
                      100
                    : 0;

            const isStockBajo = item.stock < 10;
            const isStockCritico = item.stock < 5;

            // Estilos computados basados en los datos
            const computedStyles = {
                row: {
                    backgroundColor: index % 2 === 0 ? "#ffffff" : "#f8f9fa",
                },
                cell: {
                    border: "1px solid #dee2e6",
                    padding: "10px",
                },
                codeCell: {
                    fontFamily: "monospace",
                    fontWeight: "600",
                    color: "#495057",
                },
                nameCell: {
                    fontWeight: "500",
                    color: "#212529",
                },
                brandCell: {
                    color: "#6c757d",
                },
                categoryBadge: {
                    backgroundColor: "#e3f2fd",
                    color: "#1565c0",
                    padding: "4px 8px",
                    borderRadius: "12px",
                    fontSize: "12px",
                    fontWeight: "500",
                },
                stockCell: {
                    textAlign: "center",
                    fontWeight: "600",
                },
                stockIndicator: {
                    color: isStockCritico
                        ? "#dc3545"
                        : isStockBajo
                        ? "#fd7e14"
                        : "#28a745",
                    backgroundColor: isStockCritico
                        ? "#f8d7da"
                        : isStockBajo
                        ? "#fff3cd"
                        : "#d4edda",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontSize: "14px",
                },
                priceCell: {
                    textAlign: "right",
                    fontFamily: "monospace",
                },
                salePriceCell: {
                    fontWeight: "600",
                },
                marginCell: {
                    textAlign: "center",
                    fontWeight: "600",
                },
                marginValue: {
                    color:
                        margenValue > 50
                            ? "#28a745"
                            : margenValue > 25
                            ? "#fd7e14"
                            : "#dc3545",
                },
                locationCell: {
                    fontSize: "14px",
                },
                supplierCell: {
                    fontSize: "14px",
                    color: "#6c757d",
                },
            };

            return {
                margen: margenValue,
                stockBajo: isStockBajo,
                stockCritico: isStockCritico,
                styles: computedStyles,
                supplier: extractedSupplier,
                location: extractedLocation,
            };
        }, [item, index]);

    return (
        <tr style={styles.row}>
            <td style={{ ...styles.cell, ...styles.codeCell }}>{item.sku}</td>
            <td style={{ ...styles.cell, ...styles.nameCell }}>{item.name}</td>
            <td style={{ ...styles.cell, ...styles.brandCell }}>
                {item.brand}
            </td>
            <td style={styles.cell}>
                <span style={styles.categoryBadge}>{item.category_name}</span>
            </td>
            <td style={{ ...styles.cell, ...styles.stockCell }}>
                <span style={styles.stockIndicator}>{item.stock}</span>
            </td>
            <td style={{ ...styles.cell, ...styles.priceCell }}>
                $
                {typeof item.purchase_price === "number"
                    ? item.purchase_price.toFixed(2)
                    : "0.00"}
            </td>
            <td
                style={{
                    ...styles.cell,
                    ...styles.priceCell,
                    ...styles.salePriceCell,
                }}
            >
                $
                {typeof item.sale_price === "number"
                    ? item.sale_price.toFixed(2)
                    : "0.00"}
            </td>
            <td style={{ ...styles.cell, ...styles.marginCell }}>
                <span style={styles.marginValue}>
                    {isNaN(margen) ? "0.0" : margen.toFixed(1)}%
                </span>
            </td>
            <td style={{ ...styles.cell, ...styles.locationCell }}>
                {location}
            </td>
            <td style={{ ...styles.cell, ...styles.supplierCell }}>
                {supplier}
            </td>
        </tr>
    );
};

// Utilizamos React.memo para evitar renderizados innecesarios
export default React.memo(TableRow);
