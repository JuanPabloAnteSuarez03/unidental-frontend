import React, { useState, useEffect } from "react";
import { purchasePaymentsService } from "../../services/purchasePaymentsService";
import { cashService } from "../../services/cashService";
import { useAuth } from "../../context/AuthContext";

const PurchaseOrderPaymentsModal = ({
    isOpen,
    onClose,
    orderData,
    onPaymentSuccess,
}) => {
    const { currentUser } = useAuth();
    const [payments, setPayments] = useState([]);
    const [cashes, setCashes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingPayments, setLoadingPayments] = useState(false);
    const [newPayment, setNewPayment] = useState({
        amount: "",
        cash: "",
        notes: "",
    });
    const [error, setError] = useState("");
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [showPaymentDetail, setShowPaymentDetail] = useState(false);

    // Cargar pagos y cajas al abrir el modal o cuando cambia la orden
    useEffect(() => {
        if (isOpen && orderData) {
            loadPayments();
            loadCashes();
        }
    }, [isOpen, orderData]);

    const loadPayments = async () => {
        if (!orderData?.id) return;

        setLoadingPayments(true);
        try {
            const pagos = await purchasePaymentsService.getOrderPayments(
                orderData.id
            );

            // Procesar los pagos para asegurar que tengan información del usuario
            const processedPayments = Array.isArray(pagos)
                ? pagos.map((payment) => {
                      // Si el pago no tiene user_username pero es reciente, asignar el usuario actual
                      if (!payment.user_username && currentUser?.username) {
                          // Verificar si el pago fue creado recientemente (últimos 5 minutos)
                          const paymentDate = new Date(payment.date);
                          const now = new Date();
                          const diffMinutes = (now - paymentDate) / (1000 * 60);

                          // Si el pago es muy reciente, probablemente fue creado por el usuario actual
                          if (diffMinutes < 5) {
                              return {
                                  ...payment,
                                  user_username: currentUser.username,
                              };
                          }
                      }
                      return payment;
                  })
                : [];

            setPayments(processedPayments);
        } catch (error) {
            setError("Error al cargar los pagos");
        } finally {
            setLoadingPayments(false);
        }
    };

    const loadCashes = async () => {
        try {
            const response = await purchasePaymentsService.getCashes();
            setCashes(response || []);
        } catch (error) {
            console.error("Error al cargar cajas:", error);
        }
    };

    const handleInputChange = (field, value) => {
        setNewPayment((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleSubmitPayment = async (e) => {
        e.preventDefault();

        if (!newPayment.amount || parseFloat(newPayment.amount) <= 0) {
            setError("El monto debe ser mayor a 0");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const paymentData = {
                order: orderData.id,
                amount: parseFloat(newPayment.amount),
                cash: newPayment.cash || null,
                notes: newPayment.notes || "",
            };

            // 1. Crear el pago
            const pago = await purchasePaymentsService.createPayment(
                paymentData
            );

            // 2. Si se seleccionó una caja, crear el movimiento de egreso en esa caja
            if (newPayment.cash) {
                try {
                    await cashService.createMovement({
                        cash: newPayment.cash,
                        movement_type: "egreso",
                        amount: parseFloat(newPayment.amount),
                        reference_type: "compra",
                        notes: `Pago de orden de compra #${orderData.id}`,
                        purchase_order: orderData.id,
                    });
                } catch (movErr) {
                    // Si falla el movimiento, mostrar error pero no revertir el pago
                    console.error("Error al crear movimiento de caja:", movErr);
                    setError(
                        "El pago fue registrado, pero no se pudo crear el movimiento de caja. Por favor verifique la caja manualmente."
                    );
                }
            }

            setNewPayment({ amount: "", cash: "", notes: "" });

            // Recargar pagos y marcar el nuevo pago con el usuario actual
            await loadPayments();

            // Alternativamente, podríamos actualizar directamente el estado local para mejor UX:
            // setPayments(prev => [...prev, { ...pago, user_username: currentUser?.username }]);

            await loadCashes();
            if (onPaymentSuccess) onPaymentSuccess();
        } catch (error) {
            console.error("Error al crear pago:", error);
            if (error.response?.data?.amount) {
                setError(error.response.data.amount[0]);
            } else {
                setError("Error al procesar el pago");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleAnnulPayment = async (paymentId) => {
        if (!window.confirm("¿Estás seguro de que quieres anular este pago?")) {
            return;
        }

        try {
            // Buscar el pago a anular para obtener caja y monto
            const payment = payments.find((p) => p.id === paymentId);
            await purchasePaymentsService.annulPayment(paymentId);
            // Si el pago tenía caja asociada, reponer el saldo con un ingreso
            if (payment && payment.cash) {
                try {
                    await cashService.createMovement({
                        cash: payment.cash,
                        movement_type: "ingreso",
                        amount: parseFloat(payment.amount),
                        reference_type: "compra",
                        notes: `Reposición por anulación de pago de orden de compra #${orderData.id}`,
                        purchase_order: orderData.id,
                    });
                } catch (movErr) {
                    console.error("Error al reponer saldo en caja:", movErr);
                    setError(
                        "El pago fue anulado, pero no se pudo reponer el saldo en la caja. Por favor verifique la caja manualmente."
                    );
                }
            }
            await loadPayments();
            await loadCashes();
            if (onPaymentSuccess) {
                onPaymentSuccess();
            }
        } catch (error) {
            console.error("Error al anular pago:", error);
            setError("Error al anular el pago");
        }
    };

    const handlePaymentClick = (payment) => {
        setSelectedPayment(payment);
        setShowPaymentDetail(true);
    };

    const handleClosePaymentDetail = () => {
        setShowPaymentDetail(false);
        setSelectedPayment(null);
    };

    // Calcular el total pagado y pendiente SIEMPRE usando el estado actualizado de payments
    const calculateTotalPaid = () => {
        return payments
            .filter((payment) => !payment.is_annulled)
            .reduce((total, payment) => total + parseFloat(payment.amount), 0);
    };

    const calculateRemaining = () => {
        const totalPaid = calculateTotalPaid();
        const totalAmount = parseFloat(orderData?.total_amount || 0);
        return Math.max(0, totalAmount - totalPaid);
    };

    const getPaymentStatus = () => {
        const totalPaid = calculateTotalPaid();
        const totalAmount = parseFloat(orderData?.total_amount || 0);

        if (totalPaid === 0) return { status: "pendiente", color: "#e74c3c" };
        if (totalPaid < totalAmount)
            return { status: "parcial", color: "#f39c12" };
        return { status: "pagada", color: "#27ae60" };
    };

    const paymentStatus = getPaymentStatus();

    // Calcular el máximo permitido para el monto: el menor entre saldo de la caja y lo que falta por pagar
    const getMaxAmount = () => {
        const remaining = calculateRemaining();
        if (!newPayment.cash) return remaining;
        const selectedCash = cashes.find(
            (c) => String(c.id) === String(newPayment.cash)
        );
        if (!selectedCash) return remaining;
        const cashBalance = parseFloat(selectedCash.balance || 0);
        return Math.min(remaining, cashBalance);
    };

    if (!isOpen) return null;

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
                justifyContent: "center",
                alignItems: "center",
                zIndex: 1000,
            }}
        >
            <div
                style={{
                    backgroundColor: "white",
                    borderRadius: "12px",
                    padding: "24px",
                    maxWidth: "800px",
                    width: "90%",
                    maxHeight: "90vh",
                    overflow: "auto",
                }}
            >
                {/* Header */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "24px",
                        borderBottom: "2px solid #ecf0f1",
                        paddingBottom: "16px",
                    }}
                >
                    <div>
                        <h2
                            style={{
                                margin: 0,
                                fontSize: "24px",
                                fontWeight: "600",
                                color: "#2c3e50",
                            }}
                        >
                            Pagos - Orden #{orderData?.id}
                        </h2>
                        <p
                            style={{
                                margin: "4px 0 0 0",
                                color: "#7f8c8d",
                                fontSize: "14px",
                            }}
                        >
                            {orderData?.supplier_details?.name} -{" "}
                            {orderData?.destination_details?.name}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: "none",
                            border: "none",
                            fontSize: "24px",
                            cursor: "pointer",
                            color: "#95a5a6",
                            padding: "4px",
                        }}
                    >
                        ×
                    </button>
                </div>

                {/* Resumen de pagos */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: "16px",
                        marginBottom: "24px",
                    }}
                >
                    <div
                        style={{
                            padding: "16px",
                            backgroundColor: "#f8f9fa",
                            borderRadius: "8px",
                            textAlign: "center",
                        }}
                    >
                        <div
                            style={{
                                fontSize: "12px",
                                color: "#6c757d",
                                marginBottom: "4px",
                            }}
                        >
                            Total Orden
                        </div>
                        <div
                            style={{
                                fontSize: "20px",
                                fontWeight: "600",
                                color: "#2c3e50",
                            }}
                        >
                            $
                            {parseFloat(
                                orderData?.total_amount || 0
                            ).toLocaleString()}
                        </div>
                    </div>
                    <div
                        style={{
                            padding: "16px",
                            backgroundColor: "#e8f5e8",
                            borderRadius: "8px",
                            textAlign: "center",
                        }}
                    >
                        <div
                            style={{
                                fontSize: "12px",
                                color: "#6c757d",
                                marginBottom: "4px",
                            }}
                        >
                            Total Pagado
                        </div>
                        <div
                            style={{
                                fontSize: "20px",
                                fontWeight: "600",
                                color: "#27ae60",
                            }}
                        >
                            ${calculateTotalPaid().toLocaleString()}
                        </div>
                    </div>
                    <div
                        style={{
                            padding: "16px",
                            backgroundColor: "#fff3cd",
                            borderRadius: "8px",
                            textAlign: "center",
                        }}
                    >
                        <div
                            style={{
                                fontSize: "12px",
                                color: "#6c757d",
                                marginBottom: "4px",
                            }}
                        >
                            Pendiente
                        </div>
                        <div
                            style={{
                                fontSize: "20px",
                                fontWeight: "600",
                                color: "#f39c12",
                            }}
                        >
                            ${calculateRemaining().toLocaleString()}
                        </div>
                    </div>
                    <div
                        style={{
                            padding: "16px",
                            backgroundColor: "#f8f9fa",
                            borderRadius: "8px",
                            textAlign: "center",
                        }}
                    >
                        <div
                            style={{
                                fontSize: "12px",
                                color: "#6c757d",
                                marginBottom: "4px",
                            }}
                        >
                            Estado
                        </div>
                        <div
                            style={{
                                fontSize: "16px",
                                fontWeight: "600",
                                color: paymentStatus.color,
                                textTransform: "capitalize",
                            }}
                        >
                            {paymentStatus.status}
                        </div>
                    </div>
                </div>

                {/* Formulario de nuevo pago */}
                <div
                    style={{
                        backgroundColor: "#f8f9fa",
                        padding: "20px",
                        borderRadius: "8px",
                        marginBottom: "24px",
                    }}
                >
                    <h3
                        style={{
                            margin: "0 0 16px 0",
                            fontSize: "18px",
                            fontWeight: "600",
                            color: "#2c3e50",
                        }}
                    >
                        Nuevo Pago
                    </h3>

                    {error && (
                        <div
                            style={{
                                backgroundColor: "#f8d7da",
                                color: "#721c24",
                                padding: "12px",
                                borderRadius: "6px",
                                marginBottom: "16px",
                                fontSize: "14px",
                            }}
                        >
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmitPayment}>
                        <fieldset
                            disabled={paymentStatus.status === "pagada"}
                            style={{ border: 0, padding: 0, margin: 0 }}
                        >
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns:
                                        "repeat(auto-fit, minmax(200px, 1fr))",
                                    gap: "16px",
                                    marginBottom: "16px",
                                }}
                            >
                                <div>
                                    <label
                                        style={{
                                            display: "block",
                                            marginBottom: "6px",
                                            fontSize: "14px",
                                            fontWeight: "500",
                                            color: "#2c3e50",
                                        }}
                                    >
                                        Caja
                                    </label>
                                    <select
                                        value={newPayment.cash}
                                        onChange={(e) =>
                                            handleInputChange(
                                                "cash",
                                                e.target.value
                                            )
                                        }
                                        style={{
                                            width: "100%",
                                            padding: "10px 12px",
                                            border: "1px solid #ddd",
                                            borderRadius: "6px",
                                            fontSize: "14px",
                                        }}
                                    >
                                        <option value="">
                                            Seleccionar caja (opcional)
                                        </option>
                                        {cashes.map((cash) => (
                                            <option
                                                key={cash.id}
                                                value={cash.id}
                                            >
                                                {cash.location_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label
                                        style={{
                                            display: "block",
                                            marginBottom: "6px",
                                            fontSize: "14px",
                                            fontWeight: "500",
                                            color: "#2c3e50",
                                        }}
                                    >
                                        Monto *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        max={getMaxAmount()}
                                        value={newPayment.amount}
                                        onChange={(e) => {
                                            let value = e.target.value;
                                            // Limitar manualmente si el usuario escribe un valor mayor
                                            const max = getMaxAmount();
                                            if (parseFloat(value) > max)
                                                value = max;
                                            handleInputChange("amount", value);
                                        }}
                                        style={{
                                            width: "100%",
                                            padding: "10px 12px",
                                            border: "1px solid #ddd",
                                            borderRadius: "6px",
                                            fontSize: "14px",
                                        }}
                                        placeholder="0.00"
                                        required
                                    />
                                    <div
                                        style={{
                                            fontSize: "12px",
                                            color: "#6c757d",
                                            marginTop: "4px",
                                        }}
                                    >
                                        Máximo: $
                                        {getMaxAmount().toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginBottom: "16px" }}>
                                <label
                                    style={{
                                        display: "block",
                                        marginBottom: "6px",
                                        fontSize: "14px",
                                        fontWeight: "500",
                                        color: "#2c3e50",
                                    }}
                                >
                                    Notas
                                </label>
                                <textarea
                                    value={newPayment.notes}
                                    onChange={(e) =>
                                        handleInputChange(
                                            "notes",
                                            e.target.value
                                        )
                                    }
                                    style={{
                                        width: "100%",
                                        padding: "10px 12px",
                                        border: "1px solid #ddd",
                                        borderRadius: "6px",
                                        fontSize: "14px",
                                        minHeight: "80px",
                                        resize: "vertical",
                                    }}
                                    placeholder="Notas adicionales sobre el pago..."
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || calculateRemaining() <= 0}
                                style={{
                                    backgroundColor:
                                        loading || calculateRemaining() <= 0
                                            ? "#95a5a6"
                                            : "#3498db",
                                    color: "white",
                                    border: "none",
                                    padding: "12px 24px",
                                    borderRadius: "6px",
                                    fontSize: "14px",
                                    fontWeight: "500",
                                    cursor:
                                        loading || calculateRemaining() <= 0
                                            ? "not-allowed"
                                            : "pointer",
                                    opacity:
                                        loading || calculateRemaining() <= 0
                                            ? 0.7
                                            : 1,
                                }}
                            >
                                {loading ? "Procesando..." : "Registrar Pago"}
                            </button>
                        </fieldset>
                        {paymentStatus.status === "pagada" && (
                            <div
                                style={{
                                    color: "#27ae60",
                                    fontWeight: 600,
                                    marginTop: 12,
                                }}
                            >
                                Esta orden ya está pagada. No se pueden
                                registrar más abonos.
                            </div>
                        )}
                    </form>
                </div>

                {/* Lista de pagos */}
                <div>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "16px",
                        }}
                    >
                        <h3
                            style={{
                                margin: 0,
                                fontSize: "18px",
                                fontWeight: "600",
                                color: "#2c3e50",
                            }}
                        >
                            Historial de Pagos
                        </h3>
                        {payments.length > 0 && (
                            <div
                                style={{
                                    fontSize: "12px",
                                    color: "#6c757d",
                                    fontStyle: "italic",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                }}
                            >
                                <span>👆</span>
                                Haz clic en un pago para ver detalles
                            </div>
                        )}
                    </div>

                    {loadingPayments ? (
                        <div
                            style={{
                                textAlign: "center",
                                padding: "40px",
                                color: "#6c757d",
                            }}
                        >
                            Cargando pagos...
                        </div>
                    ) : payments.length === 0 ? (
                        <div
                            style={{
                                textAlign: "center",
                                padding: "40px",
                                color: "#6c757d",
                                backgroundColor: "#f8f9fa",
                                borderRadius: "8px",
                            }}
                        >
                            No se han realizado pagos para esta orden
                        </div>
                    ) : (
                        <div
                            style={{
                                backgroundColor: "white",
                                borderRadius: "8px",
                                overflow: "hidden",
                                border: "1px solid #e9ecef",
                            }}
                        >
                            <table
                                style={{
                                    width: "100%",
                                    borderCollapse: "collapse",
                                }}
                            >
                                <thead>
                                    <tr
                                        style={{
                                            backgroundColor: "#f8f9fa",
                                        }}
                                    >
                                        <th
                                            style={{
                                                padding: "12px 16px",
                                                textAlign: "left",
                                                fontSize: "14px",
                                                fontWeight: "600",
                                                color: "#495057",
                                                borderBottom:
                                                    "1px solid #dee2e6",
                                            }}
                                        >
                                            Fecha
                                        </th>
                                        <th
                                            style={{
                                                padding: "12px 16px",
                                                textAlign: "left",
                                                fontSize: "14px",
                                                fontWeight: "600",
                                                color: "#495057",
                                                borderBottom:
                                                    "1px solid #dee2e6",
                                            }}
                                        >
                                            Monto
                                        </th>
                                        <th
                                            style={{
                                                padding: "12px 16px",
                                                textAlign: "left",
                                                fontSize: "14px",
                                                fontWeight: "600",
                                                color: "#495057",
                                                borderBottom:
                                                    "1px solid #dee2e6",
                                            }}
                                        >
                                            Caja
                                        </th>
                                        <th
                                            style={{
                                                padding: "12px 16px",
                                                textAlign: "left",
                                                fontSize: "14px",
                                                fontWeight: "600",
                                                color: "#495057",
                                                borderBottom:
                                                    "1px solid #dee2e6",
                                            }}
                                        >
                                            Usuario
                                        </th>

                                        <th
                                            style={{
                                                padding: "12px 16px",
                                                textAlign: "left",
                                                fontSize: "14px",
                                                fontWeight: "600",
                                                color: "#495057",
                                                borderBottom:
                                                    "1px solid #dee2e6",
                                            }}
                                        >
                                            Estado
                                        </th>
                                        <th
                                            style={{
                                                padding: "12px 16px",
                                                textAlign: "center",
                                                fontSize: "14px",
                                                fontWeight: "600",
                                                color: "#495057",
                                                borderBottom:
                                                    "1px solid #dee2e6",
                                            }}
                                        >
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payments.map((payment) => (
                                        <tr
                                            key={payment.id}
                                            onClick={() =>
                                                handlePaymentClick(payment)
                                            }
                                            style={{
                                                borderBottom:
                                                    "1px solid #f1f3f4",
                                                cursor: "pointer",
                                                transition:
                                                    "background-color 0.2s ease",
                                            }}
                                            onMouseOver={(e) => {
                                                e.currentTarget.style.backgroundColor =
                                                    "#f8f9fa";
                                            }}
                                            onMouseOut={(e) => {
                                                e.currentTarget.style.backgroundColor =
                                                    "transparent";
                                            }}
                                        >
                                            <td
                                                style={{
                                                    padding: "12px 16px",
                                                    fontSize: "14px",
                                                    color: "#495057",
                                                }}
                                            >
                                                {new Date(
                                                    payment.date
                                                ).toLocaleDateString("es-ES", {
                                                    year: "numeric",
                                                    month: "short",
                                                    day: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </td>
                                            <td
                                                style={{
                                                    padding: "12px 16px",
                                                    fontSize: "14px",
                                                    fontWeight: "600",
                                                    color: "#2c3e50",
                                                }}
                                            >
                                                $
                                                {parseFloat(
                                                    payment.amount
                                                ).toLocaleString()}
                                            </td>
                                            <td
                                                style={{
                                                    padding: "12px 16px",
                                                    fontSize: "14px",
                                                    color: "#6c757d",
                                                }}
                                            >
                                                {payment.cash_name ||
                                                    "No especificada"}
                                            </td>
                                            <td
                                                style={{
                                                    padding: "12px 16px",
                                                    fontSize: "14px",
                                                    color: "#6c757d",
                                                }}
                                            >
                                                {payment.user_username ||
                                                    currentUser?.username ||
                                                    "Sistema"}
                                            </td>

                                            <td
                                                style={{
                                                    padding: "12px 16px",
                                                    fontSize: "14px",
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        padding: "4px 8px",
                                                        borderRadius: "4px",
                                                        fontSize: "12px",
                                                        fontWeight: "500",
                                                        backgroundColor:
                                                            payment.is_annulled
                                                                ? "#f8d7da"
                                                                : "#d4edda",
                                                        color: payment.is_annulled
                                                            ? "#721c24"
                                                            : "#155724",
                                                    }}
                                                >
                                                    {payment.is_annulled
                                                        ? "Anulado"
                                                        : "Activo"}
                                                </span>
                                            </td>
                                            <td
                                                style={{
                                                    padding: "12px 16px",
                                                    textAlign: "center",
                                                }}
                                            >
                                                {!payment.is_annulled && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleAnnulPayment(
                                                                payment.id
                                                            );
                                                        }}
                                                        style={{
                                                            backgroundColor:
                                                                "#dc3545",
                                                            color: "white",
                                                            border: "none",
                                                            padding: "6px 12px",
                                                            borderRadius: "4px",
                                                            fontSize: "12px",
                                                            cursor: "pointer",
                                                        }}
                                                    >
                                                        Anular
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de detalle del pago */}
            {showPaymentDetail && selectedPayment && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        zIndex: 10000,
                    }}
                    onClick={handleClosePaymentDetail}
                >
                    <div
                        style={{
                            backgroundColor: "white",
                            borderRadius: "12px",
                            padding: "24px",
                            maxWidth: "500px",
                            width: "90%",
                            maxHeight: "80vh",
                            overflow: "auto",
                            position: "relative",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "20px",
                                borderBottom: "2px solid #ecf0f1",
                                paddingBottom: "16px",
                            }}
                        >
                            <h3
                                style={{
                                    margin: 0,
                                    fontSize: "20px",
                                    fontWeight: "600",
                                    color: "#2c3e50",
                                }}
                            >
                                Detalle del Pago
                            </h3>
                            <button
                                onClick={handleClosePaymentDetail}
                                style={{
                                    background: "none",
                                    border: "none",
                                    fontSize: "24px",
                                    cursor: "pointer",
                                    color: "#95a5a6",
                                    padding: "4px",
                                }}
                            >
                                ×
                            </button>
                        </div>

                        {/* Detalles del pago */}
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "16px",
                            }}
                        >
                            {/* Información básica */}
                            <div
                                style={{
                                    padding: "16px",
                                    backgroundColor: "#f8f9fa",
                                    borderRadius: "8px",
                                    border: "1px solid #e9ecef",
                                }}
                            >
                                <h4
                                    style={{
                                        margin: "0 0 12px 0",
                                        color: "#2c3e50",
                                        fontSize: "16px",
                                    }}
                                >
                                    Información del Pago
                                </h4>
                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "1fr 1fr",
                                        gap: "12px",
                                    }}
                                >
                                    <div>
                                        <label
                                            style={{
                                                fontSize: "12px",
                                                color: "#6c757d",
                                                fontWeight: "600",
                                            }}
                                        >
                                            FECHA
                                        </label>
                                        <div
                                            style={{
                                                fontSize: "14px",
                                                color: "#2c3e50",
                                                fontWeight: "500",
                                            }}
                                        >
                                            {new Date(
                                                selectedPayment.date
                                            ).toLocaleDateString("es-ES", {
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </div>
                                    </div>
                                    <div>
                                        <label
                                            style={{
                                                fontSize: "12px",
                                                color: "#6c757d",
                                                fontWeight: "600",
                                            }}
                                        >
                                            MONTO
                                        </label>
                                        <div
                                            style={{
                                                fontSize: "18px",
                                                color: "#27ae60",
                                                fontWeight: "700",
                                            }}
                                        >
                                            $
                                            {parseFloat(
                                                selectedPayment.amount
                                            ).toLocaleString()}
                                        </div>
                                    </div>
                                    <div>
                                        <label
                                            style={{
                                                fontSize: "12px",
                                                color: "#6c757d",
                                                fontWeight: "600",
                                            }}
                                        >
                                            CAJA
                                        </label>
                                        <div
                                            style={{
                                                fontSize: "14px",
                                                color: "#2c3e50",
                                            }}
                                        >
                                            {selectedPayment.cash_name ||
                                                "No especificada"}
                                        </div>
                                    </div>
                                    <div>
                                        <label
                                            style={{
                                                fontSize: "12px",
                                                color: "#6c757d",
                                                fontWeight: "600",
                                            }}
                                        >
                                            USUARIO
                                        </label>
                                        <div
                                            style={{
                                                fontSize: "14px",
                                                color: "#2c3e50",
                                            }}
                                        >
                                            {selectedPayment.user_username ||
                                                currentUser?.username ||
                                                "Sistema"}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Estado del pago */}
                            <div
                                style={{
                                    padding: "16px",
                                    backgroundColor: selectedPayment.is_annulled
                                        ? "#fff5f5"
                                        : "#f0f8f0",
                                    borderRadius: "8px",
                                    border: `1px solid ${
                                        selectedPayment.is_annulled
                                            ? "#fecaca"
                                            : "#bbf7d0"
                                    }`,
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                    }}
                                >
                                    <span style={{ fontSize: "20px" }}>
                                        {selectedPayment.is_annulled
                                            ? "❌"
                                            : "✅"}
                                    </span>
                                    <div>
                                        <label
                                            style={{
                                                fontSize: "12px",
                                                color: "#6c757d",
                                                fontWeight: "600",
                                            }}
                                        >
                                            ESTADO
                                        </label>
                                        <div
                                            style={{
                                                fontSize: "16px",
                                                fontWeight: "600",
                                                color: selectedPayment.is_annulled
                                                    ? "#dc2626"
                                                    : "#16a34a",
                                            }}
                                        >
                                            {selectedPayment.is_annulled
                                                ? "Pago Anulado"
                                                : "Pago Activo"}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Notas */}
                            <div
                                style={{
                                    padding: "16px",
                                    backgroundColor: "#fffbeb",
                                    borderRadius: "8px",
                                    border: "1px solid #fde68a",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "flex-start",
                                        gap: "8px",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: "20px",
                                            marginTop: "2px",
                                        }}
                                    >
                                        📝
                                    </span>
                                    <div style={{ flex: 1 }}>
                                        <label
                                            style={{
                                                fontSize: "12px",
                                                color: "#6c757d",
                                                fontWeight: "600",
                                            }}
                                        >
                                            NOTAS
                                        </label>
                                        <div
                                            style={{
                                                fontSize: "14px",
                                                color: "#2c3e50",
                                                lineHeight: "1.5",
                                                marginTop: "4px",
                                                minHeight: "20px",
                                            }}
                                        >
                                            {selectedPayment.notes ? (
                                                selectedPayment.notes
                                            ) : (
                                                <span
                                                    style={{
                                                        color: "#9ca3af",
                                                        fontStyle: "italic",
                                                    }}
                                                >
                                                    Sin notas adicionales
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PurchaseOrderPaymentsModal;
