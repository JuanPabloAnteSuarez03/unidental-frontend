import React, { useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";

// Función para normalizar texto removiendo tildes y signos de puntuación
const normalizeText = (text) => {
    if (!text) return "";
    return text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remover diacríticos (tildes)
        .replace(/[^\w\s]/g, "") // Remover signos de puntuación
        .toLowerCase()
        .trim();
};

// Función para generar variaciones de búsqueda
const generateSearchVariations = (query) => {
    const variations = new Set();

    // Agregar la búsqueda original
    variations.add(query);

    // Agregar la versión normalizada (sin tildes ni puntuación)
    const normalized = normalizeText(query);
    if (normalized !== query.toLowerCase()) {
        variations.add(normalized);
    }

    // Agregar palabras individuales del término de búsqueda
    const words = query.split(/\s+/).filter((word) => word.length >= 2);
    words.forEach((word) => {
        variations.add(word);
        const normalizedWord = normalizeText(word);
        if (normalizedWord !== word.toLowerCase()) {
            variations.add(normalizedWord);
        }
    });

    return Array.from(variations);
};

const DirectApiSearchSelector = ({
    onProductSelect,
    placeholder = "Buscar productos...",
}) => {
    const { authToken } = useAuth();
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [error, setError] = useState("");
    const [searchStats, setSearchStats] = useState({ count: 0, searchTime: 0 });

    const searchInputRef = useRef(null);

    // Función para buscar directamente en la API con múltiples variaciones
    const performSearch = async () => {
        const query = searchTerm.trim();

        if (!query || query.length < 2) {
            setError("Ingrese al menos 2 caracteres para buscar");
            return;
        }

        setIsSearching(true);
        setError("");
        setHasSearched(false);
        const startTime = performance.now();

        try {
            console.log(`🔍 Iniciando búsqueda inteligente: "${query}"`);

            // Generar variaciones de búsqueda
            const searchVariations = generateSearchVariations(query);
            console.log(`📝 Variaciones de búsqueda:`, searchVariations);

            // Realizar múltiples búsquedas
            const allResults = new Map(); // Usar Map para evitar duplicados por ID
            let totalCount = 0;
            let totalSearchTime = 0;

            for (const variation of searchVariations) {
                try {
                    console.log(`🔍 Buscando variación: "${variation}"`);

                    const variationStartTime = performance.now();
                    const response = await fetch(
                        `https://unidental-backend.onrender.com/api/suppliers/purchase-options/?search=${encodeURIComponent(
                            variation
                        )}&page_size=20`,
                        {
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Token ${authToken}`,
                            },
                        }
                    );

                    if (!response.ok) {
                        console.warn(
                            `⚠️ Error en búsqueda "${variation}": ${response.status}`
                        );
                        continue; // Continuar con la siguiente variación
                    }

                    const data = await response.json();
                    const results = data.results || [];
                    const variationEndTime = performance.now();
                    const variationSearchTime = Math.round(
                        variationEndTime - variationStartTime
                    );

                    totalSearchTime += variationSearchTime;
                    totalCount = Math.max(totalCount, data.count || 0);

                    console.log(
                        `✅ Variación "${variation}": ${results.length} resultados en ${variationSearchTime}ms`
                    );

                    // Agregar resultados únicos por ID
                    results.forEach((product) => {
                        if (!allResults.has(product.id)) {
                            allResults.set(product.id, product);
                        }
                    });
                } catch (variationError) {
                    console.warn(
                        `⚠️ Error en variación "${variation}":`,
                        variationError
                    );
                    // Continuar con la siguiente variación
                }
            }

            // Convertir Map a Array
            const finalResults = Array.from(allResults.values());
            const endTime = performance.now();
            const totalTime = Math.round(endTime - startTime);

            console.log(
                `✅ Búsqueda inteligente completada en ${totalTime}ms: ${finalResults.length} resultados únicos de ${totalCount} total`
            );

            setSearchResults(finalResults);
            setSearchStats({
                count: totalCount,
                searchTime: totalTime,
                showing: finalResults.length,
                variations: searchVariations.length,
            });
            setHasSearched(true);
        } catch (error) {
            console.error("❌ Error en búsqueda inteligente:", error);
            setError(error.message);
            setSearchResults([]);
            setSearchStats({ count: 0, searchTime: 0 });
            setHasSearched(true);
        } finally {
            setIsSearching(false);
        }
    };

    // Manejar tecla Enter
    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            performSearch();
        }
    };

    // Manejar selección de producto
    const handleProductSelect = (product) => {
        // Agregar información del proveedor al producto
        const productWithSupplierInfo = {
            ...product,
            supplierId: product.supplier, // ID del proveedor
            supplierName: product.supplier_name, // Nombre del proveedor
        };

        onProductSelect(productWithSupplierInfo);
        setSearchTerm("");
        setSearchResults([]);
        setHasSearched(false);
        setError("");
        searchInputRef.current?.focus();
    };

    return (
        <div style={{ width: "100%" }}>
            {/* Barra de búsqueda */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
                <div style={{ flex: "1", position: "relative" }}>
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder={placeholder}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isSearching}
                        style={{
                            width: "100%",
                            padding: "12px 16px",
                            borderRadius: "8px",
                            border: "2px solid #e3eaf3",
                            fontSize: "14px",
                            fontWeight: "500",
                            color: "#2c3e50",
                            background: isSearching ? "#f8f9fa" : "#ffffff",
                            outline: "none",
                            transition: "all 0.2s ease",
                            boxSizing: "border-box",
                        }}
                    />
                </div>

                <button
                    onClick={performSearch}
                    disabled={isSearching || !searchTerm.trim()}
                    style={{
                        padding: "12px 24px",
                        borderRadius: "8px",
                        border: "none",
                        background:
                            isSearching || !searchTerm.trim()
                                ? "#cbd5e0"
                                : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        color: "white",
                        fontSize: "14px",
                        fontWeight: "600",
                        cursor:
                            isSearching || !searchTerm.trim()
                                ? "not-allowed"
                                : "pointer",
                        transition: "all 0.2s ease",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        minWidth: "120px",
                        justifyContent: "center",
                    }}
                >
                    {isSearching ? (
                        <>
                            <div
                                style={{
                                    width: "16px",
                                    height: "16px",
                                    border: "2px solid rgba(255,255,255,0.3)",
                                    borderTop: "2px solid white",
                                    borderRadius: "50%",
                                    animation: "spin 1s linear infinite",
                                }}
                            />
                            Buscando...
                        </>
                    ) : (
                        <>Buscar</>
                    )}
                </button>
            </div>

            {/* Estadísticas de búsqueda */}
            {hasSearched && !isSearching && (
                <div
                    style={{
                        padding: "8px 12px",
                        background: "#f8f9fa",
                        borderRadius: "6px",
                        fontSize: "12px",
                        color: "#6c757d",
                        marginBottom: "16px",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "4px",
                        }}
                    >
                        <span>
                            {searchStats.showing > 0
                                ? `Mostrando ${searchStats.showing} de ${searchStats.count} resultados`
                                : "No se encontraron resultados"}
                        </span>
                        {searchStats.searchTime > 0 && (
                            <span>Búsqueda en {searchStats.searchTime}ms</span>
                        )}
                    </div>
                    {searchStats.variations > 1 && (
                        <div style={{ fontSize: "11px", color: "#868e96" }}>
                            🔍 Búsqueda inteligente: {searchStats.variations}{" "}
                            variaciones (con/sin tildes)
                        </div>
                    )}
                </div>
            )}

            {/* Mensaje de error */}
            {error && (
                <div
                    style={{
                        padding: "12px",
                        background: "#fee2e2",
                        borderRadius: "8px",
                        color: "#dc2626",
                        fontSize: "14px",
                        marginBottom: "16px",
                        border: "1px solid #fecaca",
                    }}
                >
                    ❌ {error}
                </div>
            )}

            {/* Resultados de búsqueda */}
            {hasSearched && !isSearching && searchResults.length > 0 && (
                <div
                    style={{
                        border: "2px solid #e3eaf3",
                        borderRadius: "12px",
                        background: "#ffffff",
                        overflow: "hidden",
                    }}
                >
                    <div
                        style={{
                            padding: "16px",
                            background:
                                "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            color: "white",
                            fontSize: "16px",
                            fontWeight: "600",
                        }}
                    >
                        📦 Resultados de Búsqueda
                    </div>

                    <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                        {searchResults.map((product, index) => (
                            <div
                                key={product.id || index}
                                onClick={() => handleProductSelect(product)}
                                style={{
                                    padding: "16px",
                                    borderBottom:
                                        index < searchResults.length - 1
                                            ? "1px solid #f1f5f9"
                                            : "none",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                    background: "#ffffff",
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.background = "#f8fafc";
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = "#ffffff";
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "flex-start",
                                        gap: "12px",
                                    }}
                                >
                                    <div style={{ flex: "1" }}>
                                        <div
                                            style={{
                                                fontSize: "16px",
                                                fontWeight: "600",
                                                color: "#1e293b",
                                                marginBottom: "6px",
                                                lineHeight: "1.4",
                                            }}
                                        >
                                            {product.product_name ||
                                                "Producto sin nombre"}
                                        </div>

                                        <div
                                            style={{
                                                fontSize: "13px",
                                                color: "#64748b",
                                            }}
                                        >
                                            🏢 Proveedor:{" "}
                                            <span
                                                style={{
                                                    fontWeight: "600",
                                                    color: "#059669",
                                                }}
                                            >
                                                {product.supplier_name || "N/A"}
                                            </span>
                                        </div>
                                    </div>

                                    <div
                                        style={{
                                            textAlign: "right",
                                            minWidth: "120px",
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: "18px",
                                                fontWeight: "700",
                                                color: "#059669",
                                            }}
                                        >
                                            $
                                            {product.purchase_price
                                                ? parseFloat(
                                                      product.purchase_price
                                                  ).toLocaleString()
                                                : "0"}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Mensaje cuando no hay resultados */}
            {hasSearched &&
                !isSearching &&
                searchResults.length === 0 &&
                !error && (
                    <div
                        style={{
                            padding: "40px 20px",
                            textAlign: "center",
                            border: "2px dashed #cbd5e0",
                            borderRadius: "12px",
                            background: "#f8fafc",
                        }}
                    >
                        <div
                            style={{
                                fontSize: "48px",
                                marginBottom: "16px",
                            }}
                        >
                            🔍
                        </div>
                        <div
                            style={{
                                fontSize: "16px",
                                fontWeight: "600",
                                color: "#475569",
                                marginBottom: "8px",
                            }}
                        >
                            No se encontraron productos
                        </div>
                        <div
                            style={{
                                fontSize: "14px",
                                color: "#64748b",
                            }}
                        >
                            Intenta con otros términos de búsqueda
                        </div>
                    </div>
                )}

            {/* Estilos CSS para la animación */}
            <style jsx>{`
                @keyframes spin {
                    0% {
                        transform: rotate(0deg);
                    }
                    100% {
                        transform: rotate(360deg);
                    }
                }
            `}</style>
        </div>
    );
};

export default DirectApiSearchSelector;
