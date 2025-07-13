// src/components/Table/TableRow.jsx
import React, { useMemo, useState, useEffect } from "react";
import StockCell from "./StockCell";
import { useInventoryWithBatches } from "../../hooks/useInventoryWithBatches";
import { useAuth } from "../../context/AuthContext";
import inventoryService from "../../services/inventoryService";

const TableRow = ({ product, index }) => {
    const { authToken } = useAuth();

    // Hook para datos de lotes
    const { formatExpiryDate, getExpiryColor, isBatchesLoading } =
        useInventoryWithBatches();

    // Extraer información del producto y calcular valores derivados
    const { styles } = useMemo(() => {
        // Estilos computados basados en los datos
        const computedStyles = {
            row: {
                backgroundColor: index % 2 === 0 ? "#fff" : "#f8f9fa",
                transition: "all 0.2s ease",
            },
            cell: {
                padding: "16px 12px",
                borderBottom: "1px solid #e9ecef",
                fontSize: "14px",
            },
            codeCell: {
                fontFamily: "monospace",
                fontWeight: "500",
                color: "#6c757d",
            },
            nameCell: {
                fontWeight: "600",
                color: "#2c3e50",
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
                color: "#495057",
                fontSize: "14px",
                fontWeight: "500",
            },
            stockCell: {
                textAlign: "center",
                fontWeight: "600",
                position: "relative",
            },
            expiryCell: {
                textAlign: "left",
                fontSize: "13px",
            },
            expiryBadge: {
                display: "inline-block",
                padding: "4px 8px",
                borderRadius: "12px",
                fontSize: "12px",
                fontWeight: "500",
                textAlign: "center",
                minWidth: "100px",
            },
            priceCell: {
                textAlign: "left",
                fontFamily: "monospace",
                fontWeight: "600",
                color: "#28a745",
            },
            loadingCell: {
                color: "#6c757d",
                fontStyle: "italic",
            },
            descriptionCell: {
                fontSize: "13px",
                color: "#6c757d",
                maxWidth: "250px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
            },
        };

        return {
            styles: computedStyles,
        };
    }, [product, index]);

    // Renderizar información de vencimiento
    const renderExpiryInfo = () => {
        if (isBatchesLoading) {
            return <span style={styles.loadingCell}>Cargando...</span>;
        }

        const expiryText = formatExpiryDate(product.id);

        // Si no hay información de vencimiento, dejar en blanco
        if (!expiryText || expiryText === "N/A") {
            return <span style={{ color: "#6c757d" }}>-</span>;
        }

        const expiryColor = getExpiryColor(product.id);

        return (
            <span
                style={{
                    ...styles.expiryBadge,
                    backgroundColor: expiryColor + "20",
                    color: expiryColor,
                    border: `1px solid ${expiryColor}`,
                }}
                title={`Próximo vencimiento del producto ${product.name}`}
            >
                {expiryText}
            </span>
        );
    };

    // Renderizar precio de venta (sale_price)
    const renderSalePrice = () => {
        const salePrice = product.sale_price;

        if (!salePrice || salePrice === 0) {
            return <span style={{ color: "#6c757d" }}>Sin precio</span>;
        }

        return (
            <span
                style={styles.priceCell}
                title={`Precio de venta del producto ${product.name}`}
            >
                ${Number(salePrice).toLocaleString("es-CO")}
            </span>
        );
    };

    // Obtener la descripción del producto usando el primer campo disponible
    const desc =
        product.description ||
        product.detalle ||
        product.details ||
        product.notes ||
        "Sin descripción";

    return (
        <tr style={styles.row}>
            <td style={{ ...styles.cell, ...styles.codeCell }}>
                {product.sku}
            </td>
            <td style={{ ...styles.cell, ...styles.nameCell }}>
                {product.name}
            </td>
            <td style={styles.cell}>
                <span style={styles.categoryBadge}>
                    {product.category_name ||
                        product.category ||
                        "Sin categoría"}
                </span>
            </td>
            <td style={{ ...styles.cell, ...styles.unitCell }}>
                {product.unit_of_measure ||
                    product.unit ||
                    product.unit_name ||
                    "N/A"}
            </td>
            <td style={{ ...styles.cell, ...styles.stockCell }}>
                {/* StockCell con funcionalidad de sedes */}
                <StockCell product={product} />
            </td>
            <td style={{ ...styles.cell, ...styles.expiryCell }}>
                {renderExpiryInfo()}
            </td>
            <td style={{ ...styles.cell, ...styles.priceCell }}>
                {renderSalePrice()}
            </td>
            <td
                style={{ ...styles.cell, ...styles.descriptionCell }}
                title={desc}
            >
                {desc}
            </td>
        </tr>
    );
};

export default React.memo(TableRow);
