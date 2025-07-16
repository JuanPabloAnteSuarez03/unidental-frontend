import React from "react";

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: "rgba(0,0,0,0.35)",
      zIndex: 1000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 32,
          minWidth: 340,
          maxWidth: 480,
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
          position: "relative"
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            background: "none",
            border: "none",
            fontSize: 22,
            color: "#888",
            cursor: "pointer"
          }}
          aria-label="Cerrar"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
};

export default Modal; 