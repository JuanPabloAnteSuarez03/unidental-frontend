// src/components/Table/TableRow.jsx
import React, { useMemo, memo } from "react";

const TableRow = memo(({ product, isStockLoading = false }) => {
    // Extraer información del producto y calcular valores derivados
    const { margen, stockBajo, stockCritico, styles, extractedInfo } =
        useMemo(() => {
            // Calcula el margen basado en los campos del API
            const margenValue =
                product.purchase_price && product.sale_price
                    ? ((product.sale_price - product.purchase_price) /
                          product.purchase_price) *
                      100
                    : 0;

            // Extraer información de proveedor desde description
            let providerName = "";

            // Parsear description para obtener proveedor
            if (product.description) {
                const providerMatch = product.description.match(
                    /Proveedor:\s*([^.]+?)(?=\.|$|\s*Stock)/i
                );
                if (providerMatch && providerMatch[1]) {
                    providerName = providerMatch[1].trim();
                }
            }

            // Determinar niveles de stock
            const rawStock = product.stock !== undefined ? product.stock : 0;
            const totalStock =
                typeof rawStock === "number"
                    ? rawStock
                    : parseInt(rawStock, 10) || 0;

            // Niveles de stock configurables
            const NIVEL_STOCK_BAJO = 10;
            const NIVEL_STOCK_CRITICO = 5;

            const isStockBajo = totalStock < NIVEL_STOCK_BAJO;
            const isStockCritico = totalStock < NIVEL_STOCK_CRITICO;

            // Estilos computados basados en los datos
            const computedStyles = {
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
                    color: isStockLoading
                        ? "#6c757d"
                        : isStockCritico
                        ? "#dc3545"
                        : isStockBajo
                        ? "#fd7e14"
                        : "#28a745",
                    backgroundColor: isStockLoading
                        ? "#f8f9fa"
                        : isStockCritico
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
                    minWidth: "60px",
                    position: "relative",
                },
                stockLoading: {
                    animation: "pulse 1.5s ease-in-out infinite",
                },
                priceCell: {
                    textAlign: "right",
                    fontFamily: "monospace",
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
            };

            return {
                margen: margenValue,
                stockBajo: isStockBajo,
                stockCritico: isStockCritico,
                styles: computedStyles,
                extractedInfo: {
                    proveedor: providerName || product.supplier_name || "",
                    totalStock,
                },
            };
        }, [product, isStockLoading]);

    // Información del proveedor
    const supplierInfo =
        extractedInfo.proveedor ||
        (product.supplier
            ? typeof product.supplier === "object"
                ? product.supplier.name
                : product.supplier
            : "");

    // Determinar el mensaje para el tooltip del stock
    const getStockTooltip = () => {
        if (isStockLoading) {
            return "Cargando información de stock...";
        }
        if (stockCritico) {
            return `Stock crítico (${extractedInfo.totalStock}): Se requiere reposición urgente`;
        } else if (stockBajo) {
            return `Stock bajo (${extractedInfo.totalStock}): Considerar reposición próximamente`;
        }
        return `Stock disponible: ${extractedInfo.totalStock} unidades`;
    };

    // Renderizar información del stock con estado de carga
    const renderStockInfo = () => {
        if (isStockLoading) {
            return (
                <span
                    style={{ ...styles.stockIndicator, ...styles.stockLoading }}
                    title={getStockTooltip()}
                >
                    ...
                </span>
            );
        }

        return (
            <span style={styles.stockIndicator} title={getStockTooltip()}>
                {extractedInfo.totalStock} {stockCritico && "⚠️"}
            </span>
        );
    };

    // Animación CSS para el loading
    const pulseAnimation = `
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
    `;

    return (
        <>
            <style>{pulseAnimation}</style>
            <tr>
                <td style={{ ...styles.cell, ...styles.codeCell }}>
                    {product.sku || "-"}
                </td>
                <td style={{ ...styles.cell, ...styles.nameCell }}>
                    {product.name}
                </td>
                <td style={{ ...styles.cell, ...styles.brandCell }}>
                    {product.brand || "-"}
                </td>
                <td style={styles.cell}>
                    {product.category_name ? (
                        <span style={styles.categoryBadge}>
                            {product.category_name}
                        </span>
                    ) : (
                        "-"
                    )}
                </td>
                <td style={{ ...styles.cell, ...styles.unitCell }}>
                    {product.unit_of_measure || "-"}
                </td>
                <td style={{ ...styles.cell, ...styles.stockCell }}>
                    {renderStockInfo()}
                </td>
                <td style={{ ...styles.cell, ...styles.priceCell }}>
                    {product.sale_price
                        ? `$${product.sale_price.toLocaleString()}`
                        : "-"}
                </td>
                <td style={{ ...styles.cell, ...styles.marginCell }}>
                    <span style={styles.marginValue}>
                        {margen > 0 ? `${margen.toFixed(1)}%` : "-"}
                    </span>
                </td>
                <td style={{ ...styles.cell, ...styles.supplierCell }}>
                    {supplierInfo ? (
                        <span style={styles.supplierBadge}>{supplierInfo}</span>
                    ) : (
                        "-"
                    )}
                </td>
            </tr>
        </>
    );
});

// Añadir displayName para mejor debugging
TableRow.displayName = "TableRow";

export default TableRow;
