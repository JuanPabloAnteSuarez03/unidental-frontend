// src/components/Table/TableRow.jsx
import React, { useMemo, useState, useRef } from "react";
import StockByLocationDropdown from "../Inventory/StockByLocationDropdown";

const TableRow = ({ product, index }) => {
    // Estados para el desplegable de stock
    const [showStockDropdown, setShowStockDropdown] = useState(false);
    const stockCellRef = useRef(null);

    // Extraer información del producto y calcular valores derivados
    const { margen, stockBajo, stockCritico, styles, extractedInfo } =
        useMemo(() => {
            // Calcula el margen basado en los campos del API
            // Asumimos que el precio de compra viene de PurchaseOption.purchase_price
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
                // Extraer nombre del proveedor
                const providerMatch = product.description.match(
                    /Proveedor:\s*([^.]+?)(?=\.|$|\s*Stock)/i
                );
                if (providerMatch && providerMatch[1]) {
                    providerName = providerMatch[1].trim();
                }
            }

            // Determinar niveles de stock basados en el stock proporcionado por la API
            // Manejar estados de carga de stock
            const isStockLoading = product.stockLoading === true;
            const rawStock =
                product.stock !== undefined && product.stock !== null
                    ? product.stock
                    : 0;
            const totalStock =
                typeof rawStock === "number"
                    ? rawStock
                    : parseInt(rawStock, 10) || 0;

            console.log(
                `🔍 Product ${product.id}: stock=${product.stock}, stockLoading=${product.stockLoading}, totalStock=${totalStock}`
            );

            // Niveles de stock configurables
            const NIVEL_STOCK_BAJO = 10;
            const NIVEL_STOCK_CRITICO = 5;

            const isStockBajo =
                !isStockLoading && totalStock < NIVEL_STOCK_BAJO;
            const isStockCritico =
                !isStockLoading && totalStock < NIVEL_STOCK_CRITICO;

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
                brandCell: {
                    color: "#495057",
                    fontWeight: "500",
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
                    cursor: "pointer",
                    position: "relative",
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
                    borderRadius: "12px",
                    fontSize: "14px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: "40px",
                    transition: "all 0.2s ease",
                },
                stockIndicatorHover: {
                    transform: "scale(1.05)",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                },
                stockLoadingSkeleton: {
                    backgroundColor: "#f0f0f0",
                    padding: "4px 8px",
                    borderRadius: "12px",
                    fontSize: "14px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: "40px",
                    color: "#999",
                    position: "relative",
                    overflow: "hidden",
                },
                skeletonShimmer: {
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background:
                        "linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)",
                    animation: "shimmer 1.5s infinite",
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
                isStockLoading,
                styles: computedStyles,
                extractedInfo: {
                    proveedor:
                        providerName ||
                        product.supplier_name ||
                        (product.supplier &&
                        typeof product.supplier === "object"
                            ? product.supplier.name
                            : product.supplier) ||
                        "",
                    totalStock,
                },
            };
        }, [product, index]);

    // Si hay información del proveedor, mostrarla (del campo supplier_name o del description)
    const supplierInfo =
        extractedInfo.proveedor ||
        (product.supplier
            ? typeof product.supplier === "object"
                ? product.supplier.name
                : product.supplier
            : "");

    // Determinar el mensaje para el tooltip del stock
    const getStockTooltip = () => {
        if (extractedInfo.isStockLoading) {
            return "Cargando información de stock...";
        }
        if (stockCritico) {
            return `Stock crítico (${extractedInfo.totalStock}): Se requiere reposición urgente (Menos de 5 unidades). Haz clic para ver distribución por sede.`;
        } else if (stockBajo) {
            return `Stock bajo (${extractedInfo.totalStock}): Considerar reposición próximamente (Menos de 10 unidades). Haz clic para ver distribución por sede.`;
        }
        return `Stock disponible: ${extractedInfo.totalStock} unidades. Haz clic para ver distribución por sede.`;
    };

    // Manejar clic en el stock
    const handleStockClick = () => {
        if (!extractedInfo.isStockLoading && product.id) {
            setShowStockDropdown(true);
        }
    };

    // Mostrar stock total con mejores indicadores visuales y skeleton loading
    const renderStockInfo = () => {
        // Skeleton loader mientras se carga el stock
        if (extractedInfo.isStockLoading) {
            return (
                <>
                    <style>
                        {`
                            @keyframes shimmer {
                                0% { transform: translateX(-100%); }
                                100% { transform: translateX(100%); }
                            }
                        `}
                    </style>
                    <span
                        style={styles.stockLoadingSkeleton}
                        title={getStockTooltip()}
                    >
                        <div style={styles.skeletonShimmer}></div>
                        ---
                    </span>
                </>
            );
        }

        const stockLabel = stockCritico ? "CRÍTICO" : stockBajo ? "BAJO" : "OK";

        return (
            <span
                style={{
                    ...styles.stockIndicator,
                    ...(showStockDropdown ? {} : {}),
                    position: "relative",
                }}
                title={getStockTooltip()}
                onClick={handleStockClick}
                onMouseEnter={(e) => {
                    e.target.style.transform = "scale(1.05)";
                    e.target.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
                }}
                onMouseLeave={(e) => {
                    e.target.style.transform = "scale(1)";
                    e.target.style.boxShadow = "none";
                }}
            >
                {extractedInfo.totalStock} {stockCritico && "⚠️"}
                {/* Indicador visual de que es clickeable */}
                <span
                    style={{
                        marginLeft: "4px",
                        fontSize: "10px",
                        opacity: 0.7,
                    }}
                >
                    📊
                </span>
            </span>
        );
    };

    return (
        <>
            <tr style={styles.row}>
                <td style={{ ...styles.cell, ...styles.codeCell }}>
                    {product.sku}
                </td>
                <td style={{ ...styles.cell, ...styles.nameCell }}>
                    {product.name}
                    {product.barcode && (
                        <span
                            style={styles.barcodeBadge}
                            title="Código de barras"
                        >
                            {product.barcode}
                        </span>
                    )}
                </td>
                <td style={{ ...styles.cell, ...styles.brandCell }}>
                    {product.brand}
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
                <td
                    ref={stockCellRef}
                    style={{ ...styles.cell, ...styles.stockCell }}
                >
                    {renderStockInfo()}
                </td>
                <td style={{ ...styles.cell, ...styles.priceCell }}>
                    $
                    {Number(product.purchase_price || 0).toLocaleString(
                        "es-CO"
                    )}
                </td>
                <td
                    style={{
                        ...styles.cell,
                        ...styles.priceCell,
                        ...styles.salePriceCell,
                    }}
                >
                    ${Number(product.sale_price || 0).toLocaleString("es-CO")}
                </td>
                <td style={{ ...styles.cell, ...styles.marginCell }}>
                    <span style={styles.marginValue}>
                        {margen > 0 ? `${margen.toFixed(1)}%` : "N/A"}
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

            {/* Dropdown de stock por sede */}
            <StockByLocationDropdown
                productId={product.id}
                isOpen={showStockDropdown}
                onClose={() => setShowStockDropdown(false)}
                anchorRef={stockCellRef}
                totalStock={extractedInfo.totalStock}
            />
        </>
    );
};

export default React.memo(TableRow);
