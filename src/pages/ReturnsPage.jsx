import React, { useState, useCallback, useEffect } from "react";
import { returnsService } from "../services/returnsService";
import { salesService } from "../services/salesService";
import { useAuth } from "../context/AuthContext";
import { useProducts } from "../context/ProductsContext";
import { FaHistory, FaUndo, FaFileInvoiceDollar } from "react-icons/fa";

const ReturnsPage = () => {
    const { authToken } = useAuth();
    const { updateStockAfterSale } = useProducts();
    
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
        setSelectedSale(sale);
        setIsLoadingSale(true);
        setError(null);
        
        try {
            // Fetch sale details and returned items concurrently
            const [saleDetails, returnedItemsData] = await Promise.all([
                returnsService.getSaleForReturn(sale.id, authToken),
                returnsService.getReturnedItemsBySale(sale.id, authToken)
            ]);
            
            setSaleDetails(saleDetails);

            // Create a map of returned quantities for each sale_item_id using the new endpoint
            const returnedQuantitiesMap = {};
            if (returnedItemsData.returned_items && returnedItemsData.returned_items.length > 0) {
                returnedItemsData.returned_items.forEach(item => {
                    returnedQuantitiesMap[item.sale_item_id] = item.total_returned;
                });
            }

            // Initialize return items, adjusting for previous returns
            const initialReturnItems = (saleDetails.items || []).map(item => {
                const alreadyReturned = returnedQuantitiesMap[item.id] || 0;
                const remainingQuantity = item.quantity - alreadyReturned;

                return {
                    ...item,
                    sale_item_id: item.id,
                    return_quantity: 0,
                    max_quantity: remainingQuantity,
                    original_quantity: item.quantity,
                    already_returned: alreadyReturned
                };
            });
            
            setReturnItems(initialReturnItems);

            // Verificar si hay productos disponibles para devolver
            const productosDisponibles = initialReturnItems.filter(item => item.max_quantity > 0);
            if (productosDisponibles.length === 0) {
                setError("No hay productos disponibles para devolver en esta venta. Todos los productos ya han sido devueltos completamente.");
                setSelectedSale(null);
                setSaleDetails(null);
                setReturnItems([]);
            }

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

    const attemptCreateReturn = async (returnData) => returnsService.createReturn(returnData, authToken);

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
        
        try {
            console.log("🔍 DEBUG - selectedSale:", selectedSale);
            console.log("🔍 DEBUG - selectedSale.customer:", selectedSale.customer);
            console.log("🔍 DEBUG - selectedSale.location:", selectedSale.location);
            console.log("🔍 DEBUG - itemsToReturn:", itemsToReturn);
            
            // Validar que los datos requeridos no sean null
            if (!selectedSale.id) {
                throw new Error("ID de venta no válido");
            }
            
            if (!selectedSale.customer) {
                console.warn("⚠️ Cliente es null, enviando null");
            }
            
            if (!selectedSale.location) {
                throw new Error("Ubicación de venta no válida");
            }
            
            const returnData = {
                original_sale_id: selectedSale.id,
                customer_id: selectedSale.customer,
                location_id: selectedSale.location,
                reason: returnReason,
                notes: returnNotes,
                items: itemsToReturn.map(item => ({
                    sale_item_id: item.sale_item_id,
                    product_id: item.product,
                    quantity: item.return_quantity,
                    unit_price: item.unit_price
                }))
            };
            
            console.log("🔍 DEBUG - Return data being sent:", returnData);
            console.log("🔍 DEBUG - JSON stringified:", JSON.stringify(returnData, null, 2));
            
            const result = await attemptCreateReturn(returnData);
            
            setSuccess(`Devolución #${result.id} procesada exitosamente.`);

            // Update stock in UI
            itemsToReturn.forEach(item => {
                updateStockAfterSale(item.product, item.return_quantity);
            });
            
            // Refresh sales list to get updated totals from backend
            await loadAllSales();

            // Refresh the current sale details to show updated "Ya devueltos"
            if (selectedSale) {
                try {
                    const [updatedSaleDetails, updatedReturnedItemsData] = await Promise.all([
                        returnsService.getSaleForReturn(selectedSale.id, authToken),
                        returnsService.getReturnedItemsBySale(selectedSale.id, authToken)
                    ]);
                    
                    setSaleDetails(updatedSaleDetails);

                    // Recalculate returned quantities using the new endpoint
                    const returnedQuantitiesMap = {};
                    if (updatedReturnedItemsData.returned_items && updatedReturnedItemsData.returned_items.length > 0) {
                        updatedReturnedItemsData.returned_items.forEach(item => {
                            returnedQuantitiesMap[item.sale_item_id] = item.total_returned;
                        });
                    }

                    // Update return items with new "Ya devueltos" values
                    const updatedReturnItems = (updatedSaleDetails.items || []).map(item => {
                        const alreadyReturned = returnedQuantitiesMap[item.id] || 0;
                        const remainingQuantity = item.quantity - alreadyReturned;

                        return {
                            ...item,
                            sale_item_id: item.id,
                            return_quantity: 0, // Reset return quantities
                            max_quantity: remainingQuantity,
                            original_quantity: item.quantity,
                            already_returned: alreadyReturned
                        };
                    });
                    
                    setReturnItems(updatedReturnItems);
                    
                    // Check if all products are now fully returned
                    const productosDisponibles = updatedReturnItems.filter(item => item.max_quantity > 0);
                    if (productosDisponibles.length === 0) {
                        setError("No hay productos disponibles para devolver en esta venta. Todos los productos ya han sido devueltos completamente.");
                        setSelectedSale(null);
                        setSaleDetails(null);
                        setReturnItems([]);
                    }
                } catch (refreshError) {
                    console.error("Error refreshing sale details:", refreshError);
                    // Continue with reset even if refresh fails
                }
            }
            
            // Reset form
            setReturnReason("");
            setReturnNotes("");
            
        } catch (error) {
            console.error("Error processing return:", error);
            setError("Error al procesar la devolución: " + error.message);
        } finally {
            setIsProcessingReturn(false);
        }
    }, [selectedSale, returnItems, returnReason, returnNotes, authToken, updateStockAfterSale, loadAllSales]);

    // Load return history
    const loadReturnHistory = useCallback(async () => {
        if (!authToken) return;
        
        setIsLoadingHistory(true);
        setError(null);
        
        try {
            const history = await returnsService.getReturnHistory({}, authToken);
            setReturnHistory(history.results || []);
        } catch (error) {
            console.error("Error loading return history:", error);
            setError("Error al cargar historial de devoluciones: " + error.message);
        } finally {
            setIsLoadingHistory(false);
        }
    }, [authToken]);

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return "Fecha no disponible";
        try {
            return new Date(dateString).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            console.error("Error formatting date:", dateString, error);
            return "Fecha inválida";
        }
    };

    // Calculate totals
    const calculateReturnTotals = useCallback(() => {
        const itemsToReturn = returnItems.filter(item => item.return_quantity > 0);
        const totalQuantity = itemsToReturn.reduce((total, item) => total + item.return_quantity, 0);
        const totalAmount = itemsToReturn.reduce((total, item) => 
            total + (parseFloat(item.unit_price) * item.return_quantity), 0
        );
        
        return {
            itemCount: itemsToReturn.length,
            totalQuantity,
            totalAmount: totalAmount.toFixed(2)
        };
    }, [returnItems]);

    const returnTotals = calculateReturnTotals();

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
                                                            ${parseFloat(sale.total_gross || sale.total_net || sale.total || 0).toLocaleString()}
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
                                        <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#f8f9fa", borderRadius: "6px" }}>
                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "14px" }}>
                                                <div><strong>Cliente:</strong> {saleDetails.customer_details?.name}</div>
                                                <div><strong>Fecha:</strong> {formatDate(saleDetails.sale_date || saleDetails.created_at)}</div>
                                                <div><strong>Sede:</strong> {saleDetails.location_details?.name}</div>
                                                <div><strong>Total:</strong> ${parseFloat(saleDetails.total_gross || saleDetails.total_net || saleDetails.total || 0).toLocaleString()}</div>
                                            </div>
                                        </div>

                                        {/* Return Items */}
                                        <h4 style={{ margin: "0 0 10px 0", fontSize: "16px", color: "#2c3e50" }}>
                                            Productos a devolver:
                                        </h4>
                                        <div style={{ maxHeight: "300px", overflowY: "auto", marginBottom: "20px" }}>
                                            {returnItems.map((item, index) => (
                                                <div
                                                    key={index}
                                                    style={{
                                                        padding: "12px",
                                                        border: "1px solid #dee2e6",
                                                        borderRadius: "4px",
                                                        marginBottom: "8px",
                                                        backgroundColor: "white",
                                                    }}
                                                >
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontWeight: "600", fontSize: "14px", color: "#2c3e50" }}>
                                                                {item.product_details?.name || "Producto"}
                                                            </div>
                                                            <div style={{ fontSize: "12px", color: "#6c757d" }}>
                                                                SKU: {item.product_details?.sku} | Precio: ${item.unit_price}
                                                            </div>
                                                            <div style={{ fontSize: "12px", color: "#6c757d", marginTop: '4px' }}>
                                                                Cant. Vendida: <strong>{item.original_quantity}</strong> | Ya devueltos: <strong>{item.already_returned}</strong>
                                                            </div>
                                                        </div>
                                                        <div style={{ marginLeft: "15px" }}>
                                                            <label style={{ fontSize: "12px", color: "#6c757d", marginBottom: "4px", display: "block" }}>
                                                                Cantidad a devolver:
                                                            </label>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max={item.max_quantity}
                                                                value={item.return_quantity}
                                                                onChange={(e) => handleUpdateReturnQuantity(index, parseInt(e.target.value) || 0)}
                                                                style={{
                                                                    width: "80px",
                                                                    padding: "4px 8px",
                                                                    border: "1px solid #dee2e6",
                                                                    borderRadius: "4px",
                                                                    fontSize: "14px",
                                                                    textAlign: "center",
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Return Details */}
                                        <div style={{ marginBottom: "20px" }}>
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
                                                    Cantidad total: {returnTotals.totalQuantity} | 
                                                    Monto total: ${returnTotals.totalAmount}
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
                            <tbody>
                                {returnHistory.map(ret => (
                                    <tr key={ret.id} style={{ borderBottom: "1px solid #e9ecef" }}>
                                        <td style={{ padding: "12px" }}>#{ret.id}</td>
                                        <td style={{ padding: "12px" }}>#{ret.original_sale}</td>
                                        <td style={{ padding: "12px" }}>{ret.customer_details?.name || "N/A"}</td>
                                        <td style={{ padding: "12px" }}>{formatDate(ret.return_date)}</td>
                                        <td style={{ padding: "12px", textAlign: "right", fontWeight: "bold" }}>
                                            ${parseFloat(ret.total_amount || 0).toLocaleString()}
                                        </td>
                                        <td style={{ padding: "12px" }}>{reasonTranslations[ret.reason] || ret.reason}</td>
                                        <td style={{ padding: "12px", maxWidth: "200px", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                                            {ret.notes || "Sin notas"}
                                        </td>
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