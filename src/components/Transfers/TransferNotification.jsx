import React from "react";

const TransferNotification = ({ notification }) => {
    if (!notification.show) return null;

    const getNotificationStyles = () => {
        const baseStyles = {
            padding: "16px 20px",
            borderRadius: "12px",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            fontWeight: "500",
            fontSize: "14px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            border: "1px solid",
            position: "relative",
            overflow: "hidden",
        };

        switch (notification.type) {
            case "success":
                return {
                    ...baseStyles,
                    backgroundColor: "#d4edda",
                    color: "#155724",
                    borderColor: "#c3e6cb",
                };
            case "error":
                return {
                    ...baseStyles,
                    backgroundColor: "#f8d7da",
                    color: "#721c24",
                    borderColor: "#f5c6cb",
                };
            case "warning":
                return {
                    ...baseStyles,
                    backgroundColor: "#fff3cd",
                    color: "#856404",
                    borderColor: "#ffeaa7",
                };
            case "info":
                return {
                    ...baseStyles,
                    backgroundColor: "#d1ecf1",
                    color: "#0c5460",
                    borderColor: "#bee5eb",
                };
            default:
                return {
                    ...baseStyles,
                    backgroundColor: "#e2e3e5",
                    color: "#383d41",
                    borderColor: "#d6d8db",
                };
        }
    };

    const getIcon = () => {
        switch (notification.type) {
            case "success":
                return "✅";
            case "error":
                return "❌";
            case "warning":
                return "⚠️";
            case "info":
                return "ℹ️";
            default:
                return "📝";
        }
    };

    return (
        <div style={getNotificationStyles()}>
            {/* Barra animada lateral */}
            <div
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: "4px",
                    backgroundColor:
                        notification.type === "success"
                            ? "#28a745"
                            : notification.type === "error"
                            ? "#dc3545"
                            : notification.type === "warning"
                            ? "#ffc107"
                            : notification.type === "info"
                            ? "#17a2b8"
                            : "#6c757d",
                    animation: "pulse 2s infinite",
                }}
            ></div>

            <span style={{ fontSize: "18px" }}>{getIcon()}</span>

            <div style={{ flex: 1 }}>
                <strong>
                    {notification.type === "success" && "¡Éxito!"}
                    {notification.type === "error" && "Error"}
                    {notification.type === "warning" && "Atención"}
                    {notification.type === "info" && "Información"}
                </strong>
                <div style={{ marginTop: "2px" }}>{notification.message}</div>
            </div>

            <style>
                {`
                    @keyframes pulse {
                        0%, 100% { opacity: 1; }
                        50% { opacity: 0.5; }
                    }
                `}
            </style>
        </div>
    );
};

export default TransferNotification;
