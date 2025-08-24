import React from "react";
import DirectApiSearchSelector from "../Common/DirectApiSearchSelector";

const DirectApiSearch = ({
    suppliers,
    selectedSupplier,
    setSelectedSupplier,
    handleAddProduct,
    setSearchMode,
    clearOrder,
    orderItems, // Agregar orderItems para poder verificar si hay productos
}) => {
    return (
        <div className="order-card">
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "16px",
                    padding: "12px 16px",
                    background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    borderRadius: "8px",
                    color: "white",
                }}
            >
                <span style={{ fontSize: "18px" }}>⚡</span>
                <h3
                    style={{
                        fontSize: "16px",
                        fontWeight: "700",
                        margin: 0,
                        color: "white",
                    }}
                >
                    Búsqueda Directa
                </h3>
            </div>

            <DirectApiSearchSelector
                onProductSelect={(product) => {
                    // Agregar el purchase_option para compatibilidad
                    const productWithOption = {
                        ...product,
                        purchase_option: product.id,
                    };

                    // Buscar el proveedor del producto seleccionado
                    if (product.supplier) {
                        const foundSupplier = suppliers.find(
                            (supplier) => supplier.id === product.supplier
                        );

                        if (foundSupplier) {
                            // Verificar si ya hay un proveedor seleccionado diferente
                            // Convertir IDs a string para comparación segura
                            const currentSupplierId = selectedSupplier
                                ? String(selectedSupplier.id)
                                : null;
                            const newSupplierId = String(foundSupplier.id);

                            // Validación simplificada: si hay un proveedor seleccionado y es diferente al del producto
                            if (
                                selectedSupplier &&
                                currentSupplierId !== newSupplierId
                            ) {
                                // Mostrar advertencia y preguntar si quiere continuar
                                const confirmMessage = `⚠️ CAMBIO DE PROVEEDOR\n\nYa tienes productos del proveedor "${selectedSupplier.name}" en tu orden de compra.\n\nEl producto "${product.product_name}" pertenece al proveedor "${foundSupplier.name}".\n\nIMPORTANTE: No se pueden mezclar productos de diferentes proveedores en una misma orden.\n\nSi continúas:\n• Se eliminarán todos los productos del proveedor "${selectedSupplier.name}"\n• Se seleccionará el proveedor "${foundSupplier.name}"\n• Se agregará el producto "${product.product_name}"\n\n¿Deseas continuar con el cambio de proveedor?`;

                                if (window.confirm(confirmMessage)) {
                                    // Cambiar el searchMode PRIMERO para evitar que el useEffect limpie la orden
                                    setSearchMode("direct_api");

                                    // Limpiar orden y cambiar proveedor
                                    const eliminatedProducts = clearOrder(); // Limpiar productos del proveedor anterior
                                    setSelectedSupplier(foundSupplier);

                                    // Usar setTimeout para asegurar que handleAddProduct se ejecute después de que el estado se haya limpiado
                                    setTimeout(() => {
                                        handleAddProduct(productWithOption);

                                        // Mostrar notificación
                                        const notification = {
                                            type: "warning",
                                            message: `🔄 Proveedor cambiado a "${foundSupplier.name}".\n\n❌ Se eliminaron ${eliminatedProducts} producto(s) del proveedor "${selectedSupplier.name}".\n\n✅ Producto "${product.product_name}" agregado al nuevo proveedor.\n\n📍 Deberás seleccionar nuevamente la sede de destino.`,
                                            duration: 5000,
                                        };

                                        if (window.showNotification) {
                                            window.showNotification(
                                                notification
                                            );
                                        }
                                    }, 100); // Pequeño delay para asegurar que el estado se haya actualizado
                                } else {
                                    return; // No hacer nada
                                }
                            } else {
                                // Mismo proveedor o no hay proveedor seleccionado
                                setSelectedSupplier(foundSupplier);
                                handleAddProduct(productWithOption);
                                setSearchMode("direct_api");

                                // Mostrar notificación de proveedor seleccionado
                                const notification = {
                                    type: "success",
                                    message: `✅ Proveedor "${foundSupplier.name}" seleccionado automáticamente`,
                                    duration: 3000,
                                };

                                if (window.showNotification) {
                                    window.showNotification(notification);
                                }
                            }
                        } else {
                            console.warn(
                                `⚠️ No se encontró el proveedor con ID: ${product.supplier}`
                            );
                            alert(
                                "Error: No se pudo identificar el proveedor del producto"
                            );
                        }
                    } else {
                        console.warn(
                            "⚠️ Producto sin información de proveedor"
                        );
                        alert(
                            "Error: El producto no tiene información de proveedor"
                        );
                    }
                }}
                placeholder="🚀 Buscar productos..."
            />
        </div>
    );
};

export default DirectApiSearch;
