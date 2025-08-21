import React from "react";

const LoadingSpinner = ({
    message = "Cargando...",
    subMessage = "",
    size = "compact",
    inline = false,
}) => {
    if (inline) {
        return (
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 16px",
                    backgroundColor: "rgba(39, 174, 96, 0.05)",
                    border: "1px solid rgba(39, 174, 96, 0.2)",
                    borderRadius: "6px",
                    margin: "8px 0",
                }}
            >
                <div
                    style={{
                        width: "16px",
                        height: "16px",
                        border: "2px solid rgba(39, 174, 96, 0.2)",
                        borderTop: "2px solid #27ae60",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite",
                    }}
                />
                <span
                    style={{
                        fontSize: "14px",
                        color: "#1e8449",
                        fontWeight: "600",
                    }}
                >
                    {message}
                </span>
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
    }

    const sizeStyles = {
        compact: {
            spinner: { width: "20px", height: "20px" },
            container: { padding: "16px 20px" },
            title: { fontSize: "14px" },
            subtitle: { fontSize: "12px" },
            icon: "14px",
        },
        small: {
            spinner: { width: "24px", height: "24px" },
            container: { padding: "20px" },
            title: { fontSize: "15px" },
            subtitle: { fontSize: "13px" },
            icon: "16px",
        },
        default: {
            spinner: { width: "28px", height: "28px" },
            container: { padding: "24px" },
            title: { fontSize: "16px" },
            subtitle: { fontSize: "14px" },
            icon: "18px",
        },
    };

    const currentSize = sizeStyles[size] || sizeStyles.compact;

    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                ...currentSize.container,
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                border: "1px solid rgba(39, 174, 96, 0.15)",
                borderRadius: "8px",
                boxShadow: "0 2px 8px rgba(39, 174, 96, 0.08)",
                margin: "12px 0",
                backdropFilter: "blur(2px)",
            }}
        >
            {/* Spinner simple */}
            <div
                style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <div
                    style={{
                        ...currentSize.spinner,
                        border: "2px solid rgba(39, 174, 96, 0.2)",
                        borderTop: "2px solid #27ae60",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite",
                    }}
                />
                <i
                    className="fas fa-cash-register"
                    style={{
                        position: "absolute",
                        fontSize: currentSize.icon,
                        color: "#27ae60",
                        opacity: 0.7,
                    }}
                />
            </div>

            {/* Mensajes en línea */}
            <div style={{ textAlign: "left" }}>
                <div
                    style={{
                        ...currentSize.title,
                        fontWeight: "600",
                        color: "#1e8449",
                        margin: 0,
                        lineHeight: "1.2",
                    }}
                >
                    {message}
                </div>
                {subMessage && (
                    <div
                        style={{
                            ...currentSize.subtitle,
                            color: "#52c882",
                            fontWeight: "400",
                            opacity: 0.8,
                            margin: "2px 0 0 0",
                            lineHeight: "1.2",
                        }}
                    >
                        {subMessage}
                    </div>
                )}
            </div>

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

export default LoadingSpinner;
