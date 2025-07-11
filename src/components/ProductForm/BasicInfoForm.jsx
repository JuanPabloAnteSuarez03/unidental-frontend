import React from "react";

const BasicInfoForm = ({
    formData,
    handleInputChange,
    categories,
    isLoadingCategories,
}) => {
    return (
        <div style={{ marginBottom: "40px" }}>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "24px",
                    padding: "16px 20px",
                    background:
                        "linear-gradient(135deg, #3498db 0%, #2980b9 100%)",
                    borderRadius: "12px",
                    color: "white",
                }}
            >
                <div
                    style={{
                        background: "rgba(255, 255, 255, 0.2)",
                        width: "40px",
                        height: "40px",
                        borderRadius: "10px",
                        marginRight: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                    }}
                >
                    <span
                        style={{
                            color: "white",
                            fontSize: "24px",
                        }}
                    >
                        📝
                    </span>
                </div>
                <div>
                    <h3
                        style={{
                            color: "white",
                            fontSize: "20px",
                            fontWeight: "600",
                            margin: 0,
                            letterSpacing: "-0.3px",
                        }}
                    >
                        Información Básica del Producto
                    </h3>
                    <p
                        style={{
                            color: "rgba(255, 255, 255, 0.9)",
                            fontSize: "14px",
                            margin: "4px 0 0 0",
                        }}
                    >
                        Datos principales del producto
                    </p>
                </div>
            </div>

            {/* Nombre del Producto */}
            <div style={{ marginBottom: "20px" }}>
                <label
                    htmlFor="name"
                    style={{
                        display: "block",
                        marginBottom: "8px",
                        fontWeight: "600",
                        color: "#2c3e50",
                        fontSize: "14px",
                        letterSpacing: "0.3px",
                        textTransform: "uppercase",
                        position: "relative",
                        paddingLeft: "12px",
                    }}
                >
                    <span
                        style={{
                            position: "absolute",
                            left: "0",
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: "3px",
                            height: "14px",
                            backgroundColor: "#3498db",
                            borderRadius: "2px",
                        }}
                    ></span>
                    📝 Nombre del Producto *
                </label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "4px",
                        border: "1px solid #ced4da",
                        fontSize: "16px",
                        boxSizing: "border-box",
                        transition:
                            "border-color 0.2s ease, box-shadow 0.2s ease",
                        outline: "none",
                    }}
                    onFocus={(e) => {
                        e.target.style.borderColor = "#80bdff";
                        e.target.style.boxShadow =
                            "0 0 0 0.2rem rgba(0,123,255,.25)";
                    }}
                    onBlur={(e) => {
                        e.target.style.borderColor = "#ced4da";
                        e.target.style.boxShadow = "none";
                    }}
                    placeholder="Ingrese el nombre del producto"
                />
            </div>

            {/* Categoría de Inventario */}
            <div style={{ marginBottom: "20px" }}>
                <label
                    htmlFor="category"
                    style={{
                        display: "block",
                        marginBottom: "8px",
                        fontWeight: "600",
                        color: "#2c3e50",
                        fontSize: "14px",
                        letterSpacing: "0.3px",
                        textTransform: "uppercase",
                        position: "relative",
                        paddingLeft: "12px",
                    }}
                >
                    <span
                        style={{
                            position: "absolute",
                            left: "0",
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: "3px",
                            height: "14px",
                            backgroundColor: "#3498db",
                            borderRadius: "2px",
                        }}
                    ></span>
                    🏷️ Categoría de Inventario *
                </label>
                <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    disabled={isLoadingCategories}
                    style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "4px",
                        border: "1px solid #ced4da",
                        fontSize: "16px",
                        boxSizing: "border-box",
                        backgroundColor: isLoadingCategories
                            ? "#f8f9fa"
                            : "#ffffff",
                        transition:
                            "border-color 0.2s ease, box-shadow 0.2s ease",
                        outline: "none",
                        cursor: "pointer",
                        backgroundImage:
                            "url(\"data:image/svg+xml;utf8,<svg fill='%23495057' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/><path d='M0 0h24v24H0z' fill='none'/></svg>\")",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 10px center",
                        backgroundSize: "20px",
                        appearance: "none",
                        WebkitAppearance: "none",
                        MozAppearance: "none",
                    }}
                    onFocus={(e) => {
                        e.target.style.borderColor = "#80bdff";
                        e.target.style.boxShadow =
                            "0 0 0 0.2rem rgba(0,123,255,.25)";
                    }}
                    onBlur={(e) => {
                        e.target.style.borderColor = "#ced4da";
                        e.target.style.boxShadow = "none";
                    }}
                >
                    <option value="">
                        {isLoadingCategories
                            ? "Cargando categorías..."
                            : "Seleccione una categoría"}
                    </option>
                    {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                            {category.name}
                        </option>
                    ))}
                </select>
                <p
                    style={{
                        fontSize: "12px",
                        color: "#6c757d",
                        marginTop: "5px",
                        marginBottom: "0",
                    }}
                >
                    Esta es la categoría de inventario (diferente a la categoría
                    SKU)
                </p>
            </div>

            {/* Tipo de Producto */}
            <div style={{ marginBottom: "20px" }}>
                <label
                    htmlFor="product_type"
                    style={{
                        display: "block",
                        marginBottom: "8px",
                        fontWeight: "600",
                        color: "#2c3e50",
                        fontSize: "14px",
                        letterSpacing: "0.3px",
                        textTransform: "uppercase",
                        position: "relative",
                        paddingLeft: "12px",
                    }}
                >
                    <span
                        style={{
                            position: "absolute",
                            left: "0",
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: "3px",
                            height: "14px",
                            backgroundColor: "#3498db",
                            borderRadius: "2px",
                        }}
                    ></span>
                    🏷️ Tipo de Producto *
                </label>
                <select
                    id="product_type"
                    name="product_type"
                    value={formData.product_type}
                    onChange={handleInputChange}
                    required
                    style={{
                        width: "300px",
                        padding: "10px",
                        borderRadius: "4px",
                        border: "1px solid #ced4da",
                        fontSize: "16px",
                        boxSizing: "border-box",
                        transition:
                            "border-color 0.2s ease, box-shadow 0.2s ease",
                        outline: "none",
                        cursor: "pointer",
                        backgroundColor: "#fff",
                        backgroundImage:
                            "url(\"data:image/svg+xml;utf8,<svg fill='%23495057' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/><path d='M0 0h24v24H0z' fill='none'/></svg>\")",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 10px center",
                        backgroundSize: "20px",
                        appearance: "none",
                        WebkitAppearance: "none",
                        MozAppearance: "none",
                    }}
                    onFocus={(e) => {
                        e.target.style.borderColor = "#80bdff";
                        e.target.style.boxShadow =
                            "0 0 0 0.2rem rgba(0,123,255,.25)";
                    }}
                    onBlur={(e) => {
                        e.target.style.borderColor = "#ced4da";
                        e.target.style.boxShadow = "none";
                    }}
                >
                    <option value="">Seleccione el tipo de producto</option>
                    <option value="simple">Producto Simple</option>
                    <option value="composite">Producto Compuesto</option>
                </select>
                <p
                    style={{
                        fontSize: "12px",
                        color: "#6c757d",
                        marginTop: "5px",
                        marginBottom: "0",
                    }}
                >
                    Simple: Producto individual | Compuesto: Producto formado
                    por otros productos
                </p>
            </div>

            {/* Manejo por Lotes */}
            <div style={{ marginBottom: "20px" }}>
                <label
                    htmlFor="requires_batch_control"
                    style={{
                        display: "block",
                        marginBottom: "8px",
                        fontWeight: "600",
                        color: "#2c3e50",
                        fontSize: "14px",
                        letterSpacing: "0.3px",
                        textTransform: "uppercase",
                        position: "relative",
                        paddingLeft: "12px",
                    }}
                >
                    <span
                        style={{
                            position: "absolute",
                            left: "0",
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: "3px",
                            height: "14px",
                            backgroundColor: "#3498db",
                            borderRadius: "2px",
                        }}
                    ></span>
                    📦 Manejo por Lotes
                </label>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "12px",
                        border: "1px solid #ced4da",
                        borderRadius: "8px",
                        backgroundColor: "#f8f9fa",
                    }}
                >
                    <input
                        type="checkbox"
                        id="requires_batch_control"
                        name="requires_batch_control"
                        checked={formData.requires_batch_control}
                        onChange={(e) => {
                            handleInputChange({
                                target: {
                                    name: "requires_batch_control",
                                    type: "checkbox",
                                    checked: e.target.checked,
                                    value: e.target.checked,
                                },
                            });
                        }}
                        style={{
                            width: "20px",
                            height: "20px",
                            cursor: "pointer",
                            accentColor: "#3498db",
                        }}
                    />
                    <div>
                        <label
                            htmlFor="requires_batch_control"
                            style={{
                                fontSize: "16px",
                                fontWeight: "500",
                                color: "#2c3e50",
                                cursor: "pointer",
                                marginBottom: "4px",
                                display: "block",
                            }}
                        >
                            Este producto requiere manejo por lotes
                        </label>
                        <p
                            style={{
                                fontSize: "12px",
                                color: "#6c757d",
                                margin: "0",
                            }}
                        >
                            Activar si el producto necesita seguimiento de
                            lotes, fechas de vencimiento o códigos de lote
                            específicos
                        </p>
                    </div>
                </div>
            </div>

            {/* Unidad de Medida */}
            <div style={{ marginBottom: "20px" }}>
                <label
                    htmlFor="unit"
                    style={{
                        display: "block",
                        marginBottom: "8px",
                        fontWeight: "600",
                        color: "#2c3e50",
                        fontSize: "14px",
                        letterSpacing: "0.3px",
                        textTransform: "uppercase",
                        position: "relative",
                        paddingLeft: "12px",
                    }}
                >
                    <span
                        style={{
                            position: "absolute",
                            left: "0",
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: "3px",
                            height: "14px",
                            backgroundColor: "#3498db",
                            borderRadius: "2px",
                        }}
                    ></span>
                    📏 Unidad de Medida *
                </label>
                <select
                    id="unit"
                    name="unit"
                    value={formData.unit}
                    onChange={handleInputChange}
                    required
                    style={{
                        width: "300px",
                        padding: "10px",
                        borderRadius: "4px",
                        border: "1px solid #ced4da",
                        fontSize: "16px",
                        boxSizing: "border-box",
                        transition:
                            "border-color 0.2s ease, box-shadow 0.2s ease",
                        outline: "none",
                        cursor: "pointer",
                        backgroundColor: "#fff",
                        backgroundImage:
                            "url(\"data:image/svg+xml;utf8,<svg fill='%23495057' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/><path d='M0 0h24v24H0z' fill='none'/></svg>\")",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 10px center",
                        backgroundSize: "20px",
                        appearance: "none",
                        WebkitAppearance: "none",
                        MozAppearance: "none",
                    }}
                    onFocus={(e) => {
                        e.target.style.borderColor = "#80bdff";
                        e.target.style.boxShadow =
                            "0 0 0 0.2rem rgba(0,123,255,.25)";
                    }}
                    onBlur={(e) => {
                        e.target.style.borderColor = "#ced4da";
                        e.target.style.boxShadow = "none";
                    }}
                >
                    <option value="">Seleccione una unidad</option>
                    <option value="unidad">Unidad</option>
                    <option value="caja">Caja</option>
                    <option value="paquete">Paquete</option>
                    <option value="tubo">Tubo</option>
                    <option value="frasco">Frasco</option>
                    <option value="ampolla">Ampolla</option>
                    <option value="sobre">Sobre</option>
                    <option value="kit">Kit</option>
                    <option value="set">Set</option>
                    <option value="ml">Mililitro (ml)</option>
                    <option value="gr">Gramo (gr)</option>
                </select>
            </div>
        </div>
    );
};

export default BasicInfoForm;
