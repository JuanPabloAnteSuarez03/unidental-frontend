import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import inventoryService from "../../services/inventoryService";
import "./StockBranchDetail.css";

const StockBranchDetail = ({
    product,
    stockByLocation = {},
    locations = [],
    isLoading = false,
    isOpen,
    onClose,
}) => {
    if (!isOpen) return null;

    const totalStock = Object.values(stockByLocation).reduce(
        (sum, qty) => sum + (qty || 0),
        0
    );

    return (
        <div className="stock-branch-detail">
            <div className="stock-branch-detail__header">
                <h4>Stock por sede - {product?.name || "Producto"}</h4>
                <button
                    className="stock-branch-detail__close"
                    onClick={onClose}
                >
                    &times;
                </button>
            </div>
            <div className="stock-branch-detail__content">
                {isLoading ? (
                    <div
                        style={{
                            padding: "20px",
                            textAlign: "center",
                            color: "#6c757d",
                        }}
                    >
                        <div
                            style={{
                                width: "20px",
                                height: "20px",
                                border: "2px solid #e9ecef",
                                borderTop: "2px solid #007bff",
                                borderRadius: "50%",
                                animation: "spin 1s linear infinite",
                                margin: "0 auto 10px",
                            }}
                        ></div>
                        Cargando stock por sede...
                    </div>
                ) : locations.length > 0 ? (
                    locations.map((location) => {
                        const stock = stockByLocation[location.id] || 0;
                        return (
                            <div
                                key={location.id}
                                className="stock-branch-detail__item"
                            >
                                <span className="stock-branch-detail__branch-name">
                                    {location.name}
                                </span>
                                <span
                                    className="stock-branch-detail__quantity"
                                    style={{
                                        color:
                                            stock > 0 ? "#28a745" : "#dc3545",
                                        fontWeight: stock > 0 ? "600" : "400",
                                    }}
                                >
                                    {stock}
                                </span>
                            </div>
                        );
                    })
                ) : Object.keys(stockByLocation).length > 0 ? (
                    // Fallback: mostrar stock por ID de ubicación si no tenemos info de ubicaciones
                    Object.entries(stockByLocation).map(
                        ([locationId, quantity]) => (
                            <div
                                key={locationId}
                                className="stock-branch-detail__item"
                            >
                                <span className="stock-branch-detail__branch-name">
                                    Ubicación {locationId}
                                </span>
                                <span
                                    className="stock-branch-detail__quantity"
                                    style={{
                                        color:
                                            quantity > 0
                                                ? "#28a745"
                                                : "#dc3545",
                                        fontWeight:
                                            quantity > 0 ? "600" : "400",
                                    }}
                                >
                                    {quantity}
                                </span>
                            </div>
                        )
                    )
                ) : (
                    <div
                        style={{
                            padding: "20px",
                            textAlign: "center",
                            color: "#6c757d",
                        }}
                    >
                        No se encontró información de stock por sede
                    </div>
                )}

                {!isLoading && (
                    <div className="stock-branch-detail__footer">
                        <span className="stock-branch-detail__total-label">
                            Total
                        </span>
                        <span
                            className="stock-branch-detail__total-quantity"
                            style={{
                                color: totalStock > 0 ? "#28a745" : "#dc3545",
                                fontWeight: "700",
                            }}
                        >
                            {totalStock}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

const StockCell = ({ product }) => {
    const { authToken } = useAuth();
    const [showDetails, setShowDetails] = useState(false);
    const [stockByLocation, setStockByLocation] = useState({});
    const [locations, setLocations] = useState([]);
    const [isLoadingStock, setIsLoadingStock] = useState(false);
    const [isLoadingLocations, setIsLoadingLocations] = useState(false);
    const [error, setError] = useState(null);

    const cellRef = useRef(null);
    const detailRef = useRef(null);
    const tableContainerRef = useRef(null);

    // Calcular stock total desde el producto o desde stockByLocation
    const totalStock =
        product?.stock !== undefined
            ? typeof product.stock === "number"
                ? product.stock
                : parseInt(product.stock, 10) || 0
            : Object.values(stockByLocation).reduce(
                  (sum, qty) => sum + (qty || 0),
                  0
              );

    // Determinar estado del stock
    const isStockLow = totalStock < 10 && totalStock > 0;
    const isStockCritical = totalStock < 5 && totalStock > 0;
    const isOutOfStock = totalStock === 0;

    // Función para ajustar el contenedor cuando se abre/cierra el detalle
    const adjustContainerForDetail = useCallback((isOpening) => {
        if (!cellRef.current) return;

        // Buscar el contenedor de la tabla más preciso
        let tableWrapper = cellRef.current.closest('table')?.parentElement;
        
        if (!tableWrapper) {
            console.log('❌ No se encontró wrapper de tabla');
            return;
        }

        if (isOpening) {
            const cellRect = cellRef.current.getBoundingClientRect();
            const tableWrapperRect = tableWrapper.getBoundingClientRect();
            
            // Calcular espacio disponible y necesario
            const detailHeight = 200; // Altura del detalle expandido (reducida)
            const buffer = 10; // Margen de seguridad (reducido)
            const spaceBelow = tableWrapperRect.bottom - cellRect.bottom;
            const spaceNeeded = detailHeight + buffer;
            
            console.log('📏 Análisis de espacio:', {
                spaceBelow,
                spaceNeeded,
                needsExpansion: spaceBelow < spaceNeeded
            });

            // Verificar si es necesario expandir la tabla
            if (spaceBelow < spaceNeeded) {
                const expansionNeeded = spaceNeeded - spaceBelow;
                
                // Guardar valores originales ANTES de modificar
                const originalPadding = getComputedStyle(tableWrapper).paddingBottom;
                
                // Aplicar la expansión
                const currentPadding = parseInt(originalPadding) || 0;
                const newPadding = currentPadding + expansionNeeded;
                tableWrapper.style.paddingBottom = `${newPadding}px`;
                
                // Guardar información para restaurar después
                tableWrapper.setAttribute('data-original-padding-bottom', originalPadding);
                tableWrapper.setAttribute('data-detail-expanded', 'true');
                tableWrapper.setAttribute('data-expanded-product-id', product?.id || 'unknown');
                
                console.log('🔧 Tabla expandida:', {
                    originalPadding,
                    expansionNeeded,
                    newPadding
                });
                
                // Scroll suave para mostrar el detalle
                setTimeout(() => {
                    if (detailRef.current) {
                        detailRef.current.scrollIntoView({
                            behavior: 'smooth',
                            block: 'nearest',
                            inline: 'nearest'
                        });
                    }
                }, 100);
            } else {
                console.log('✅ Suficiente espacio disponible');
            }
        } else {
            // Restaurar el estado original cuando se cierra
            const wrapperToRestore = tableWrapper.getAttribute('data-detail-expanded') === 'true' 
                ? tableWrapper 
                : document.querySelector(`[data-expanded-product-id="${product?.id || 'unknown'}"]`);
                
            if (wrapperToRestore) {
                const originalPadding = wrapperToRestore.getAttribute('data-original-padding-bottom');
                
                if (originalPadding !== null) {
                    wrapperToRestore.style.paddingBottom = originalPadding;
                }
                
                // Limpiar atributos
                wrapperToRestore.removeAttribute('data-original-padding-bottom');
                wrapperToRestore.removeAttribute('data-detail-expanded');
                wrapperToRestore.removeAttribute('data-expanded-product-id');
                
                console.log('🔄 Estado restaurado:', { originalPadding });
            }
        }
    }, [product?.id]);

    // Cargar ubicaciones
    const loadLocations = useCallback(async () => {
        if (!authToken) {
            console.log("❌ Cannot load locations: missing auth token");
            return;
        }

        console.log("🏪 Loading locations...");
        setIsLoadingLocations(true);
        try {
            const data = await inventoryService.getLocations(authToken);
            console.log("📍 Locations loaded:", {
                locations: data,
                count: data?.length || 0,
                locationsData: data?.map((loc) => ({
                    id: loc.id,
                    name: loc.name,
                })),
            });
            setLocations(data || []);
        } catch (error) {
            console.error("❌ Error loading locations:", error);
            setError("Error al cargar ubicaciones");
        } finally {
            setIsLoadingLocations(false);
        }
    }, [authToken]);

    // Cargar stock por ubicación
    const loadStockByLocation = useCallback(async () => {
        if (!product?.id || !authToken) {
            console.log(
                "❌ Cannot load stock: missing product ID or auth token",
                {
                    productId: product?.id,
                    hasAuthToken: !!authToken,
                }
            );
            return;
        }

        console.log("🔍 Loading stock by location for product:", {
            productId: product.id,
            productName: product.name,
            productSku: product.sku,
        });

        setIsLoadingStock(true);
        setError(null);

        try {
            // Usar getProductStockByLocations que es más confiable
            const stockArray =
                await inventoryService.getProductStockByLocations(
                    product.id,
                    authToken
                );

            console.log("📊 Stock array received:", {
                productId: product.id,
                stockArray,
                dataType: typeof stockArray,
                isArray: Array.isArray(stockArray),
                length: stockArray?.length || 0,
            });

            // Convertir el array a un objeto con locationId como clave
            const stockData = {};
            const locationData = [];
            if (Array.isArray(stockArray)) {
                stockArray.forEach((location) => {
                    if (
                        location.id !== undefined &&
                        location.stock !== undefined
                    ) {
                        stockData[location.id] = location.stock;
                        locationData.push({
                            id: location.id,
                            name: location.name,
                        });
                        console.log(
                            `📍 Location ${location.id} (${location.name}): ${location.stock} units`
                        );
                    }
                });
            }

            console.log("📊 Final stock data object:", stockData);
            console.log("📍 Location data extracted:", locationData);

            // Actualizar tanto el stock como las ubicaciones
            setStockByLocation(stockData);
            setLocations(locationData);
        } catch (error) {
            console.error("❌ Error loading stock by location:", error);
            setError("Error al cargar stock por sede");
            setStockByLocation({});
        } finally {
            setIsLoadingStock(false);
        }
    }, [product?.id, authToken]);

    // Cargar ubicaciones al montar el componente (comentado porque las obtenemos con el stock)
    // useEffect(() => {
    //     loadLocations();
    // }, [loadLocations]);

    // Manejar clics fuera del componente
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                showDetails &&
                cellRef.current &&
                !cellRef.current.contains(event.target) &&
                detailRef.current &&
                !detailRef.current.contains(event.target)
            ) {
                setShowDetails(false);
                // Restaurar el contenedor cuando se cierra por click fuera
                adjustContainerForDetail(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showDetails, adjustContainerForDetail]);

    // Limpiar ajustes del contenedor cuando el componente se desmonta
    useEffect(() => {
        return () => {
            if (showDetails) {
                adjustContainerForDetail(false);
            }
        };
    }, [adjustContainerForDetail, showDetails]);

    const toggleDetails = () => {
        const newShowDetails = !showDetails;
        
        // Si se está abriendo un nuevo detalle, limpiar otros abiertos
        if (newShowDetails) {
            // Cerrar otros detalles abiertos
            const openDetails = document.querySelectorAll('[data-detail-expanded="true"]');
            openDetails.forEach(wrapper => {
                if (wrapper.getAttribute('data-expanded-product-id') !== (product?.id || 'unknown')) {
                    const originalPadding = wrapper.getAttribute('data-original-padding-bottom');
                    
                    if (originalPadding !== null) {
                        wrapper.style.paddingBottom = originalPadding;
                    }
                    
                    wrapper.removeAttribute('data-original-padding-bottom');
                    wrapper.removeAttribute('data-detail-expanded');
                    wrapper.removeAttribute('data-expanded-product-id');
                    
                    console.log('🧹 Limpiado otro detalle abierto');
                }
            });
            
            if (product?.id) {
                // Cargar stock por ubicación cuando se abre el detalle
                loadStockByLocation();
            }
        }
        
        setShowDetails(newShowDetails);
        
        // Ajustar el contenedor después de que el estado se actualice
        setTimeout(() => {
            adjustContainerForDetail(newShowDetails);
        }, 50);
    };

    // Estilos dinámicos basados en el stock
    const getStockColor = () => {
        if (isOutOfStock) return "#dc3545"; // Rojo
        if (isStockCritical) return "#fd7e14"; // Naranja
        if (isStockLow) return "#ffc107"; // Amarillo
        return "#28a745"; // Verde
    };

    const getBackgroundColor = () => {
        if (isOutOfStock) return "#f8d7da";
        if (isStockCritical) return "#fff3cd";
        if (isStockLow) return "#fff3cd";
        return "#d4edda";
    };

    return (
        <div
            className="stock-cell"
            ref={cellRef}
            style={{ position: "relative" }}
        >
            <div
                className="stock-cell__total"
                onClick={toggleDetails}
                style={{
                    color: getStockColor(),
                    backgroundColor: getBackgroundColor(),
                    padding: "4px 8px",
                    borderRadius: "12px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: "40px",
                    transition: "all 0.2s ease",
                    border: `1px solid ${getStockColor()}20`,
                }}
                title={`Stock total: ${totalStock} unidades. Click para ver detalle por sede.`}
                onMouseEnter={(e) => {
                    e.target.style.transform = "scale(1.05)";
                    e.target.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
                }}
                onMouseLeave={(e) => {
                    e.target.style.transform = "scale(1)";
                    e.target.style.boxShadow = "none";
                }}
            >
                <span>{totalStock}</span>
                <i
                    className={`stock-cell__icon ${
                        showDetails ? "expanded" : ""
                    }`}
                    style={{
                        marginLeft: "4px",
                        fontSize: "10px",
                        transition: "transform 0.2s ease",
                        transform: showDetails
                            ? "rotate(180deg)"
                            : "rotate(0deg)",
                    }}
                >
                    ▼
                </i>
            </div>
            <div className="stock-cell__detail-wrapper" ref={detailRef}>
                <StockBranchDetail
                    product={product}
                    stockByLocation={stockByLocation}
                    locations={locations}
                    isLoading={isLoadingStock || isLoadingLocations}
                    isOpen={showDetails}
                    onClose={() => {
                        setShowDetails(false);
                        adjustContainerForDetail(false);
                    }}
                />
            </div>

            {/* CSS para animaciones */}
            <style>
                {`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}
            </style>
        </div>
    );
};

export default StockCell;
