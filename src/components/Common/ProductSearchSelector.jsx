import React, { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import useProductSearch from "../../hooks/inventory/useProductSearch";

const ProductSearchSelector = ({
    onProductSelected,
    placeholder = "Buscar producto por nombre, SKU o código...",
    showSelectedProduct = true,
    allowClearSelection = true,
    maxResults = 50,
    minSearchLength = 2,
    debounceMs = 300,
    disabled = false,
    initialProduct = null,
    onSelectionCleared = null,
    onUpdateProductsStock = null,
    inputId = null,
    style = {},
    inputStyle = {},
    dropdownStyle = {},
    refreshKey = 0, // Nuevo prop
}) => {
    const { authToken } = useAuth();
    const {
        searchTerm,
        filteredProducts,
        isLoading,
        loadingMessage,
        error: searchError,
        handleSearch,
        resetSearch,
        updateProductsStock,
        refreshProducts,
    } = useProductSearch();

    const [selectedProduct, setSelectedProduct] = useState(initialProduct);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [inputValue, setInputValue] = useState("");

    // Refs
    const dropdownRef = useRef(null);
    const inputRef = useRef(null);
    const debounceTimerRef = useRef(null);

    // Effect para establecer producto inicial
    useEffect(() => {
        if (initialProduct) {
            setSelectedProduct(initialProduct);
        }
    }, [initialProduct]);

    // Función de debounce para la búsqueda
    const debouncedSearch = useCallback((term) => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
            handleSearch(term);
        }, debounceMs);
    }, [handleSearch, debounceMs]);

    // Effect para búsqueda con debounce
    useEffect(() => {
        if (inputValue.length >= minSearchLength) {
            debouncedSearch(inputValue);
            setShowDropdown(true);
        } else {
            handleSearch("");
            setShowDropdown(false);
        }

        setSelectedIndex(-1);
    }, [inputValue, minSearchLength, debouncedSearch, handleSearch]);

    // Refrescar productos al cambiar refreshKey
    useEffect(() => {
        setInputValue("");
        setSelectedProduct(null);
        setShowDropdown(false);
        setSelectedIndex(-1);
        handleSearch("");
    }, [refreshKey, handleSearch]);

    // Cleanup del timer
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    // Obtener productos a mostrar (limitados por maxResults)
    const displayProducts = Array.isArray(filteredProducts) 
        ? filteredProducts.slice(0, maxResults) 
        : [];

    // Manejar selección de producto
    const handleProductSelect = useCallback((product) => {
        setSelectedProduct(product);
        setInputValue("");
        setShowDropdown(false);
        setSelectedIndex(-1);
        resetSearch();
        
        if (onProductSelected) {
            onProductSelected(product);
        }
    }, [onProductSelected, resetSearch]);

    // Limpiar selección
    const handleClearSelection = useCallback(() => {
        setSelectedProduct(null);
        setInputValue("");
        setShowDropdown(false);
        setSelectedIndex(-1);
        resetSearch();
        
        if (onSelectionCleared) {
            onSelectionCleared();
        }
    }, [onSelectionCleared, resetSearch]);

    // Manejar cambio en input
    const handleInputChange = (e) => {
        const value = e.target.value;
        setInputValue(value);
        
        if (!value.trim()) {
            setShowDropdown(false);
            setSelectedIndex(-1);
        }
    };

    // Manejar teclas
    const handleKeyPress = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            if (selectedIndex >= 0 && selectedIndex < displayProducts.length) {
                handleProductSelect(displayProducts[selectedIndex]);
            }
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            if (showDropdown && displayProducts.length > 0) {
                setSelectedIndex(prev => 
                    prev < displayProducts.length - 1 ? prev + 1 : prev
                );
            }
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            if (showDropdown && displayProducts.length > 0) {
                setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
            }
        } else if (e.key === "Escape") {
            e.preventDefault();
            setShowDropdown(false);
            setSelectedIndex(-1);
        }
    };

    // Click fuera del componente
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
                setSelectedIndex(-1);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Effect para exponer la función updateProductsStock al componente padre
    useEffect(() => {
        if (onUpdateProductsStock) {
            onUpdateProductsStock(updateProductsStock);
        }
    }, [updateProductsStock, onUpdateProductsStock]);

    return (
        <div style={{ position: "relative", ...style }} ref={dropdownRef}>
            {/* Botón de refresco de productos */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6 }}>
                <button
                    type="button"
                    onClick={async () => {
                        try {
                            await refreshProducts();
                            setInputValue("");
                            setSelectedProduct(null);
                            setShowDropdown(false);
                            setSelectedIndex(-1);
                            handleSearch("");
                        } catch (e) {
                            console.error("Error al refrescar productos:", e);
                        }
                    }}
                    style={{
                        background: "#00b894",
                        color: "white",
                        border: "none",
                        borderRadius: 6,
                        padding: "6px 10px",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer"
                    }}
                    title="Actualizar productos"
                >
                    Actualizar
                </button>
            </div>
            {/* Producto seleccionado */}
            {showSelectedProduct && selectedProduct && (
                <div
                    style={{
                        marginBottom: "15px",
                        padding: "15px",
                        backgroundColor: "#d5edda",
                        border: "1px solid #27ae60",
                        borderRadius: "6px",
                    }}
                >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                            <h4
                                style={{
                                    margin: "0 0 4px 0",
                                    fontSize: "16px",
                                    fontWeight: "600",
                                    color: "#2c3e50",
                                }}
                            >
                                {selectedProduct.name}
                            </h4>
                            <p style={{ margin: "0 0 2px 0", fontSize: "14px", color: "#6c757d" }}>
                                SKU: {selectedProduct.sku}
                            </p>
                            {selectedProduct.category_name && (
                                <p style={{ margin: 0, fontSize: "14px", color: "#6c757d" }}>
                                    Categoría: {selectedProduct.category_name}
                                </p>
                            )}
                        </div>
                        {allowClearSelection && (
                            <button
                                onClick={handleClearSelection}
                                style={{
                                    padding: "8px 10px",
                                    border: "1px solid #e74c3c",
                                    borderRadius: "4px",
                                    backgroundColor: "#e74c3c",
                                    color: "white",
                                    cursor: "pointer",
                                    fontSize: "14px",
                                    fontWeight: "500",
                                }}
                                title="Quitar producto"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Campo de búsqueda */}
            {(!showSelectedProduct || !selectedProduct) && (
                <div>
                    <div style={{ position: "relative" }}>
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder={isLoading && filteredProducts.length === 0 
                                ? "Cargando productos..." 
                                : placeholder}
                            value={inputValue}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyPress}
                            disabled={disabled || (isLoading && filteredProducts.length === 0)}
                            style={{
                                width: "100%",
                                boxSizing: "border-box",
                                paddingLeft: "35px",
                                paddingRight: "12px",
                                paddingTop: "10px",
                                paddingBottom: "10px",
                                border: searchError ? "1px solid #e74c3c" : "1px solid #dee2e6",
                                borderRadius: "4px",
                                fontSize: "14px",
                                backgroundColor: (disabled || (isLoading && filteredProducts.length === 0)) ? "#f8f9fa" : "white",
                                color: (disabled || (isLoading && filteredProducts.length === 0)) ? "#6c757d" : "#2c3e50",
                                cursor: (disabled || (isLoading && filteredProducts.length === 0)) ? "not-allowed" : "text",
                                ...inputStyle,
                            }}
                            id={inputId}
                        />
                        <div
                            style={{
                                position: "absolute",
                                left: "10px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                color: (isLoading && filteredProducts.length === 0) ? "#3498db" : "#6c757d",
                                fontSize: "14px",
                                fontWeight: "normal",
                            }}
                        >
                            {(isLoading && filteredProducts.length === 0) ? "⏳" : "⌕"}
                        </div>
                    </div>

                    {/* Loading and status indicators */}
                    {isLoading && filteredProducts.length === 0 && (
                        <div
                            style={{
                                marginTop: "8px",
                                padding: "12px",
                                backgroundColor: "#e8f4fd",
                                border: "1px solid #b8daff",
                                borderRadius: "4px",
                                color: "#004085",
                                fontSize: "14px",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px"
                            }}
                        >
                            <div
                                style={{
                                    width: "16px",
                                    height: "16px",
                                    border: "2px solid #b8daff",
                                    borderTop: "2px solid #3498db",
                                    borderRadius: "50%",
                                    animation: "spin 1s linear infinite"
                                }}
                            />
                            <span>Cargando productos...</span>
                            <style>
                                {`
                                    @keyframes spin {
                                        0% { transform: rotate(0deg); }
                                        100% { transform: rotate(360deg); }
                                    }
                                `}
                            </style>
                        </div>
                    )}

                    {/* Mensaje de error */}
                    {searchError && (
                        <div
                            style={{
                                marginTop: "8px",
                                padding: "8px 12px",
                                backgroundColor: "#f8d7da",
                                border: "1px solid #f5c6cb",
                                borderRadius: "4px",
                                color: "#721c24",
                                fontSize: "12px",
                            }}
                        >
                            {searchError}
                        </div>
                    )}

                    {/* Dropdown de resultados */}
                    {showDropdown && displayProducts.length > 0 && (
                        <div
                            style={{
                                position: "absolute",
                                top: "100%",
                                left: 0,
                                right: 0,
                                zIndex: 1000,
                                marginTop: "4px",
                                maxHeight: "300px",
                                overflowY: "auto",
                                backgroundColor: "white",
                                border: "1px solid #dee2e6",
                                borderRadius: "4px",
                                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                                ...dropdownStyle,
                            }}
                        >
                            {displayProducts.map((product, index) => (
                                <button
                                    key={product.id}
                                    onClick={() => handleProductSelect(product)}
                                    style={{
                                        width: "100%",
                                        textAlign: "left",
                                        padding: "12px",
                                        border: "none",
                                        borderBottom: index < displayProducts.length - 1 ? "1px solid #f8f9fa" : "none",
                                        backgroundColor: selectedIndex === index ? "#e8f4fd" : "white",
                                        cursor: "pointer",
                                        transition: "background-color 0.2s ease",
                                    }}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                    onMouseLeave={() => setSelectedIndex(-1)}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                        <div style={{ flex: 1 }}>
                                            <div
                                                style={{
                                                    fontSize: "14px",
                                                    fontWeight: "600",
                                                    color: "#2c3e50",
                                                    marginBottom: "4px",
                                                }}
                                            >
                                                {product.name}
                                            </div>
                                            <div style={{ fontSize: "12px", color: "#6c757d", marginBottom: "2px" }}>
                                                SKU: {product.sku}
                                            </div>
                                            {product.category_name && (
                                                <div style={{ fontSize: "12px", color: "#6c757d", marginBottom: "2px" }}>
                                                    Categoría: {product.category_name}
                                                </div>
                                            )}
                                            {product.selling_price && (
                                                <div style={{ fontSize: "12px", color: "#27ae60", fontWeight: "600" }}>
                                                    Precio: ${Number(product.selling_price).toLocaleString()}
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Stock Info */}
                                        <div style={{ 
                                            marginLeft: "12px",
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "flex-end"
                                        }}>
                                            <div
                                                style={{
                                                    fontSize: "11px",
                                                    color: "#6c757d",
                                                    marginBottom: "2px",
                                                    fontWeight: "500"
                                                }}
                                            >
                                                Stock
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: "13px",
                                                    fontWeight: "700",
                                                    padding: "2px 8px",
                                                    borderRadius: "12px",
                                                    backgroundColor: (product.stock_quantity || 0) > 0 
                                                        ? (product.stock_quantity > 10 ? "#d4edda" : "#fff3cd")
                                                        : "#f8d7da",
                                                    color: (product.stock_quantity || 0) > 0 
                                                        ? (product.stock_quantity > 10 ? "#155724" : "#856404")
                                                        : "#721c24",
                                                    border: `1px solid ${(product.stock_quantity || 0) > 0 
                                                        ? (product.stock_quantity > 10 ? "#c3e6cb" : "#ffeaa7")
                                                        : "#f5c6cb"}`,
                                                    minWidth: "45px",
                                                    textAlign: "center"
                                                }}
                                            >
                                                {(product.stock_quantity || 0) > 0 
                                                    ? `${product.stock_quantity}` 
                                                    : "Sin stock"}
                                            </div>
                                            {(product.stock_quantity || 0) <= 0 && (
                                                <div style={{ fontSize: "10px", color: "#e74c3c", marginTop: "2px" }}>
                                                    ⚠️
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}
                            
                            {/* Footer del dropdown */}
                            <div
                                style={{
                                    padding: "8px 12px",
                                    backgroundColor: "#f8f9fa",
                                    borderTop: "1px solid #dee2e6",
                                    fontSize: "12px",
                                    color: "#6c757d",
                                    textAlign: "center",
                                }}
                            >
                                {displayProducts.length} de {maxResults} resultados mostrados
                            </div>
                        </div>
                    )}

                    {/* No results message */}
                    {showDropdown && displayProducts.length === 0 && inputValue.length >= minSearchLength && !isLoading && (
                        <div
                            style={{
                                position: "absolute",
                                top: "100%",
                                left: 0,
                                right: 0,
                                zIndex: 1000,
                                marginTop: "4px",
                                backgroundColor: "white",
                                border: "1px solid #dee2e6",
                                borderRadius: "4px",
                                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                                padding: "20px",
                                textAlign: "center",
                                color: "#6c757d",
                                fontSize: "14px",
                            }}
                        >
                            No se encontraron productos con "{inputValue}"
                        </div>
                    )}

                    {/* Ayuda de navegación */}
                    {showDropdown && displayProducts.length > 0 && (
                        <div
                            style={{
                                position: "absolute",
                                top: "100%",
                                right: 0,
                                marginTop: "8px",
                                padding: "4px 8px",
                                backgroundColor: "#2c3e50",
                                color: "white",
                                fontSize: "10px",
                                borderRadius: "4px",
                                zIndex: 1001,
                                whiteSpace: "nowrap",
                            }}
                        >
                            ↑↓ Navegar • Enter Seleccionar • Esc Cerrar
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ProductSearchSelector; 