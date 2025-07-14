import React, { useState } from "react";

const CreateSkuEntityModal = ({
  isOpen,
  onClose,
  onSubmit,
  entityType,
  parentData = null,
  isSubmitting = false
}) => {
  const [formData, setFormData] = useState({
    code: "",
    name: "",
  });

  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Para el campo código, solo permitir letras y números
    if (name === "code") {
      const cleanValue = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      setFormData(prev => ({ ...prev, [name]: cleanValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    const newErrors = {};
    if (!formData.code.trim()) {
      newErrors.code = "El código es requerido";
    } else if (formData.code.trim().length !== 3) {
      newErrors.code = "El código debe tener exactamente 3 caracteres";
    }
    if (!formData.name.trim()) {
      newErrors.name = "El nombre es requerido";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Prepare data to submit
    const submitData = {
      code: formData.code.trim().toUpperCase(),
      name: formData.name.trim(),
    };

    // Add parent relationship for subcategories and types
    if (entityType === "subcategory" && parentData) {
      submitData.category = parentData.id;
    } else if (entityType === "type" && parentData) {
      submitData.subcategory = parentData.id;
    }

    onSubmit(submitData);
  };

  const handleClose = () => {
    setFormData({ code: "", name: "" });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  const getEntityTypeLabel = () => {
    switch (entityType) {
      case "category":
        return "Categoría SKU";
      case "subcategory":
        return "Subcategoría SKU";
      case "type":
        return "Tipo/Material SKU";
      default:
        return "Entidad SKU";
    }
  };

  const getParentInfo = () => {
    if (!parentData) return null;
    
    switch (entityType) {
      case "subcategory":
        return `Para la categoría: ${parentData.code} - ${parentData.name}`;
      case "type":
        return `Para la subcategoría: ${parentData.code} - ${parentData.name}`;
      default:
        return null;
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={handleClose}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "24px",
          width: "90%",
          maxWidth: "500px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ marginBottom: "20px" }}>
          <h3
            style={{
              margin: "0 0 8px 0",
              color: "#2c3e50",
              fontSize: "18px",
              fontWeight: "600",
            }}
          >
            Crear Nueva {getEntityTypeLabel()}
          </h3>
          {getParentInfo() && (
            <p
              style={{
                margin: 0,
                color: "#6c757d",
                fontSize: "14px",
              }}
            >
              {getParentInfo()}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label
              htmlFor="code"
              style={{
                display: "block",
                marginBottom: "6px",
                fontWeight: "500",
                color: "#2c3e50",
              }}
            >
              Código *
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                id="code"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                placeholder="Ej: ANE, IMP, END"
                maxLength={3}
                style={{
                  width: "100%",
                  padding: "10px",
                  paddingRight: "50px",
                  border: `1px solid ${errors.code ? "#e74c3c" : "#ced4da"}`,
                  borderRadius: "4px",
                  fontSize: "16px",
                  boxSizing: "border-box",
                  textTransform: "uppercase",
                  fontFamily: "monospace",
                  letterSpacing: "1px",
                }}
                disabled={isSubmitting}
              />
              <span
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: "12px",
                  color: formData.code.length === 3 ? "#28a745" : "#6c757d",
                  fontWeight: "500",
                }}
              >
                {formData.code.length}/3
              </span>
            </div>
            {errors.code && (
              <span style={{ color: "#e74c3c", fontSize: "14px" }}>
                {errors.code}
              </span>
            )}
            <div style={{ 
              marginTop: "4px", 
              fontSize: "12px", 
              color: "#6c757d",
              fontStyle: "italic" 
            }}>
              Solo letras y números, exactamente 3 caracteres
            </div>
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label
              htmlFor="name"
              style={{
                display: "block",
                marginBottom: "6px",
                fontWeight: "500",
                color: "#2c3e50",
              }}
            >
              Nombre *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Ej: Anestesia, Implantes, Endodoncia"
              maxLength={100}
              style={{
                width: "100%",
                padding: "10px",
                border: `1px solid ${errors.name ? "#e74c3c" : "#ced4da"}`,
                borderRadius: "4px",
                fontSize: "16px",
                boxSizing: "border-box",
              }}
              disabled={isSubmitting}
            />
            {errors.name && (
              <span style={{ color: "#e74c3c", fontSize: "14px" }}>
                {errors.name}
              </span>
            )}
          </div>

          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "flex-end",
            }}
          >
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              style={{
                padding: "10px 20px",
                border: "1px solid #ced4da",
                borderRadius: "4px",
                backgroundColor: "#ffffff",
                color: "#6c757d",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                fontSize: "16px",
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: "10px 20px",
                border: "none",
                borderRadius: "4px",
                backgroundColor: isSubmitting ? "#6c757d" : "#007bff",
                color: "#ffffff",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                fontSize: "16px",
              }}
            >
              {isSubmitting ? "Creando..." : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSkuEntityModal; 