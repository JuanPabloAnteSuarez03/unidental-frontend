import React, { useState } from "react";
import ReportesHeader from "../components/Reportes/ReportesHeader";
import VentasSection from "../components/Reportes/VentasSection";
import ComprasSection from "../components/Reportes/ComprasSection";
import ReportesStyles from "../components/Reportes/ReportesStyles";

const ReportesPage = () => {
    const [activeSection, setActiveSection] = useState("ventas");
    const [mostrarModalMovimiento, setMostrarModalMovimiento] = useState(false);
    const [montoMovimiento, setMontoMovimiento] = useState("");

    const handleAgregarMovimientoCaja = () => {
        setMostrarModalMovimiento(true);
    };

    // Función para formatear el número como dinero
    const formatearDinero = (valor) => {
        if (!valor) return "";
        
        // Remover todo excepto números y punto decimal
        const numeroLimpio = valor.replace(/[^\d.]/g, "");
        
        // Dividir en parte entera y decimal
        const partes = numeroLimpio.split(".");
        let parteEntera = partes[0];
        let parteDecimal = partes[1];
        
        // Formatear la parte entera con separadores de miles
        parteEntera = parteEntera.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        
        // Construir el valor final
        let valorFormateado = "$" + parteEntera;
        
        // Agregar la parte decimal si existe
        if (parteDecimal !== undefined) {
            // Limitar a 2 decimales
            parteDecimal = parteDecimal.substring(0, 2);
            valorFormateado += "." + parteDecimal;
        }
        
        return valorFormateado;
    };

    // Función para obtener el valor numérico sin formato
    const obtenerValorNumerico = (valorFormateado) => {
        if (!valorFormateado) return "";
        return valorFormateado.replace(/[$,]/g, "");
    };

    // Manejar cambios en el campo de monto
    const manejarCambioMonto = (e) => {
        let valor = e.target.value;
        
        // Si está borrando y queda solo el signo $, limpiar completamente
        if (valor === "$") {
            setMontoMovimiento("");
            return;
        }
        
        // Obtener valor numérico sin formato
        const valorNumerico = obtenerValorNumerico(valor);
        
        // Validar que solo contenga números y máximo un punto decimal
        const regex = /^\d*\.?\d{0,2}$/;
        if (regex.test(valorNumerico) && parseFloat(valorNumerico || 0) >= 0) {
            setMontoMovimiento(valorNumerico);
        }
    };

    // Componente Modal para Movimiento de Caja
    const ModalMovimientoCaja = () => {
        if (!mostrarModalMovimiento) return null;

        return (
            <div
                style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1000,
                }}
                onClick={() => setMostrarModalMovimiento(false)}
            >
                <div
                    style={{
                        backgroundColor: "white",
                        borderRadius: "12px",
                        padding: "32px",
                        width: "90%",
                        maxWidth: "500px",
                        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
                        position: "relative",
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header del Modal */}
                    <div style={{ marginBottom: "24px" }}>
                        <h2
                            style={{
                                margin: 0,
                                fontSize: "24px",
                                fontWeight: "700",
                                color: "#2c3e50",
                                marginBottom: "8px",
                            }}
                        >
                            Agregar Movimiento de Caja
                        </h2>
                        <p
                            style={{
                                margin: 0,
                                color: "#7f8c8d",
                                fontSize: "16px",
                            }}
                        >
                            Registra un nuevo movimiento de caja
                        </p>
                    </div>

                    {/* Checkbox para indicar si es una compra */}
                    <div style={{ marginBottom: "24px" }}>
                        <label
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                cursor: "pointer",
                                fontSize: "16px",
                                fontWeight: "500",
                                color: "#2c3e50",
                            }}
                        >
                            <input
                                type="checkbox"
                                style={{
                                    width: "20px",
                                    height: "20px",
                                    cursor: "pointer",
                                }}
                            />
                            ¿Es una compra?
                        </label>
                    </div>

                    {/* Campo para el monto */}
                    <div style={{ marginBottom: "32px" }}>
                        <label
                            style={{
                                display: "block",
                                marginBottom: "8px",
                                fontSize: "16px",
                                fontWeight: "500",
                                color: "#2c3e50",
                            }}
                        >
                            Monto del movimiento
                        </label>
                        <input
                            type="text"
                            value={formatearDinero(montoMovimiento)}
                            placeholder="$0.00"
                            style={{
                                width: "100%",
                                padding: "12px 16px",
                                borderRadius: "8px",
                                border: "2px solid #e3eaf3",
                                fontSize: "16px",
                                outline: "none",
                                transition: "border-color 0.2s",
                                boxSizing: "border-box",
                                fontFamily: "monospace",
                                textAlign: "right",
                            }}
                            onChange={manejarCambioMonto}
                            onKeyDown={(e) => {
                                // Permitir teclas de control
                                const teclasPermitidas = [
                                    'Backspace', 'Delete', 'Tab', 'Enter',
                                    'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
                                    'Home', 'End'
                                ];
                                
                                // Permitir Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                                if (e.ctrlKey && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) {
                                    return;
                                }
                                
                                // Si es una tecla permitida, continuar
                                if (teclasPermitidas.includes(e.key)) {
                                    return;
                                }
                                
                                // Permitir números
                                if (e.key >= '0' && e.key <= '9') {
                                    return;
                                }
                                
                                // Permitir punto decimal solo si no existe uno ya
                                if (e.key === '.' && !montoMovimiento.includes('.')) {
                                    return;
                                }
                                
                                // Bloquear cualquier otra tecla
                                e.preventDefault();
                            }}
                            onPaste={(e) => {
                                e.preventDefault();
                                const pastedData = e.clipboardData.getData('text');
                                // Limpiar datos pegados y verificar si es un número válido
                                const numeroLimpio = pastedData.replace(/[^\d.]/g, '');
                                const regex = /^\d*\.?\d{0,2}$/;
                                if (regex.test(numeroLimpio) && parseFloat(numeroLimpio || 0) >= 0) {
                                    setMontoMovimiento(numeroLimpio);
                                }
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = "#3498db";
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = "#e3eaf3";
                                // Formatear automáticamente con dos decimales si tiene valor
                                if (montoMovimiento && !montoMovimiento.includes('.')) {
                                    setMontoMovimiento(montoMovimiento + '.00');
                                } else if (montoMovimiento && montoMovimiento.includes('.') && montoMovimiento.split('.')[1].length === 1) {
                                    setMontoMovimiento(montoMovimiento + '0');
                                }
                            }}
                        />
                        {/* Mostrar el valor numérico para debugging (opcional, se puede quitar) */}
                        {montoMovimiento && (
                            <small style={{ color: "#7f8c8d", fontSize: "12px", marginTop: "4px", display: "block" }}>
                                Valor numérico: {montoMovimiento}
                            </small>
                        )}
                    </div>

                    {/* Botones de acción */}
                    <div
                        style={{
                            display: "flex",
                            gap: "12px",
                            justifyContent: "flex-end",
                        }}
                    >
                        <button
                            onClick={() => {
                                setMostrarModalMovimiento(false);
                                setMontoMovimiento(""); // Limpiar el campo al cerrar
                            }}
                            style={{
                                padding: "12px 24px",
                                borderRadius: "8px",
                                border: "2px solid #e3eaf3",
                                backgroundColor: "white",
                                color: "#2c3e50",
                                fontWeight: "600",
                                fontSize: "16px",
                                cursor: "pointer",
                                transition: "all 0.2s",
                            }}
                            onMouseOver={(e) => {
                                e.target.style.backgroundColor = "#f8f9fa";
                            }}
                            onMouseOut={(e) => {
                                e.target.style.backgroundColor = "white";
                            }}
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={() => {
                                // Aquí se puede agregar la lógica para guardar el movimiento
                                console.log("Guardando movimiento de caja...");
                                console.log("Monto:", montoMovimiento);
                                console.log("Monto formateado:", formatearDinero(montoMovimiento));
                                setMostrarModalMovimiento(false);
                                setMontoMovimiento(""); // Limpiar el campo al cerrar
                            }}
                            style={{
                                padding: "12px 24px",
                                borderRadius: "8px",
                                border: "none",
                                background: "linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)",
                                color: "white",
                                fontWeight: "600",
                                fontSize: "16px",
                                cursor: "pointer",
                                transition: "all 0.2s",
                            }}
                            onMouseOver={(e) => {
                                e.target.style.transform = "translateY(-1px)";
                                e.target.style.boxShadow = "0 4px 12px rgba(39,174,96,0.25)";
                            }}
                            onMouseOut={(e) => {
                                e.target.style.transform = "translateY(0)";
                                e.target.style.boxShadow = "none";
                            }}
                        >
                            Guardar
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            <ReportesStyles />

            {/* Header con navegación de secciones */}
            <ReportesHeader
                activeSection={activeSection}
                setActiveSection={setActiveSection}
            />

            {/* Botón para agregar movimiento de caja */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginBottom: "24px",
                }}
            >
                <button
                    onClick={handleAgregarMovimientoCaja}
                    style={{
                        padding: "12px 24px",
                        borderRadius: "8px",
                        border: "none",
                        background: "linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)",
                        color: "white",
                        fontWeight: 700,
                        fontSize: "16px",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        boxShadow: "0 4px 12px rgba(39,174,96,0.25)",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                    }}
                    onMouseOver={(e) => {
                        e.target.style.transform = "translateY(-2px)";
                        e.target.style.boxShadow = "0 6px 16px rgba(39,174,96,0.35)";
                    }}
                    onMouseOut={(e) => {
                        e.target.style.transform = "translateY(0)";
                        e.target.style.boxShadow = "0 4px 12px rgba(39,174,96,0.25)";
                    }}
                >
                    <svg
                        width="20"
                        height="20"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                    </svg>
                    Agregar Movimiento de Caja
                </button>
            </div>

            {/* Contenido de la sección activa */}
            {activeSection === "ventas" && <VentasSection />}
            {activeSection === "compras" && <ComprasSection />}

            {/* Modal para agregar movimiento de caja */}
            <ModalMovimientoCaja />
        </>
    );
};

export default ReportesPage;
