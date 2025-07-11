import React, { useEffect } from "react";

const NotificationBanner = ({ type, message, onClose, duration = 5000 }) => {
    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    const getStyles = () => {
        const baseStyles = {
            position: "fixed",
            top: "20px",
            right: "20px",
            padding: "16px 20px",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            zIndex: 1000,
            maxWidth: "400px",
            fontSize: "14px",
            fontWeight: "500",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            animation: "slideInRight 0.3s ease-out",
        };

        if (type === "success") {
            return {
                ...baseStyles,
                backgroundColor: "#d4edda",
                color: "#155724",
                border: "1px solid #c3e6cb",
            };
        } else if (type === "error") {
            return {
                ...baseStyles,
                backgroundColor: "#f8d7da",
                color: "#721c24",
                border: "1px solid #f5c6cb",
            };
        } else if (type === "warning") {
            return {
                ...baseStyles,
                backgroundColor: "#fff3cd",
                color: "#856404",
                border: "1px solid #ffeaa7",
            };
        } else {
            return {
                ...baseStyles,
                backgroundColor: "#d1ecf1",
                color: "#0c5460",
                border: "1px solid #bee5eb",
            };
        }
    };

    const getIcon = () => {
        switch (type) {
            case "success":
                return "✅";
            case "error":
                return "❌";
            case "warning":
                return "⚠️";
            default:
                return "ℹ️";
        }
    };

    return (
        <div style={getStyles()}>
            <span style={{ fontSize: "18px" }}>{getIcon()}</span>
            <div style={{ flex: 1 }}>
                <div style={{ whiteSpace: "pre-line" }}>{message}</div>
            </div>
            <button
                onClick={onClose}
                style={{
                    background: "none",
                    border: "none",
                    fontSize: "18px",
                    cursor: "pointer",
                    color: "inherit",
                    opacity: 0.7,
                    padding: "0",
                    width: "20px",
                    height: "20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
                onMouseEnter={(e) => (e.target.style.opacity = "1")}
                onMouseLeave={(e) => (e.target.style.opacity = "0.7")}
            >
                ×
            </button>
            <style jsx>{`
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
};

export default NotificationBanner;
