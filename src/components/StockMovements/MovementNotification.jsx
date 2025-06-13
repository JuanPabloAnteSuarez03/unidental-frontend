import React, { useEffect, useState } from "react";

const MovementNotification = ({ notification = {} }) => {
  const [visible, setVisible] = useState(true);
  
  useEffect(() => {
    // Cuando llega una nueva notificación, reestablecemos la visibilidad
    if (notification && notification.show) {
      setVisible(true);
      
      // Auto-ocultar después de 5 segundos (excepto errores que duran más)
      const timeout = notification.type === "error" ? 8000 : 5000;
      const timer = setTimeout(() => {
        setVisible(false);
      }, timeout);
      
      return () => clearTimeout(timer);
    }
  }, [notification]);
  
  if (!notification || !notification.show || !visible) {
    return null;
  }

  const getNotificationStyles = () => {
    const baseStyles = {
      padding: "16px 20px",
      marginBottom: "24px",
      borderRadius: "12px",
      fontSize: "16px",
      fontWeight: "500",
      display: "flex",
      alignItems: "center",
      gap: "12px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
      border: "none",
      position: "relative",
      overflow: "hidden",
    };

    const typeStyles = {
      success: {
        backgroundColor: "#d4edda",
        color: "#155724",
        borderLeft: "4px solid #28a745",
      },
      info: {
        backgroundColor: "#e3f2fd",
        color: "#0d47a1",
        borderLeft: "4px solid #2196f3",
      },
      error: {
        backgroundColor: "#f8d7da",
        color: "#721c24",
        borderLeft: "4px solid #dc3545",
      },
    };

    return { ...baseStyles, ...typeStyles[notification.type] };
  };

  const getIcon = () => {
    const icons = {
      success: "✅",
      info: "ℹ️",
      error: "❌",
    };
    return icons[notification.type] || "ℹ️";
  };

  return (
    <div style={getNotificationStyles()}>
      {/* Animated background shimmer */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "-100%",
          width: "100%",
          height: "100%",
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
          animation: "shimmer 2s infinite",
        }}
      ></div>

      <span style={{ fontSize: "20px", flexShrink: 0 }}>{getIcon()}</span>
      <span style={{ flex: 1 }}>{notification.message}</span>
      
      {/* Botón de cerrar */}
      <button 
        onClick={() => setVisible(false)}
        style={{
          background: "transparent",
          border: "none",
          color: "inherit",
          fontSize: "18px",
          cursor: "pointer",
          opacity: 0.7,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "4px",
          marginLeft: "8px",
          borderRadius: "50%",
          width: "28px",
          height: "28px"
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
        onMouseLeave={(e) => e.currentTarget.style.opacity = 0.7}
      >
        ✕
      </button>

      <style>
        {`
                    @keyframes shimmer {
                        0% { left: -100%; }
                        100% { left: 100%; }
                    }
                `}
      </style>
    </div>
  );
};

export default MovementNotification;
