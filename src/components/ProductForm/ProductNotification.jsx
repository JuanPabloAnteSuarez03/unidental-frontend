import React from "react";

const ProductNotification = ({ notification }) => {
  if (!notification.show) return null;

  // Define icons based on notification type
  const getIcon = (type) => {
    switch (type) {
      case "success":
        return (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#155724"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        );
      case "error":
        return (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#721c24"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        );
      case "warning":
        return (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#856404"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        );
      default:
        return (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#0c5460"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        );
    }
  };

  return (
    <div
      style={{
        padding: "15px",
        marginBottom: "20px",
        borderRadius: "8px",
        backgroundColor:
          notification.type === "success"
            ? "#d4edda"
            : notification.type === "error"
            ? "#f8d7da"
            : notification.type === "warning"
            ? "#fff3cd"
            : "#d1ecf1",
        border: `1px solid ${
          notification.type === "success"
            ? "#c3e6cb"
            : notification.type === "error"
            ? "#f5c6cb"
            : notification.type === "warning"
            ? "#ffeaa7"
            : "#bee5eb"
        }`,
        color:
          notification.type === "success"
            ? "#155724"
            : notification.type === "error"
            ? "#721c24"
            : notification.type === "warning"
            ? "#856404"
            : "#0c5460",
        boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
        display: "flex",
        alignItems: "center",
        transition: "all 0.3s ease",
        animation: "fadeIn 0.5s ease-in-out",
      }}
    >
      <div
        style={{ marginRight: "10px", display: "flex", alignItems: "center" }}
      >
        {getIcon(notification.type)}
      </div>
      <div style={{ fontWeight: "500" }}>{notification.message}</div>
    </div>
  );
};

export default ProductNotification;
