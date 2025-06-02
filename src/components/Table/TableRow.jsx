// src/components/Table/TableRow.jsx
import React, { useMemo } from "react";

const TableRow = ({ item, index }) => {
    // Extraer información del producto y calcular valores derivados
    const { margen, stockBajo, stockCritico, styles, extractedInfo } =
        useMemo(() => {
            // Calcula el margen basado en los campos del API
            // Asumimos que el precio de compra viene de PurchaseOption.purchase_price
            const margenValue =
                item.purchase_price && item.sale_price
                    ? ((item.sale_price - item.purchase_price) /
                          item.purchase_price) *
                      100
                    : 0;

            // Extraer información de proveedor y stock desde description
            let providerName = "";
            let stockSur = "";
            let stockNorte = "";

            // Parsear description para obtener proveedor y stock
            if (item.description) {
                // Extraer nombre del proveedor
                const providerMatch = item.description.match(
                    /Proveedor:\s*([^.]+?)(?=\.|$|\s*Stock)/i
                );
                if (providerMatch && providerMatch[1]) {
                    providerName = providerMatch[1].trim();
                }

                // Extraer información de stock
                const stockMatch = item.description.match(
                    /Stock Sur:\s*([^,]*),\s*Norte:\s*([^.]*)/i
                );
                if (stockMatch) {
                    stockSur = stockMatch[1].trim();
                    stockNorte = stockMatch[2].trim();
                }
            }

            // Determinar niveles de stock basados en el stock real o el valor del API
            let totalStock = item.stock || 0;

            // Si no hay stock definido en el API pero tenemos información de las sedes
            if (!item.stock && (stockNorte || stockSur)) {
                // Intentar extraer números del stock
                const extractNumber = (str) => {
                    const matches = str.match(/\d+/g);
                    return matches ? parseInt(matches[0], 10) : 0;
                };

                const norteValue = extractNumber(stockNorte);
                const surValue = extractNumber(stockSur);

                totalStock = norteValue + surValue;
            }

            const isStockBajo = totalStock < 10;
            const isStockCritico = totalStock < 5;

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
                unitCell: {
                    textAlign: "center",
                    color: "#6c757d",
                    fontSize: "14px",
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
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: "40px",
                },
                stockDetailBadge: {
                    fontSize: "11px",
                    padding: "2px 5px",
                    borderRadius: "3px",
                    backgroundColor: "#f0f0f0",
                    color: "#555",
                    margin: "2px",
                    display: "inline-block",
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
                supplierCell: {
                    fontSize: "14px",
                    color: "#6c757d",
                },
                supplierBadge: {
                    display: "inline-block",
                    backgroundColor: "#f0f0f0",
                    color: "#555",
                    padding: "3px 8px",
                    borderRadius: "12px",
                    fontSize: "13px",
                    fontWeight: "500",
                },
                barcodeBadge: {
                    display: "inline-block",
                    fontFamily: "monospace",
                    backgroundColor: "#f8f9fa",
                    color: "#495057",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    marginLeft: "5px",
                },
            };

            return {
                margen: margenValue,
                stockBajo: isStockBajo,
                stockCritico: isStockCritico,
                styles: computedStyles,
                extractedInfo: {
                    proveedor: providerName || item.supplier_name || "",
                    stockSur,
                    stockNorte,
                    totalStock,
                },
            };
        }, [item, index]);

    // Si hay información del proveedor, mostrarla (del campo supplier_name o del description)
    const supplierInfo =
        extractedInfo.proveedor ||
        (item.supplier
            ? typeof item.supplier === "object"
                ? item.supplier.name
                : item.supplier
            : "");

    // Determinar el mensaje para el tooltip del stock
    const getStockTooltip = () => {
        if (stockCritico) {
            return "Stock crítico: Se requiere reposición urgente";
        } else if (stockBajo) {
            return "Stock bajo: Considerar reposición próximamente";
        }
        return "Stock disponible";
    };

    // Mostrar stock total o información por sedes
    const renderStockInfo = () => {
        // Si tenemos información detallada de stock por sede
        if (extractedInfo.stockNorte || extractedInfo.stockSur) {
            return (
                <>
                    <span
                        style={styles.stockIndicator}
                        title={getStockTooltip()}
                    >
                        {extractedInfo.totalStock}
                    </span>
                    <div style={{ marginTop: "3px", fontSize: "11px" }}>
                        {extractedInfo.stockNorte && (
                            <span
                                style={styles.stockDetailBadge}
                                title="Stock en sede Norte"
                            >
                                Norte: {extractedInfo.stockNorte}
                            </span>
                        )}
                        {extractedInfo.stockSur && (
                            <span
                                style={styles.stockDetailBadge}
                                title="Stock en sede Sur"
                            >
                                Sur: {extractedInfo.stockSur}
                            </span>
                        )}
                    </div>
                </>
            );
        }

        // Si solo tenemos stock total
        return (
            <span style={styles.stockIndicator} title={getStockTooltip()}>
                {item.stock !== undefined ? item.stock : "N/D"}
            </span>
        );
    };

    return (
        <tr style={styles.row}>
            <td style={{ ...styles.cell, ...styles.codeCell }}>{item.sku}</td>
            <td style={{ ...styles.cell, ...styles.nameCell }}>
                {item.name}
                {item.barcode && (
                    <span style={styles.barcodeBadge} title="Código de barras">
                        {item.barcode}
                    </span>
                )}
            </td>
            <td style={{ ...styles.cell, ...styles.brandCell }}>
                {item.brand}
            </td>
            <td style={styles.cell}>
                <span style={styles.categoryBadge}>{item.category_name}</span>
            </td>
            <td style={{ ...styles.cell, ...styles.unitCell }}>
                {item.unit || "N/A"}
            </td>
            <td style={{ ...styles.cell, ...styles.stockCell }}>
                {renderStockInfo()}
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
            <td style={{ ...styles.cell, ...styles.supplierCell }}>
                {supplierInfo ? (
                    <span
                        style={styles.supplierBadge}
                        title={`Proveedor: ${supplierInfo}`}
                    >
                        {supplierInfo}
                    </span>
                ) : (
                    "No especificado"
                )}
            </td>
        </tr>
    );
};

// Utilizamos React.memo para evitar renderizados innecesarios
export default React.memo(TableRow);
