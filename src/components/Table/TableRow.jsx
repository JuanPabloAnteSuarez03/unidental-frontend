// src/components/Table/TableRow.jsx
import React, { useMemo, useState, useEffect } from "react";
import StockCell from "./StockCell";
import { useAuth } from "../../context/AuthContext";
import inventoryService from "../../services/inventoryService";

const TableRow = ({
    product,
    index,
    formatExpiryDate,
    getExpiryColor,
    isBatchesLoading,
}) => {
    const { authToken } = useAuth();

    // Estado para controlar la expansión de la descripción
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

    // Función para manejar el clic en la descripción
    const handleDescriptionClick = (e) => {
        e.stopPropagation();
        setIsDescriptionExpanded(!isDescriptionExpanded);
    };

    // Función para cerrar la descripción expandida cuando se hace clic fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isDescriptionExpanded) {
                setIsDescriptionExpanded(false);
            }
        };

        if (isDescriptionExpanded) {
            document.addEventListener("click", handleClickOutside);
        }

        return () => {
            document.removeEventListener("click", handleClickOutside);
        };
    }, [isDescriptionExpanded]);

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
            purchasePriceCell: {
                textAlign: "left",
                fontFamily: "monospace",
                fontWeight: "500",
                color: "#dc3545",
            },
            marginCell: {
                textAlign: "center",
                fontWeight: "600",
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
                cursor: "pointer",
                transition: "all 0.3s ease",
                position: "relative",
                borderRadius: "4px",
                padding: "4px 8px",
            },
            descriptionCellExpanded: {
                fontSize: "13px",
                color: "#495057",
                maxWidth: "500px",
                minWidth: "300px",
                overflow: "visible",
                textOverflow: "clip",
                whiteSpace: "normal",
                cursor: "pointer",
                transition: "all 0.3s ease",
                position: "relative",
                backgroundColor: "#ffffff",
                borderRadius: "8px",
                padding: "12px 16px",
                border: "2px solid #007bff",
                boxShadow: "0 4px 12px rgba(0,123,255,0.15)",
                zIndex: 10,
                wordWrap: "break-word",
                lineHeight: "1.4",
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

    // Renderizar precio de compra (latest_purchase_price)
    const renderPurchasePrice = () => {
        const purchasePrice = product.latest_purchase_price;

        if (purchasePrice === null || purchasePrice === undefined) {
            return <span style={{ color: "#6c757d" }}>Cargando...</span>;
        }

        return (
            <span
                style={styles.purchasePriceCell}
                title={`Último precio de compra para ${product.name}`}
            >
                ${Number(purchasePrice).toLocaleString("es-CO")}
            </span>
        );
    };

    // Renderizar el margen de ganancia
    const renderMargin = () => {
        const salePrice = product.sale_price;
        const purchasePrice = product.latest_purchase_price;

        if (
            salePrice === null ||
            salePrice === undefined ||
            purchasePrice === null ||
            purchasePrice === undefined
        ) {
            return <span style={{ color: "#6c757d" }}>N/A</span>;
        }

        const margin = salePrice - purchasePrice;
        const marginColor = margin >= 0 ? "#28a745" : "#dc3545";

        return (
            <span
                style={{ ...styles.marginCell, color: marginColor }}
                title={`Margen de ganancia para ${product.name}`}
            >
                ${Number(margin).toLocaleString("es-CO")}
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
                {renderPurchasePrice()}
            </td>
            <td style={{ ...styles.cell, ...styles.priceCell }}>
                {renderSalePrice()}
            </td>
            <td style={{ ...styles.cell, ...styles.marginCell }}>
                {renderMargin()}
            </td>
            <td
                style={{
                    ...styles.cell,
                    ...(isDescriptionExpanded
                        ? styles.descriptionCellExpanded
                        : styles.descriptionCell),
                }}
                onClick={handleDescriptionClick}
                onMouseEnter={(e) => {
                    if (!isDescriptionExpanded) {
                        e.target.style.backgroundColor = "#f8f9fa";
                        e.target.style.border = "1px solid #dee2e6";
                    }
                }}
                onMouseLeave={(e) => {
                    if (!isDescriptionExpanded) {
                        e.target.style.backgroundColor = "transparent";
                        e.target.style.border = "none";
                    }
                }}
                title={
                    isDescriptionExpanded
                        ? "Hacer clic para contraer"
                        : "Hacer clic para expandir"
                }
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                    }}
                >
                    <span style={{ flex: 1 }}>{desc}</span>
                    <span
                        style={{
                            fontSize: "14px",
                            fontWeight: "bold",
                            color: "#007bff",
                            opacity: isDescriptionExpanded ? 1 : 0.6,
                            transition: "all 0.3s ease",
                            cursor: "pointer",
                            userSelect: "none",
                            minWidth: "16px",
                            textAlign: "center",
                        }}
                    >
                        {isDescriptionExpanded ? "−" : "+"}
                    </span>
                </div>
            </td>
        </tr>
    );
};

export default React.memo(TableRow);
