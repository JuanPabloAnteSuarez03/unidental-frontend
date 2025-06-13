import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import inventoryService from "../../services/inventoryService";

const StockByLocationDropdown = ({
    productId,
    isOpen,
    onClose,
    anchorRef,
    totalStock,
}) => {
    const { authToken } = useAuth();
    const [stockByLocation, setStockByLocation] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const dropdownRef = useRef(null);

    // Load stock by location when dropdown opens
    useEffect(() => {
        if (isOpen && productId && authToken) {
            loadStockByLocation();
        }
    }, [isOpen, productId, authToken]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target) &&
                anchorRef.current &&
                !anchorRef.current.contains(event.target)
            ) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => {
                document.removeEventListener("mousedown", handleClickOutside);
            };
        }
    }, [isOpen, onClose]);

    const loadStockByLocation = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const stockData = await inventoryService.getProductStockByLocations(
                productId,
                authToken
            );
            setStockByLocation(stockData);
        } catch (err) {
            console.error("Error loading stock by location:", err);
            setError("Error al cargar stock por sede");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    // Calculate position relative to anchor element
    const getDropdownStyle = () => {
        if (!anchorRef.current) return {};

        const anchorRect = anchorRef.current.getBoundingClientRect();
        const dropdownWidth = 280;
        const dropdownHeight = Math.min(300, stockByLocation.length * 50 + 100);

        // Position dropdown to the right of the anchor, or to the left if no space
        let left = anchorRect.right + 10;
        if (left + dropdownWidth > window.innerWidth) {
            left = anchorRect.left - dropdownWidth - 10;
        }

        // Position dropdown vertically centered with anchor
        let top = anchorRect.top + anchorRect.height / 2 - dropdownHeight / 2;

        // Keep dropdown within viewport
        if (top < 10) top = 10;
        if (top + dropdownHeight > window.innerHeight - 10) {
            top = window.innerHeight - dropdownHeight - 10;
        }

        return {
            position: "fixed",
            left: `${left}px`,
            top: `${top}px`,
            width: `${dropdownWidth}px`,
            maxHeight: `${dropdownHeight}px`,
            zIndex: 1000,
        };
    };

    return (
        <div
            ref={dropdownRef}
            style={{
                ...getDropdownStyle(),
                backgroundColor: "white",
                border: "1px solid #e9ecef",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                overflow: "hidden",
            }}
        >
            {/* Header */}
            <div
                style={{
                    padding: "12px 16px",
                    backgroundColor: "#f8f9fa",
                    borderBottom: "1px solid #e9ecef",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <h4
                    style={{
                        margin: 0,
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#2c3e50",
                    }}
                >
                    Stock por Sede
                </h4>
                <button
                    onClick={onClose}
                    style={{
                        background: "none",
                        border: "none",
                        fontSize: "18px",
                        color: "#6c757d",
                        cursor: "pointer",
                    }}
                >
                    ×
                </button>
            </div>

            {/* Content */}
            <div
                style={{
                    maxHeight: "240px",
                    overflowY: "auto",
                }}
            >
                {isLoading && (
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
                                margin: "0 auto 8px",
                            }}
                        ></div>
                        Cargando...
                    </div>
                )}

                {error && (
                    <div
                        style={{
                            padding: "16px",
                            textAlign: "center",
                            color: "#dc3545",
                        }}
                    >
                        {error}
                    </div>
                )}

                {!isLoading && !error && stockByLocation.length === 0 && (
                    <div
                        style={{
                            padding: "20px",
                            textAlign: "center",
                            color: "#6c757d",
                        }}
                    >
                        No hay stock disponible
                    </div>
                )}

                {!isLoading && !error && stockByLocation.length > 0 && (
                    <div>
                        {stockByLocation.map((location, index) => (
                            <div
                                key={location.id}
                                style={{
                                    padding: "12px 16px",
                                    borderBottom:
                                        index < stockByLocation.length - 1
                                            ? "1px solid #f0f0f0"
                                            : "none",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    backgroundColor:
                                        location.stock === 0
                                            ? "#f8f9fa"
                                            : "white",
                                }}
                            >
                                <div
                                    style={{
                                        flex: 1,
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: "14px",
                                            fontWeight: "500",
                                            color:
                                                location.stock === 0
                                                    ? "#6c757d"
                                                    : "#2c3e50",
                                        }}
                                    >
                                        {location.name}
                                    </div>
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: "14px",
                                            fontWeight: "600",
                                            color:
                                                location.stock === 0
                                                    ? "#6c757d"
                                                    : location.stock < 5
                                                    ? "#dc3545"
                                                    : location.stock < 10
                                                    ? "#fd7e14"
                                                    : "#28a745",
                                            backgroundColor:
                                                location.stock === 0
                                                    ? "#e9ecef"
                                                    : location.stock < 5
                                                    ? "#f8d7da"
                                                    : location.stock < 10
                                                    ? "#fff3cd"
                                                    : "#d4edda",
                                            padding: "4px 8px",
                                            borderRadius: "12px",
                                            minWidth: "40px",
                                            textAlign: "center",
                                        }}
                                    >
                                        {location.stock}
                                    </span>
                                    {location.stock === 0 && (
                                        <span
                                            style={{
                                                fontSize: "12px",
                                                color: "#6c757d",
                                            }}
                                        >
                                            Sin stock
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer with total */}
            {!isLoading && !error && stockByLocation.length > 0 && (
                <div
                    style={{
                        padding: "12px 16px",
                        backgroundColor: "#f8f9fa",
                        borderTop: "1px solid #e9ecef",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <span
                        style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#2c3e50",
                        }}
                    >
                        Total General:
                    </span>
                    <span
                        style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            color:
                                totalStock < 5
                                    ? "#dc3545"
                                    : totalStock < 10
                                    ? "#fd7e14"
                                    : "#28a745",
                            backgroundColor:
                                totalStock < 5
                                    ? "#f8d7da"
                                    : totalStock < 10
                                    ? "#fff3cd"
                                    : "#d4edda",
                            padding: "4px 8px",
                            borderRadius: "12px",
                            minWidth: "40px",
                            textAlign: "center",
                        }}
                    >
                        {totalStock}
                    </span>
                </div>
            )}

            {/* CSS for animation */}
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

export default StockByLocationDropdown;
