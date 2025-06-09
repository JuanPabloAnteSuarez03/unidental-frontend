import React, { useState, useCallback, useEffect, useRef } from "react";
import { inventoryService } from "../../services/inventoryService";
import { useAuth } from "../../context/AuthContext";

const ProductSearchSelector = ({
    onProductSelected,
    placeholder = "Buscar producto por nombre, SKU o código...",
    showSelectedProduct = true,
    allowClearSelection = true,
    maxResults = 20,
    minSearchLength = 2,
    debounceMs = 300,
    disabled = false,
    initialProduct = null,
    onSelectionCleared = null,
    style = {},
    inputStyle = {},
    dropdownStyle = {},
}) => {
    const { authToken } = useAuth();
    const [searchTerm, setSearchTerm] = useState("");
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(initialProduct);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [error, setError] = useState(null);

    // Refs
    const dropdownRef = useRef(null);
    const inputRef = useRef(null);
    const abortControllerRef = useRef(null);

    // Effect para establecer producto inicial
    useEffect(() => {
        if (initialProduct) {
            setSelectedProduct(initialProduct);
        }
    }, [initialProduct]);

    // Effect para búsqueda con debounce
    useEffect(() => {
        const searchProducts = async () => {
            if (searchTerm.length < minSearchLength || !authToken) {
                setProducts([]);
                setShowDropdown(false);
                setError(null);
                return;
            }

            // Cancelar búsqueda anterior
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            abortControllerRef.current = new AbortController();
            const { signal } = abortControllerRef.current;

            try {
                setLoading(true);
                setError(null);

                console.log("Buscando productos con término:", searchTerm);

                // Buscar productos usando diferentes parámetros
                const searchParams = {
                    search: searchTerm.trim(),
                    page_size: maxResults,
                };

                // También intentar búsqueda por nombre, SKU, etc.
                const response = await inventoryService.getProducts(searchParams, authToken, signal);

                if (signal.aborted) return;

                console.log("Respuesta de búsqueda:", response);

                const foundProducts = response?.results || [];
                setProducts(foundProducts);
                setShowDropdown(foundProducts.length > 0);
                setSelectedIndex(-1);

                if (foundProducts.length === 0 && searchTerm.length >= minSearchLength) {
                    setError("No se encontraron productos que coincidan con la búsqueda");
                }

            } catch (error) {
                if (error.name === "AbortError") {
                    return;
                }
                console.error("Error al buscar productos:", error);
                setError("Error al buscar productos. Intente nuevamente.");
                setProducts([]);
                setShowDropdown(false);
            } finally {
                setLoading(false);
            }
        };

        const debounceTimer = setTimeout(searchProducts, debounceMs);
        return () => clearTimeout(debounceTimer);
    }, [searchTerm, authToken, maxResults, minSearchLength, debounceMs]);

    // Manejar selección de producto
    const handleProductSelect = useCallback((product) => {
        setSelectedProduct(product);
        setSearchTerm("");
        setProducts([]);
        setShowDropdown(false);
        setSelectedIndex(-1);
        setError(null);
        
        if (onProductSelected) {
            onProductSelected(product);
        }
    }, [onProductSelected]);

    // Limpiar selección
    const handleClearSelection = useCallback(() => {
        setSelectedProduct(null);
        setSearchTerm("");
        setProducts([]);
        setShowDropdown(false);
        setSelectedIndex(-1);
        setError(null);
        
        if (onSelectionCleared) {
            onSelectionCleared();
        }
    }, [onSelectionCleared]);

    // Manejar cambio en input
    const handleInputChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        
        if (!value.trim()) {
            setProducts([]);
            setShowDropdown(false);
            setSelectedIndex(-1);
            setError(null);
        }
    };

    // Manejar teclas
    const handleKeyPress = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            if (selectedIndex >= 0 && selectedIndex < products.length) {
                handleProductSelect(products[selectedIndex]);
            }
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            if (showDropdown && products.length > 0) {
                setSelectedIndex(prev => 
                    prev < products.length - 1 ? prev + 1 : prev
                );
            }
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            if (showDropdown && products.length > 0) {
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

    return (
        <div style={{ position: "relative", ...style }} ref={dropdownRef}>
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
                            placeholder={placeholder}
                            value={searchTerm}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyPress}
                            disabled={disabled}
                            style={{
                                width: "100%",
                                paddingLeft: "35px",
                                paddingRight: "12px",
                                paddingTop: "10px",
                                paddingBottom: "10px",
                                border: error ? "1px solid #e74c3c" : "1px solid #dee2e6",
                                borderRadius: "4px",
                                fontSize: "14px",
                                backgroundColor: disabled ? "#f8f9fa" : "white",
                                color: disabled ? "#6c757d" : "#2c3e50",
                                ...inputStyle,
                            }}
                        />
                        <div
                            style={{
                                position: "absolute",
                                left: "10px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                color: loading ? "#3498db" : "#6c757d",
                                fontSize: "14px",
                                fontWeight: "normal",
                            }}
                        >
                            {loading ? "⏳" : "⌕"}
                        </div>
                    </div>

                    {/* Mensaje de error */}
                    {error && (
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
                            {error}
                        </div>
                    )}

                    {/* Dropdown de resultados */}
                    {showDropdown && products.length > 0 && (
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
                            {products.map((product, index) => (
                                <button
                                    key={product.id}
                                    onClick={() => handleProductSelect(product)}
                                    style={{
                                        width: "100%",
                                        textAlign: "left",
                                        padding: "12px",
                                        border: "none",
                                        borderBottom: index < products.length - 1 ? "1px solid #f8f9fa" : "none",
                                        backgroundColor: selectedIndex === index ? "#e8f4fd" : "white",
                                        cursor: "pointer",
                                        transition: "background-color 0.2s ease",
                                    }}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                    onMouseLeave={() => setSelectedIndex(-1)}
                                >
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
                                        <div style={{ fontSize: "12px", color: "#6c757d" }}>
                                            Categoría: {product.category_name}
                                        </div>
                                    )}
                                    {product.selling_price && (
                                        <div style={{ fontSize: "12px", color: "#27ae60", fontWeight: "600" }}>
                                            Precio: ${Number(product.selling_price).toLocaleString()}
                                        </div>
                                    )}
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
                                {products.length} de {maxResults} resultados mostrados
                            </div>
                        </div>
                    )}

                    {/* Ayuda de navegación */}
                    {showDropdown && products.length > 0 && (
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