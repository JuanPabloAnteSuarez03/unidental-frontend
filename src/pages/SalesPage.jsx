import React, { useState, useCallback } from "react";
import CustomerSelector from "../components/Sales/CustomerSelector";
import ProductSelector from "../components/Sales/ProductSelector";
import SaleItemsList from "../components/Sales/SaleItemsList";
import SaleSummary from "../components/Sales/SaleSummary";
import { salesService } from "../services/salesService";
import { useAuth } from "../context/AuthContext";

const SalesPage = () => {
    const { authToken } = useAuth();
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [saleItems, setSaleItems] = useState([]);
    const [saleType, setSaleType] = useState("cash"); // "cash" o "credit"
    const [shouldInvoice, setShouldInvoice] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAddProduct = useCallback((product, quantity, unitPrice) => {
        setSaleItems(prevItems => {
            const existingIndex = prevItems.findIndex(
                item => item.product_id === product.id
            );

            if (existingIndex !== -1) {
                const newItems = [...prevItems];
                newItems[existingIndex] = {
                    ...newItems[existingIndex],
                    quantity: newItems[existingIndex].quantity + quantity,
                };
                return newItems;
            }

            return [...prevItems, {
                product_id: product.id,
                quantity: quantity,
                unit_price: unitPrice,
                product_details: {
                    name: product.name,
                    sku: product.sku,
                    category_name: product.category_name,
                    unit: product.unit
                }
            }];
        });
    }, []);

    const handleRemoveItem = useCallback((index) => {
        setSaleItems(prevItems => prevItems.filter((_, i) => i !== index));
    }, []);

    const handleUpdateItem = useCallback((index, updates) => {
        setSaleItems(prevItems => {
            const newItems = [...prevItems];
            newItems[index] = {
                ...newItems[index],
                ...updates
            };
            return newItems;
        });
    }, []);

    const calculateTotals = useCallback(() => {
        const itemCount = saleItems.length;
        const totalQuantity = saleItems.reduce((total, item) => total + item.quantity, 0);
        const subtotal = saleItems.reduce((total, item) => 
            total + (parseFloat(item.unit_price) * item.quantity), 0
        );
        const tax = 0; // Por ahora sin impuestos
        const total = subtotal + tax;

        return {
            itemCount,
            totalQuantity,
            subtotal: subtotal.toFixed(2),
            tax: tax.toFixed(2),
            total: total.toFixed(2)
        };
    }, [saleItems]);

    const handleSubmitSale = async () => {
        if (!selectedCustomer || saleItems.length === 0) {
            alert("Por favor seleccione un cliente y agregue productos");
            return;
        }

        if (!authToken) {
            alert("Error de autenticación");
            return;
        }

        setIsSubmitting(true);
        try {
            const totals = calculateTotals();
            
            const saleData = {
                customer_id: selectedCustomer.id,
                sale_type: saleType,
                should_invoice: shouldInvoice,
                total_amount: parseFloat(totals.total),
                sale_items: saleItems.map(item => ({
                    product_id: item.product_id,
                    quantity: item.quantity,
                    unit_price: parseFloat(item.unit_price)
                }))
            };

            const response = await salesService.createSale(saleData, authToken);
            
            alert(`¡Venta registrada exitosamente! ID: ${response.id}`);
            
            // Reset form
            setSelectedCustomer(null);
            setSaleItems([]);
            setSaleType("cash");
            setShouldInvoice(false);
            
        } catch (error) {
            console.error("Error al registrar venta:", error);
            alert("Error al registrar la venta: " + (error.message || "Error desconocido"));
        } finally {
            setIsSubmitting(false);
        }
    };

    const totals = calculateTotals();

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
            {/* Título de la página */}
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
                <h1
                    style={{
                        color: "#2c3e50",
                        fontSize: "28px",
                        fontWeight: "700",
                        margin: "0 0 8px 0",
                    }}
                >
                    Registrar Venta
                </h1>
                <p
                    style={{
                        color: "#6c757d",
                        fontSize: "16px",
                        margin: 0,
                    }}
                >
                    Complete la información de la venta y agregue los productos
                </p>
            </div>

            {/* Contenido principal */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: "20px" }}>
                {/* Columna izquierda */}
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    {/* Selector de Cliente */}
                    <div
                        style={{
                            backgroundColor: "white",
                            borderRadius: "8px",
                            padding: "20px",
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
                            1. Seleccionar Cliente
                        </h3>
                        <CustomerSelector
                            selectedCustomer={selectedCustomer}
                            onCustomerSelected={setSelectedCustomer}
                        />
                    </div>

                    {/* Selector de Productos */}
                    <div
                        style={{
                            backgroundColor: "white",
                            borderRadius: "8px",
                            padding: "20px",
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
                            2. Agregar Productos
                        </h3>
                        <ProductSelector onProductAdded={handleAddProduct} />
                    </div>

                    {/* Lista de productos */}
                    <div
                        style={{
                            backgroundColor: "white",
                            borderRadius: "8px",
                            padding: "20px",
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
                            3. Productos en la Venta
                        </h3>
                        <SaleItemsList
                            items={saleItems}
                            onRemoveItem={handleRemoveItem}
                            onUpdateItem={handleUpdateItem}
                        />
                    </div>

                    {/* Opciones de venta */}
                    <div
                        style={{
                            backgroundColor: "white",
                            borderRadius: "8px",
                            padding: "20px",
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
                            4. Opciones de Pago
                        </h3>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                            {/* Tipo de venta */}
                            <div>
                                <label
                                    style={{
                                        display: "block",
                                        fontSize: "14px",
                                        fontWeight: "600",
                                        color: "#2c3e50",
                                        marginBottom: "8px",
                                    }}
                                >
                                    Tipo de Pago
                                </label>
                                <select
                                    value={saleType}
                                    onChange={(e) => setSaleType(e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: "10px",
                                        border: "1px solid #dee2e6",
                                        borderRadius: "4px",
                                        fontSize: "14px",
                                        backgroundColor: "white",
                                        color: "#2c3e50",
                                    }}
                                >
                                    <option value="cash">💵 Efectivo</option>
                                    <option value="credit">💳 Crédito</option>
                                </select>
                            </div>

                            {/* Factura */}
                            <div>
                                <label
                                    style={{
                                        display: "block",
                                        fontSize: "14px",
                                        fontWeight: "600",
                                        color: "#2c3e50",
                                        marginBottom: "8px",
                                    }}
                                >
                                    Facturación
                                </label>
                                <label
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        cursor: "pointer",
                                        padding: "10px",
                                        border: "1px solid #dee2e6",
                                        borderRadius: "4px",
                                        backgroundColor: shouldInvoice ? "#e8f4fd" : "white",
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={shouldInvoice}
                                        onChange={(e) => setShouldInvoice(e.target.checked)}
                                        style={{ marginRight: "8px" }}
                                    />
                                    <span style={{ fontSize: "14px", color: "#2c3e50" }}>
                                        📄 Requiere factura
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Columna derecha - Resumen */}
                <div style={{ position: "sticky", top: "20px", height: "fit-content" }}>
                    <SaleSummary
                        totals={totals}
                        saleType={saleType}
                        shouldInvoice={shouldInvoice}
                        onSubmit={handleSubmitSale}
                        isLoading={isSubmitting}
                        disabled={!selectedCustomer || saleItems.length === 0}
                    />
                </div>
            </div>
        </div>
    );
};

export default SalesPage; 