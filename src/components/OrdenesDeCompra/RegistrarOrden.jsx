import React from "react";
import SupplierSelector from "./SupplierSelector";
import DirectApiSearch from "./DirectApiSearch";
import SupplierProductsList from "./SupplierProductsList";
import OrderItemsList from "./OrderItemsList";

const RegistrarOrden = ({
    suppliers,
    selectedSupplier,
    setSelectedSupplier,
    isLoadingSuppliers,
    searchMode,
    setSearchMode,
    setSearchTerm,
    setSearchResults,
    handleAddProduct,
    orderItems,
    handleRemoveProduct,
    handleChangeQuantity,
    getPurchasePrice,
    clearOrder,
    selectedLocation,
    setSelectedLocation,
    locations,
    isLoadingLocations,
    handleCreateOrder,
    isCreatingOrder,
    products,
    isLoading,
    notes,
    setNotes,
    shouldGenerateOrder,
    setShouldGenerateOrder,
}) => {
    return (
        <div
            style={{
                maxWidth: 1500,
                margin: "0 auto",
                padding: 24,
                minHeight: "100vh",
            }}
        >
            <h1
                style={{
                    fontSize: 28,
                    fontWeight: 800,
                    marginBottom: 40,
                    textAlign: "center",
                    color: "#2c3e50",
                    letterSpacing: "-1px",
                }}
            >
                Registrar Orden de Compra
            </h1>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 600px",
                    gap: 24,
                    alignItems: "flex-start",
                    minHeight: "calc(100vh - 200px)",
                }}
            >
                {/* Columna izquierda: selectores y productos */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 24,
                    }}
                >
                    {/* Selector de proveedor */}
                    <SupplierSelector
                        suppliers={suppliers}
                        selectedSupplier={selectedSupplier}
                        setSelectedSupplier={setSelectedSupplier}
                        isLoadingSuppliers={isLoadingSuppliers}
                        setSearchMode={setSearchMode}
                        setSearchTerm={setSearchTerm}
                        setSearchResults={setSearchResults}
                        orderItems={orderItems}
                        clearOrder={clearOrder}
                    />

                    {/* Búsqueda API Directa */}
                    <DirectApiSearch
                        suppliers={suppliers}
                        selectedSupplier={selectedSupplier}
                        setSelectedSupplier={setSelectedSupplier}
                        handleAddProduct={handleAddProduct}
                        setSearchMode={setSearchMode}
                        clearOrder={clearOrder}
                        orderItems={orderItems}
                    />

                    {/* Productos del proveedor */}
                    <SupplierProductsList
                        selectedSupplier={selectedSupplier}
                        products={products}
                        isLoading={isLoading}
                        handleAddProduct={handleAddProduct}
                        searchMode={searchMode}
                        clearOrder={clearOrder}
                    />
                </div>

                {/* Columna derecha: productos y resumen */}
                <OrderItemsList
                    searchMode={searchMode}
                    orderItems={orderItems}
                    handleRemoveProduct={handleRemoveProduct}
                    handleChangeQuantity={handleChangeQuantity}
                    getPurchasePrice={getPurchasePrice}
                    selectedLocation={selectedLocation}
                    setSelectedLocation={setSelectedLocation}
                    locations={locations}
                    isLoadingLocations={isLoadingLocations}
                    handleCreateOrder={handleCreateOrder}
                    isCreatingOrder={isCreatingOrder}
                    selectedSupplier={selectedSupplier}
                    notes={notes}
                    setNotes={setNotes}
                    shouldGenerateOrder={shouldGenerateOrder}
                    setShouldGenerateOrder={setShouldGenerateOrder}
                />
            </div>
        </div>
    );
};

export default RegistrarOrden;
