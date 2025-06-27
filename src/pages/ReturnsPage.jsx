import React, { useState, useCallback, useEffect, useMemo } from "react";
import { returnsService } from "../services/returnsService";
import { useAuth } from "../context/AuthContext";
import { FaHistory, FaUndo, FaFileInvoiceDollar } from "react-icons/fa";

const ReturnsPage = () => {
    const { authToken } = useAuth();
    
    // Search and selection states
    const [searchTerm, setSearchTerm] = useState("");
    const [allSales, setAllSales] = useState([]);
    const [filteredSales, setFilteredSales] = useState([]);
    const [isLoadingSales, setIsLoadingSales] = useState(false);
    const [selectedSale, setSelectedSale] = useState(null);
    const [saleDetails, setSaleDetails] = useState(null);
    const [isLoadingSale, setIsLoadingSale] = useState(false);
    
    // Return process states
    const [returnItems, setReturnItems] = useState([]);
    const [returnReason, setReturnReason] = useState("");
    const [returnNotes, setReturnNotes] = useState("");
    const [isProcessingReturn, setIsProcessingReturn] = useState(false);
    
    // History states
    const [returnHistory, setReturnHistory] = useState([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    
    // Error states
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Calculate return totals
    const returnTotals = useMemo(() => {
        const totalAmount = returnItems.reduce((sum, item) => {
            return sum + (item.return_quantity * parseFloat(item.unit_price));
        }, 0);
        
        return { totalAmount };
    }, [returnItems]);

    const adjustedTotal = useMemo(() => {
        if (!saleDetails) return 0;
        const originalTotal = parseFloat(saleDetails.total_gross || saleDetails.total_net || saleDetails.total || 0);
        return originalTotal - returnTotals.totalAmount;
    }, [saleDetails, returnTotals.totalAmount]);

    const reasonTranslations = {
        defective: "Producto defectuoso",
        wrong_item: "Producto incorrecto",
        customer_change: "Cambio de opinión",
        damaged: "Producto dañado",
        expired: "Producto vencido",
        other: "Otro",
    };

    // Load all sales on component mount
    const loadAllSales = useCallback(async () => {
        if (!authToken) return;
        
        setIsLoadingSales(true);
        setError(null);
        
        try {
            const results = await returnsService.searchSalesForReturns({
                ordering: '-sale_date'
            }, authToken);
            
            setAllSales(results.results || []);
            setFilteredSales(results.results || []);
        } catch (error) {
            console.error("Error loading sales:", error);
            setError("Error al cargar ventas: " + error.message);
            setAllSales([]);
            setFilteredSales([]);
        } finally {
            setIsLoadingSales(false);
        }
    }, [authToken]);

    // Filter sales based on search term
    const filterSales = useCallback((term) => {
        if (!term.trim()) {
            setFilteredSales(allSales);
            return;
        }

        const searchLower = term.toLowerCase().trim();
        const filtered = allSales.filter(sale => {
            const saleId = sale.id?.toString() || "";
            const customerName = sale.customer_details?.name?.toLowerCase() || "";
            const customerPhone = sale.customer_details?.phone || "";
            const locationName = sale.location_details?.name?.toLowerCase() || "";
            
            return saleId.includes(searchLower) ||
                   customerName.includes(searchLower) ||
                   customerPhone.includes(searchLower) ||
                   locationName.includes(searchLower);
        });

        setFilteredSales(filtered);
    }, [allSales]);

    // Select sale for return
    const handleSelectSale = useCallback(async (sale) => {
        // Reset previous return state before fetching new data
        setReturnItems([]);
        setReturnReason("");
        setReturnNotes("");
        setSuccess(null);
        setError(null);

        setSelectedSale(sale);
        setIsLoadingSale(true);
        
        try {
            // Fetch sale details and a list of its associated returns
            const [saleDetails, returnHistoryList] = await Promise.all([
                returnsService.getSaleForReturn(sale.id, authToken),
                returnsService.getReturnHistory({ original_sale: sale.id }, authToken)
            ]);

            // Now, fetch the full details for each return to get the items
            const detailedReturns = await Promise.all(
                (returnHistoryList.results || []).map(ret => 
                    returnsService.getReturnDetails(ret.id, authToken)
                )
            );
            
            setSaleDetails(saleDetails);

            // Create a map of returned quantities using the detailed returns
            const returnedQuantitiesMap = {};
            detailedReturns.forEach(ret => {
                (ret.items || []).forEach(returnItem => {
                    const saleItemId = returnItem.sale_item;
                    if (saleItemId) {
                        returnedQuantitiesMap[saleItemId] = (returnedQuantitiesMap[saleItemId] || 0) + returnItem.quantity_returned;
                    }
                });
            });

            // Initialize return items, adjusting for previous returns
            const initialReturnItems = (saleDetails.items || []).map(item => {
                const alreadyReturned = returnedQuantitiesMap[item.id] || 0;
                const remainingQuantity = item.quantity - alreadyReturned;

                return {
                    ...item,
                    sale_item_id: item.id,
                    return_quantity: 0,
                    max_quantity: remainingQuantity, // Correct max quantity
                    original_quantity: item.quantity, // Keep original for display
                    already_returned: alreadyReturned // Keep for display
                };
            });
            
            setReturnItems(initialReturnItems);

        } catch (error) {
            console.error("Error loading sale details:", error);
            setError("Error al cargar detalles de la venta: " + error.message);
        } finally {
            setIsLoadingSale(false);
        }
    }, [authToken]);

    // Update return quantity for an item
    const handleUpdateReturnQuantity = useCallback((index, quantity) => {
        setReturnItems(prev => {
            const updated = [...prev];
            const maxQuantity = updated[index].max_quantity;
            updated[index].return_quantity = Math.max(0, Math.min(quantity, maxQuantity));
            return updated;
        });
    }, []);

    // Process return
    const handleProcessReturn = useCallback(async () => {
        if (!selectedSale || !authToken) return;
        
        const itemsToReturn = returnItems.filter(item => item.return_quantity > 0);
        
        if (itemsToReturn.length === 0) {
            setError("Debe seleccionar al menos un producto para devolver");
            return;
        }
        
        if (!returnReason.trim()) {
            setError("Debe especificar el motivo de la devolución");
            return;
        }
        
        setIsProcessingReturn(true);
        setError(null);
        setSuccess(null);
        
        try {
            const returnData = {
                original_sale: selectedSale.id,
                location: selectedSale.location,
                reason: returnReason,
                notes: returnNotes,
                items: itemsToReturn.map(item => ({
                    sale_item: item.id,
                    product: item.product,
                    quantity_returned: item.return_quantity,
                    unit_price: item.unit_price
                }))
            };
            
            const result = await returnsService.createReturn(returnData, authToken);
            
            setSuccess(`Devolución #${result.id} creada exitosamente. El inventario ha sido actualizado.`);

            // Forzar la recarga de datos para reflejar los cambios
            await loadAllSales(); // Recarga la lista de ventas de la izquierda (para el total)
            await handleSelectSale(selectedSale); // Recarga los detalles de la venta de la derecha

            // Limpiar solo los campos del formulario de devolución
            setReturnReason("");
            setReturnNotes("");
            
        } catch (error) {
            console.error("Error processing return:", error);
            setError(`Error al procesar la devolución: ${error.message}`);
        } finally {
            setIsProcessingReturn(false);
        }
    }, [selectedSale, returnItems, returnReason, returnNotes, authToken, loadAllSales, handleSelectSale]);

    // Load return history
    const loadReturnHistory = useCallback(async () => {
        if (!authToken) return;
        
        setIsLoadingHistory(true);
        setError(null);
        
        try {
            // 1. Obtener la lista básica de devoluciones
            const historyList = await returnsService.getReturnHistory({}, authToken);
            
            // 2. Obtener los detalles completos para cada devolución
            const detailedHistory = await Promise.all(
                (historyList.results || []).map(ret => 
                    returnsService.getReturnDetails(ret.id, authToken)
                )
            );
            
            // 3. Actualizar el estado con los datos detallados
            setReturnHistory(detailedHistory);

        } catch (error) {
            console.error("Error loading return history:", error);
            setError("Error al cargar historial de devoluciones: " + error.message);
        } finally {
            setIsLoadingHistory(false);
        }
    }, [authToken]);

    // Format date
    const formatDate = (dateString, customOptions) => {
        if (!dateString) return "Fecha no disponible";
        const defaultOptions = {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
        };
        const options = customOptions || defaultOptions;
        try {
            return new Date(dateString).toLocaleDateString('es-ES', options);
        } catch (error) {
            console.error("Error formatting date:", dateString, error);
            return "Fecha inválida";
        }
    };

    const formatCurrency = (amount) => {
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount)) {
            return '$0';
        }
        return `$${numericAmount.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    // Load sales on component mount
    useEffect(() => {
        loadAllSales();
    }, [loadAllSales]);

    // Filter sales when search term changes
    useEffect(() => {
        filterSales(searchTerm);
    }, [searchTerm, filterSales]);

    return (
        <div
            style={{
                padding: "20px",
                maxWidth: "1400px",
                margin: "0 auto",
                fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                backgroundColor: "#f8f9fa",
                minHeight: "calc(100vh - 140px)",
            }}
        >
            {/* Header */}
            <div
                style={{
                    marginBottom: "30px",
                    borderBottom: "2px solid #eee",
                    paddingBottom: "15px",
                    backgroundColor: "white",
                    padding: "20px",
                    borderRadius: "8px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <h1
                            style={{
                                color: "#2c3e50",
                                fontSize: "28px",
                                fontWeight: "700",
                                margin: "0 0 8px 0",
                            }}
                        >
                            Gestión de Devoluciones
                        </h1>
                        <p
                            style={{
                                color: "#6c757d",
                                fontSize: "16px",
                                margin: 0,
                            }}
                        >
                            Procese devoluciones y reembolsos de productos vendidos
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setShowHistory(!showHistory);
                            if (!showHistory && returnHistory.length === 0) {
                                loadReturnHistory();
                            }
                        }}
                        style={{
                            padding: "10px 20px",
                            backgroundColor: "#6c757d",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "14px",
                            fontWeight: "500",
                            cursor: "pointer",
                            transition: "background-color 0.2s ease",
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = "#5a6268"}
                        onMouseLeave={(e) => e.target.style.backgroundColor = "#6c757d"}
                    >
                        {showHistory ? "Ocultar Historial" : "Ver Historial"}
                    </button>
                </div>
            </div>

            {/* Error/Success Messages */}
            {error && (
                <div
                    style={{
                        marginBottom: "20px",
                        padding: "12px 16px",
                        backgroundColor: "#f8d7da",
                        border: "1px solid #f5c6cb",
                        borderRadius: "6px",
                        color: "#721c24",
                        fontSize: "14px",
                    }}
                >
                    {error}
                </div>
            )}

            {success && (
                <div
                    style={{
                        marginBottom: "20px",
                        padding: "12px 16px",
                        backgroundColor: "#d4edda",
                        border: "1px solid #c3e6cb",
                        borderRadius: "6px",
                        color: "#155724",
                        fontSize: "14px",
                    }}
                >
                    {success}
                </div>
            )}

            {/* Main Content */}
            {!showHistory ? (
                <div style={{ display: "grid", gridTemplateColumns: selectedSale ? "1fr 1fr" : "1fr", gap: "20px" }}>
                    {/* Left Column - Search and Selection */}
                    <div>
                        {/* Search Section */}
                        <div
                            style={{
                                backgroundColor: "white",
                                borderRadius: "8px",
                                padding: "20px",
                                marginBottom: "20px",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                                border: "1px solid #dee2e6",
                            }}
                        >
                            <h3
                                style={{
                                    color: "#2c3e50",
                                    fontSize: "18px",
                                    fontWeight: "600",
                                    margin: "0 0 15px 0",
                                }}
                            >
                                Buscar Venta
                            </h3>
                            <div style={{ marginBottom: "15px" }}>
                                <input
                                    type="text"
                                    placeholder="Filtrar por ID de venta, cliente, teléfono o sede..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    disabled={isLoadingSales}
                                    style={{
                                        width: "100%",
                                        padding: "10px",
                                        border: "1px solid #dee2e6",
                                        borderRadius: "4px",
                                        fontSize: "14px",
                                        backgroundColor: isLoadingSales ? "#f8f9fa" : "white",
                                        boxSizing: "border-box",
                                    }}
                                />
                                {searchTerm && (
                                    <div style={{ 
                                        marginTop: "8px", 
                                        fontSize: "12px", 
                                        color: "#6c757d",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center"
                                    }}>
                                        <span>
                                            Mostrando {filteredSales.length} de {allSales.length} ventas
                                        </span>
                                        <button
                                            onClick={() => setSearchTerm("")}
                                            style={{
                                                background: "none",
                                                border: "none",
                                                color: "#007bff",
                                                cursor: "pointer",
                                                fontSize: "12px",
                                                textDecoration: "underline"
                                            }}
                                        >
                                            Limpiar filtro
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Loading state */}
                            {isLoadingSales && (
                                <div style={{ 
                                    padding: "20px", 
                                    textAlign: "center", 
                                    color: "#6c757d",
                                    backgroundColor: "#f8f9fa",
                                    borderRadius: "6px",
                                    border: "1px solid #dee2e6"
                                }}>
                                    <div style={{ marginBottom: "10px" }}>⏳ Cargando ventas...</div>
                                    <div style={{ fontSize: "12px" }}>Esto puede tomar unos segundos</div>
                                </div>
                            )}

                            {/* Sales List */}
                            {!isLoadingSales && (
                                <div>
                                    <h4 style={{ margin: "0 0 10px 0", fontSize: "16px", color: "#2c3e50" }}>
                                        {searchTerm ? `Ventas filtradas (${filteredSales.length})` : `Todas las ventas (${allSales.length})`}
                                    </h4>
                                    {filteredSales.length > 0 ? (
                                        <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                                            {filteredSales.map((sale) => (
                                            <div
                                                key={sale.id}
                                                style={{
                                                    padding: "12px",
                                                    border: "1px solid #dee2e6",
                                                    borderRadius: "4px",
                                                    marginBottom: "8px",
                                                    cursor: "pointer",
                                                    backgroundColor: selectedSale?.id === sale.id ? "#e8f4fd" : "white",
                                                    transition: "background-color 0.2s ease",
                                                }}
                                                onClick={() => handleSelectSale(sale)}
                                            >
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                    <div>
                                                        <div style={{ fontWeight: "600", color: "#2c3e50" }}>
                                                            Venta #{sale.id}
                                                        </div>
                                                        <div style={{ fontSize: "12px", color: "#6c757d" }}>
                                                            Cliente: {sale.customer_details?.name || "N/A"}
                                                        </div>
                                                        <div style={{ fontSize: "12px", color: "#6c757d" }}>
                                                            {formatDate(sale.sale_date || sale.created_at)}
                                                        </div>
                                                    </div>
                                                    <div style={{ textAlign: "right" }}>
                                                        <div style={{ fontWeight: "600", color: "#27ae60" }}>
                                                            {formatCurrency(parseFloat(sale.total_gross || sale.total_net || sale.total || 0))}
                                                        </div>
                                                        <div style={{ fontSize: "12px", color: "#6c757d" }}>
                                                            {sale.sale_type}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ 
                                            padding: "20px", 
                                            textAlign: "center", 
                                            color: "#6c757d",
                                            backgroundColor: "#f8f9fa",
                                            borderRadius: "6px",
                                            border: "1px solid #dee2e6"
                                        }}>
                                            {searchTerm ? 
                                                `No se encontraron ventas que coincidan con "${searchTerm}"` : 
                                                "No hay ventas registradas"
                                            }
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Return Processing */}
                    {selectedSale && (
                        <div>
                            {/* Sale Details */}
                            <div
                                style={{
                                    backgroundColor: "white",
                                    borderRadius: "8px",
                                    padding: "20px",
                                    marginBottom: "20px",
                                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                                    border: "1px solid #dee2e6",
                                }}
                            >
                                <h3
                                    style={{
                                        color: "#2c3e50",
                                        fontSize: "18px",
                                        fontWeight: "600",
                                        margin: "0 0 15px 0",
                                    }}
                                >
                                    Detalles de la Venta #{selectedSale.id}
                                </h3>

                                {isLoadingSale ? (
                                    <div style={{ textAlign: "center", padding: "20px", color: "#6c757d" }}>
                                        Cargando detalles...
                                    </div>
                                ) : saleDetails ? (
                                    <div>
                                        {/* Sale Info */}
                                        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Detalles de la Venta #{selectedSale.id}</h3>
                                            <div className="flex justify-between items-start">
                                                <div className="text-sm space-y-1">
                                                    <div><strong>Cliente:</strong> {saleDetails.customer_details?.name || "N/A"}</div>
                                                    <div><strong>Sede:</strong> {saleDetails.location_details?.name}</div>
                                                <div><strong>Fecha:</strong> {formatDate(saleDetails.sale_date || saleDetails.created_at)}</div>
                                                </div>
                                                <div className="text-right text-sm space-y-1">
                                                    <div>
                                                        <strong>Total Original:</strong> {formatCurrency(parseFloat(saleDetails.total_gross || saleDetails.total_net || saleDetails.total || 0))}
                                                    </div>
                                                    <div className="text-red-600 font-semibold">
                                                        <strong>Monto a Devolver:</strong> -{formatCurrency(returnTotals.totalAmount)}
                                                    </div>
                                                    <div className="border-t mt-2 pt-2 font-bold text-base">
                                                        <strong>Total Ajustado:</strong> {formatCurrency(adjustedTotal)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Formulario de Devolución */}
                                        <h4 style={{ margin: "0 0 10px 0", fontSize: "16px", color: "#2c3e50" }}>
                                            Productos a devolver:
                                        </h4>
                                        <div className="bg-white p-6 rounded-lg shadow-md">
                                            <div className="md:col-span-2">
                                                <h4 className="text-xl font-semibold text-gray-800 mb-4">Productos a devolver:</h4>
                                                {isLoadingSale ? (
                                                    <p>Cargando detalles...</p>
                                                ) : (
                                                    <div className="space-y-4">
                                            {returnItems.map((item, index) => (
                                                <div
                                                                key={`${item.id}-${item.batch_details?.id || index}`}
                                                                className="p-4 border rounded-md bg-gray-50 shadow-sm transition-colors duration-150"
                                                            >
                                                                {/* Top section with product info and quantity */}
                                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                                                                    {/* Columna de Información del Producto */}
                                                                    <div className="md:col-span-2">
                                                                        <p className="font-semibold text-lg text-gray-800">
                                                                            {item.product_details?.name || "Producto no disponible"}
                                                                        </p>
                                                                        
                                                                        {item.batch_details && (
                                                                            <div className="mt-2 inline-block bg-blue-100 text-blue-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">
                                                                                Lote: {item.batch_details.batch_number} | Vence: {formatDate(item.batch_details.expiry_date, { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })}
                                                                            </div>
                                                                        )}

                                                                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500 mt-3">
                                                                            <div>
                                                                                <span className="font-semibold text-gray-700">SKU:</span>
                                                                                <span className="ml-1 text-gray-600">{item.product_details?.sku || "N/A"}</span>
                                                                            </div>
                                                                            <div>
                                                                                <span className="font-semibold text-gray-700">Precio:</span>
                                                                                <span className="ml-1 text-gray-600">{formatCurrency(parseFloat(item.unit_price))}</span>
                                                                            </div>
                                                                            <div>
                                                                                <span className="font-semibold text-gray-700">Vendidos:</span>
                                                                                <span className="ml-1 text-gray-600">{item.original_quantity}</span>
                                                            </div>
                                                                            <div>
                                                                                <span className="font-semibold text-gray-700">Devueltos:</span>
                                                                                <span className="ml-1 text-gray-600">{item.already_returned}</span>
                                                            </div>
                                                            </div>
                                                        </div>

                                                                    {/* Columna de Cantidad a Devolver */}
                                                                    <div className="flex items-center justify-start md:justify-end space-x-3">
                                                                        <label htmlFor={`return-qty-${item.id}-${item.batch_details?.id || index}`} className="text-sm font-medium text-gray-700 whitespace-nowrap">
                                                                Cantidad a devolver:
                                                            </label>
                                                            <input
                                                                type="number"
                                                                            id={`return-qty-${item.id}-${item.batch_details?.id || index}`}
                                                                            className="w-24 p-2 border border-gray-300 rounded-md text-center focus:ring-blue-500 focus:border-blue-500 transition"
                                                                            value={item.return_quantity}
                                                                            onChange={(e) => handleUpdateReturnQuantity(index, parseInt(e.target.value, 10) || 0)}
                                                                min="0"
                                                                max={item.max_quantity}
                                                                            aria-label={`Cantidad a devolver para ${item.product_details?.name}`}
                                                            />
                                                        </div>
                                                                </div>

                                                                {/* --- START: Inventory Impact Feedback --- */}
                                                                <div className="mt-4 pt-3 border-t border-dashed border-gray-300">
                                                                    {item.return_quantity > 0 ? (
                                                                        <div>
                                                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Impacto en inventario</p>
                                                                            <div className="space-y-2">
                                                                                {item.product_details?.product_type === 'composite' ? (
                                                                                    <>
                                                                                        <div className="flex items-center text-sm text-green-800 bg-green-100 p-2 rounded-md">
                                                                                            <span className="font-bold mr-2">Kit:</span>
                                                                                            <span>Se restaurarán <strong>{item.return_quantity}</strong> ud(s) de <strong>{item.product_details.name}</strong>.</span>
                                                                                        </div>
                                                                                        {item.product_details.components?.map(comp => (
                                                                                            <div key={comp.component_product.id} className="flex items-center text-sm text-blue-800 bg-blue-100 p-2 rounded-md ml-4">
                                                                                                <span className="font-bold mr-2">Componente:</span>
                                                                                                <span>Se restaurarán <strong>{item.return_quantity * comp.quantity}</strong> ud(s) de <strong>{comp.component_product.name}</strong>.</span>
                                                                                            </div>
                                                                                        ))}
                                                                                    </>
                                                                                ) : (
                                                                                    <div className="flex items-center text-sm text-green-800 bg-green-100 p-2 rounded-md">
                                                                                        <span className="font-bold mr-2">Producto:</span>
                                                                                        <span>Se restaurarán <strong>{item.return_quantity}</strong> ud(s) al lote original.</span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <p className="text-xs text-center text-gray-400 italic py-2">Ajuste la cantidad para ver el impacto en el inventario.</p>
                                                                    )}
                                                                </div>
                                                                {/* --- END: Inventory Impact Feedback --- */}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                </div>
                                        </div>

                                        {/* Return Details */}
                                        <div className="mt-6">
                                            <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#2c3e50", marginBottom: "8px" }}>
                                                Motivo de la devolución:
                                            </label>
                                            <select
                                                value={returnReason}
                                                onChange={(e) => setReturnReason(e.target.value)}
                                                style={{
                                                    width: "100%",
                                                    padding: "10px",
                                                    border: "1px solid #dee2e6",
                                                    borderRadius: "4px",
                                                    fontSize: "14px",
                                                    marginBottom: "15px",
                                                }}
                                            >
                                                <option value="">Seleccione un motivo</option>
                                                <option value="defective">Producto defectuoso</option>
                                                <option value="wrong_item">Producto incorrecto</option>
                                                <option value="customer_change">Cambio de opinión del cliente</option>
                                                <option value="damaged">Producto dañado</option>
                                                <option value="expired">Producto vencido</option>
                                                <option value="other">Otro</option>
                                            </select>

                                            <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#2c3e50", marginBottom: "8px" }}>
                                                Notas adicionales:
                                            </label>
                                            <textarea
                                                value={returnNotes}
                                                onChange={(e) => setReturnNotes(e.target.value)}
                                                placeholder="Ingrese detalles adicionales sobre la devolución..."
                                                style={{
                                                    width: "100%",
                                                    height: "80px",
                                                    padding: "10px",
                                                    border: "1px solid #dee2e6",
                                                    borderRadius: "4px",
                                                    fontSize: "14px",
                                                    resize: "vertical",
                                                    boxSizing: "border-box",
                                                }}
                                            />
                                        </div>

                                        {/* Return Summary */}
                                        {returnTotals.itemCount > 0 && (
                                            <div style={{ padding: "15px", backgroundColor: "#fff3cd", border: "1px solid #ffeaa7", borderRadius: "6px", marginBottom: "20px" }}>
                                                <div style={{ fontSize: "14px", fontWeight: "600", color: "#856404", marginBottom: "8px" }}>
                                                    Resumen de devolución:
                                                </div>
                                                <div style={{ fontSize: "14px", color: "#856404" }}>
                                                    Productos: {returnTotals.itemCount} | 
                                                    Monto total: {formatCurrency(returnTotals.totalAmount)}
                                                </div>
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        <div style={{ display: "flex", gap: "10px" }}>
                                            <button
                                                onClick={handleProcessReturn}
                                                disabled={isProcessingReturn || returnTotals.itemCount === 0 || !returnReason}
                                                style={{
                                                    flex: 1,
                                                    padding: "12px",
                                                    backgroundColor: isProcessingReturn || returnTotals.itemCount === 0 || !returnReason ? "#6c757d" : "#dc3545",
                                                    color: "white",
                                                    border: "none",
                                                    borderRadius: "6px",
                                                    fontSize: "14px",
                                                    fontWeight: "600",
                                                    cursor: isProcessingReturn || returnTotals.itemCount === 0 || !returnReason ? "not-allowed" : "pointer",
                                                }}
                                            >
                                                {isProcessingReturn ? "Procesando..." : "Procesar Devolución"}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedSale(null);
                                                    setSaleDetails(null);
                                                    setReturnItems([]);
                                                    setReturnReason("");
                                                    setReturnNotes("");
                                                    setError(null);
                                                }}
                                                style={{
                                                    padding: "12px 20px",
                                                    backgroundColor: "#6c757d",
                                                    color: "white",
                                                    border: "none",
                                                    borderRadius: "6px",
                                                    fontSize: "14px",
                                                    fontWeight: "500",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div style={{
                    backgroundColor: "white",
                    borderRadius: "8px",
                    padding: "20px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    border: "1px solid #dee2e6",
                }}>
                    <h2 style={{ color: "#2c3e50", marginBottom: "20px" }}>Historial de Devoluciones</h2>
                    {isLoadingHistory ? (
                        <div style={{ textAlign: "center", padding: "30px", color: "#6c757d" }}>Cargando historial...</div>
                    ) : returnHistory.length > 0 ? (
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                            <thead>
                                <tr style={{ borderBottom: "2px solid #dee2e6", backgroundColor: "#f8f9fa" }}>
                                    <th style={{ padding: "12px", textAlign: "left" }}>ID Dev.</th>
                                    <th style={{ padding: "12px", textAlign: "left" }}>Venta Original</th>
                                    <th style={{ padding: "12px", textAlign: "left" }}>Cliente</th>
                                    <th style={{ padding: "12px", textAlign: "left" }}>Fecha</th>
                                    <th style={{ padding: "12px", textAlign: "right" }}>Monto</th>
                                    <th style={{ padding: "12px", textAlign: "left" }}>Motivo</th>
                                    <th style={{ padding: "12px", textAlign: "left" }}>Notas</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {returnHistory.map((ret) => (
                                    <tr key={ret.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{ret.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            #{ret.original_sale_details?.id || ret.original_sale}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ret.customer_details?.name || "N/A"}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(ret.return_date)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(ret.total_amount)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{reasonTranslations[ret.reason] || ret.reason}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ret.notes || "Sin notas"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div style={{ textAlign: "center", padding: "30px", color: "#6c757d" }}>No hay devoluciones registradas.</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ReturnsPage; 