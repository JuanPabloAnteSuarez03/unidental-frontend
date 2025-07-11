import React from "react";

const ReportesInfo = ({ stats }) => {
    // Función para formatear cantidad de dinero
    const formatCurrency = (amount) => {
        if (amount === null || amount === undefined) return "-";
        return new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
        }).format(amount);
    };

    // Determinar si son estadísticas de ventas o compras
    const isSales = stats && stats.hasOwnProperty("totalSales");
    const isPurchases = stats && stats.hasOwnProperty("totalPurchases");

    return (
        <div
            style={{
                padding: "24px",
                backgroundColor: "#f8f9fa",
                borderRadius: "12px",
                border: "1px solid #e9ecef",
                marginBottom: "24px",
            }}
        >
            {stats && (isSales || isPurchases) ? (
                <div>
                    <h3 style={{ color: "#2c3e50", marginBottom: "16px" }}>
                        Estadísticas {isSales ? "de Ventas" : "de Compras"}
                    </h3>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(auto-fit, minmax(250px, 1fr))",
                            gap: "24px",
                            marginBottom: "20px",
                        }}
                    >
                        {isSales && (
                            <>
                                {/* Total Ventas */}
                                <div
                                    style={{
                                        padding: "24px",
                                        backgroundColor: "white",
                                        borderRadius: "16px",
                                        textAlign: "center",
                                        color: "#333",
                                        boxShadow:
                                            "0 4px 12px rgba(0, 0, 0, 0.1)",
                                        transition:
                                            "transform 0.3s ease, box-shadow 0.3s ease",
                                        cursor: "pointer",
                                        borderTop: "4px solid #667eea",
                                        position: "relative",
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.transform =
                                            "translateY(-4px)";
                                        e.currentTarget.style.boxShadow =
                                            "0 8px 24px rgba(0, 0, 0, 0.15)";
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.transform =
                                            "translateY(0)";
                                        e.currentTarget.style.boxShadow =
                                            "0 4px 12px rgba(0, 0, 0, 0.1)";
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: "14px",
                                            color: "#667eea",
                                            marginBottom: "8px",
                                            pointerEvents: "none",
                                        }}
                                    >
                                        📊
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "32px",
                                            fontWeight: "800",
                                            marginBottom: "8px",
                                            color: "#2c3e50",
                                            pointerEvents: "none",
                                        }}
                                    >
                                        {stats.totalSales}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "16px",
                                            fontWeight: "600",
                                            color: "#6c757d",
                                            pointerEvents: "none",
                                        }}
                                    >
                                        Total Ventas
                                    </div>
                                </div>

                                {/* Ingresos Totales */}
                                <div
                                    style={{
                                        padding: "24px",
                                        backgroundColor: "white",
                                        borderRadius: "16px",
                                        textAlign: "center",
                                        color: "#333",
                                        boxShadow:
                                            "0 4px 12px rgba(0, 0, 0, 0.1)",
                                        transition:
                                            "transform 0.3s ease, box-shadow 0.3s ease",
                                        cursor: "pointer",
                                        borderTop: "4px solid #11998e",
                                        position: "relative",
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.transform =
                                            "translateY(-4px)";
                                        e.currentTarget.style.boxShadow =
                                            "0 8px 24px rgba(0, 0, 0, 0.15)";
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.transform =
                                            "translateY(0)";
                                        e.currentTarget.style.boxShadow =
                                            "0 4px 12px rgba(0, 0, 0, 0.1)";
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: "14px",
                                            color: "#11998e",
                                            marginBottom: "8px",
                                            pointerEvents: "none",
                                        }}
                                    >
                                        💰
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "28px",
                                            fontWeight: "800",
                                            marginBottom: "8px",
                                            color: "#2c3e50",
                                            pointerEvents: "none",
                                        }}
                                    >
                                        {formatCurrency(stats.totalRevenue)}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "16px",
                                            fontWeight: "600",
                                            color: "#6c757d",
                                            pointerEvents: "none",
                                        }}
                                    >
                                        Ingresos Totales
                                    </div>
                                </div>

                                {/* Venta Promedio */}
                                <div
                                    style={{
                                        padding: "24px",
                                        backgroundColor: "white",
                                        borderRadius: "16px",
                                        textAlign: "center",
                                        color: "#333",
                                        boxShadow:
                                            "0 4px 12px rgba(0, 0, 0, 0.1)",
                                        transition:
                                            "transform 0.3s ease, box-shadow 0.3s ease",
                                        cursor: "pointer",
                                        borderTop: "4px solid #f093fb",
                                        position: "relative",
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.transform =
                                            "translateY(-4px)";
                                        e.currentTarget.style.boxShadow =
                                            "0 8px 24px rgba(0, 0, 0, 0.15)";
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.transform =
                                            "translateY(0)";
                                        e.currentTarget.style.boxShadow =
                                            "0 4px 12px rgba(0, 0, 0, 0.1)";
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: "14px",
                                            color: "#f093fb",
                                            marginBottom: "8px",
                                            pointerEvents: "none",
                                        }}
                                    >
                                        📈
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "28px",
                                            fontWeight: "800",
                                            marginBottom: "8px",
                                            color: "#2c3e50",
                                            pointerEvents: "none",
                                        }}
                                    >
                                        {formatCurrency(stats.averageSale)}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "16px",
                                            fontWeight: "600",
                                            color: "#6c757d",
                                            pointerEvents: "none",
                                        }}
                                    >
                                        Venta Promedio
                                    </div>
                                </div>

                                {/* Clientes Únicos */}
                                <div
                                    style={{
                                        padding: "24px",
                                        backgroundColor: "white",
                                        borderRadius: "16px",
                                        textAlign: "center",
                                        color: "#333",
                                        boxShadow:
                                            "0 4px 12px rgba(0, 0, 0, 0.1)",
                                        transition:
                                            "transform 0.3s ease, box-shadow 0.3s ease",
                                        cursor: "pointer",
                                        borderTop: "4px solid #4facfe",
                                        position: "relative",
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.transform =
                                            "translateY(-4px)";
                                        e.currentTarget.style.boxShadow =
                                            "0 8px 24px rgba(0, 0, 0, 0.15)";
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.transform =
                                            "translateY(0)";
                                        e.currentTarget.style.boxShadow =
                                            "0 4px 12px rgba(0, 0, 0, 0.1)";
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: "14px",
                                            color: "#4facfe",
                                            marginBottom: "8px",
                                            pointerEvents: "none",
                                        }}
                                    >
                                        👥
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "32px",
                                            fontWeight: "800",
                                            marginBottom: "8px",
                                            color: "#2c3e50",
                                            pointerEvents: "none",
                                        }}
                                    >
                                        {stats.uniqueCustomers}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "16px",
                                            fontWeight: "600",
                                            color: "#6c757d",
                                            pointerEvents: "none",
                                        }}
                                    >
                                        Clientes Únicos
                                    </div>
                                </div>
                            </>
                        )}
                        {isPurchases && (
                            <>
                                {/* Total Compras */}
                                <div
                                    style={{
                                        padding: "24px",
                                        backgroundColor: "white",
                                        borderRadius: "16px",
                                        textAlign: "center",
                                        color: "#333",
                                        boxShadow:
                                            "0 4px 12px rgba(0, 0, 0, 0.1)",
                                        transition:
                                            "transform 0.3s ease, box-shadow 0.3s ease",
                                        cursor: "pointer",
                                        borderTop: "4px solid #667eea",
                                        position: "relative",
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.transform =
                                            "translateY(-4px)";
                                        e.currentTarget.style.boxShadow =
                                            "0 8px 24px rgba(0, 0, 0, 0.15)";
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.transform =
                                            "translateY(0)";
                                        e.currentTarget.style.boxShadow =
                                            "0 4px 12px rgba(0, 0, 0, 0.1)";
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: "14px",
                                            color: "#667eea",
                                            marginBottom: "8px",
                                            pointerEvents: "none",
                                        }}
                                    >
                                        🛒
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "32px",
                                            fontWeight: "800",
                                            marginBottom: "8px",
                                            color: "#2c3e50",
                                            pointerEvents: "none",
                                        }}
                                    >
                                        {stats.totalPurchases}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "16px",
                                            fontWeight: "600",
                                            color: "#6c757d",
                                            pointerEvents: "none",
                                        }}
                                    >
                                        Total Compras
                                    </div>
                                </div>

                                {/* Gastos Totales */}
                                <div
                                    style={{
                                        padding: "24px",
                                        backgroundColor: "white",
                                        borderRadius: "16px",
                                        textAlign: "center",
                                        color: "#333",
                                        boxShadow:
                                            "0 4px 12px rgba(0, 0, 0, 0.1)",
                                        transition:
                                            "transform 0.3s ease, box-shadow 0.3s ease",
                                        cursor: "pointer",
                                        borderTop: "4px solid #11998e",
                                        position: "relative",
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.transform =
                                            "translateY(-4px)";
                                        e.currentTarget.style.boxShadow =
                                            "0 8px 24px rgba(0, 0, 0, 0.15)";
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.transform =
                                            "translateY(0)";
                                        e.currentTarget.style.boxShadow =
                                            "0 4px 12px rgba(0, 0, 0, 0.1)";
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: "14px",
                                            color: "#11998e",
                                            marginBottom: "8px",
                                            pointerEvents: "none",
                                        }}
                                    >
                                        💸
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "28px",
                                            fontWeight: "800",
                                            marginBottom: "8px",
                                            color: "#2c3e50",
                                            pointerEvents: "none",
                                        }}
                                    >
                                        {formatCurrency(stats.totalSpent)}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "16px",
                                            fontWeight: "600",
                                            color: "#6c757d",
                                            pointerEvents: "none",
                                        }}
                                    >
                                        Gastos Totales
                                    </div>
                                </div>

                                {/* Compra Promedio */}
                                <div
                                    style={{
                                        padding: "24px",
                                        backgroundColor: "white",
                                        borderRadius: "16px",
                                        textAlign: "center",
                                        color: "#333",
                                        boxShadow:
                                            "0 4px 12px rgba(0, 0, 0, 0.1)",
                                        transition:
                                            "transform 0.3s ease, box-shadow 0.3s ease",
                                        cursor: "pointer",
                                        borderTop: "4px solid #f093fb",
                                        position: "relative",
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.transform =
                                            "translateY(-4px)";
                                        e.currentTarget.style.boxShadow =
                                            "0 8px 24px rgba(0, 0, 0, 0.15)";
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.transform =
                                            "translateY(0)";
                                        e.currentTarget.style.boxShadow =
                                            "0 4px 12px rgba(0, 0, 0, 0.1)";
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: "14px",
                                            color: "#f093fb",
                                            marginBottom: "8px",
                                            pointerEvents: "none",
                                        }}
                                    >
                                        📊
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "28px",
                                            fontWeight: "800",
                                            marginBottom: "8px",
                                            color: "#2c3e50",
                                            pointerEvents: "none",
                                        }}
                                    >
                                        {formatCurrency(stats.averagePurchase)}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "16px",
                                            fontWeight: "600",
                                            color: "#6c757d",
                                            pointerEvents: "none",
                                        }}
                                    >
                                        Compra Promedio
                                    </div>
                                </div>

                                {/* Proveedores Únicos */}
                                <div
                                    style={{
                                        padding: "24px",
                                        backgroundColor: "white",
                                        borderRadius: "16px",
                                        textAlign: "center",
                                        color: "#333",
                                        boxShadow:
                                            "0 4px 12px rgba(0, 0, 0, 0.1)",
                                        transition:
                                            "transform 0.3s ease, box-shadow 0.3s ease",
                                        cursor: "pointer",
                                        borderTop: "4px solid #4facfe",
                                        position: "relative",
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.transform =
                                            "translateY(-4px)";
                                        e.currentTarget.style.boxShadow =
                                            "0 8px 24px rgba(0, 0, 0, 0.15)";
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.transform =
                                            "translateY(0)";
                                        e.currentTarget.style.boxShadow =
                                            "0 4px 12px rgba(0, 0, 0, 0.1)";
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: "14px",
                                            color: "#4facfe",
                                            marginBottom: "8px",
                                            pointerEvents: "none",
                                        }}
                                    >
                                        🏢
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "32px",
                                            fontWeight: "800",
                                            marginBottom: "8px",
                                            color: "#2c3e50",
                                            pointerEvents: "none",
                                        }}
                                    >
                                        {stats.uniqueSuppliers}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "16px",
                                            fontWeight: "600",
                                            color: "#6c757d",
                                            pointerEvents: "none",
                                        }}
                                    >
                                        Proveedores Únicos
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            ) : (
                <div>
                    <h3 style={{ color: "#2c3e50", marginBottom: "16px" }}>
                        Información sobre los datos
                    </h3>
                    <div>
                        <h4 style={{ color: "#2c3e50", marginBottom: "8px" }}>
                            Ventas:
                        </h4>
                        <ul
                            style={{
                                marginBottom: "16px",
                                paddingLeft: "20px",
                            }}
                        >
                            <li>
                                <strong>Venta Normal:</strong> Transacciones
                                estándar de venta al público
                            </li>
                            <li>
                                <strong>Venta a Crédito:</strong> Ventas con
                                pago diferido o a crédito
                            </li>
                            <li>
                                <strong>Venta al Por Mayor:</strong> Ventas en
                                grandes cantidades con descuentos
                            </li>
                            <li>
                                <strong>Total Bruto:</strong> Monto antes de
                                impuestos y descuentos
                            </li>
                            <li>
                                <strong>Total Neto:</strong> Monto final después
                                de impuestos y descuentos
                            </li>
                            <li>
                                <strong>Facturada:</strong> Ventas que requieren
                                facturación
                            </li>
                        </ul>
                        <h4 style={{ color: "#2c3e50", marginBottom: "8px" }}>
                            Compras:
                        </h4>
                        <ul style={{ paddingLeft: "20px" }}>
                            <li>
                                <strong>Órdenes de Compra:</strong> Solicitudes
                                de compra a proveedores
                            </li>
                            <li>
                                <strong>Estado:</strong> Estado actual de la
                                orden (Pendiente, Aprobada, Completada, etc.)
                            </li>
                            <li>
                                <strong>Proveedor:</strong> Empresa que
                                suministra los productos
                            </li>
                            <li>
                                <strong>Destino:</strong> Ubicación donde se
                                recibirán los productos
                            </li>
                            <li>
                                <strong>Total:</strong> Monto total de la orden
                                de compra
                            </li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportesInfo;
