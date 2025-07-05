import React, { useEffect, useState } from "react";
import { getCreditAccounts, getDebtSummary } from "../services/salesService";
import { useAuth } from "../context/AuthContext";
import SalesCreditsHeader from "../components/Sales/SalesCredits/SalesCreditsHeader";
import CreditsTable from "../components/Sales/SalesCredits/CreditsTable";
import DebtSummaryTable from "../components/Sales/SalesCredits/DebtSummaryTable";

const API_REGISTER_PAYMENT = "/api/credits/payments/register_payment/";

const SalesCreditsPage = () => {
    const { authToken } = useAuth();
    const [credits, setCredits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCredit, setSelectedCredit] = useState(null);
    const [showPaymentInput, setShowPaymentInput] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState("");
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [paymentError, setPaymentError] = useState(null);
    const [paymentSuccess, setPaymentSuccess] = useState(null);
    const [section, setSection] = useState("creditos");
    // --- ELIMINADO: purchaseOptions, purchaseOptionsLoading, purchaseOptionsError, purchaseOptionsPage, purchaseOptionsTotalPages, purchaseOptionsCount, PURCHASE_OPTIONS_PAGE_SIZE ---

    // Estados para la sección de resumen de deuda
    const [debtSummary, setDebtSummary] = useState([]);
    const [debtSummaryLoading, setDebtSummaryLoading] = useState(false);
    const [debtSummaryError, setDebtSummaryError] = useState(null);

    // Popup de créditos individuales
    const [showClientCredits, setShowClientCredits] = useState(false);
    const [clientCredits, setClientCredits] = useState([]);
    const [clientCreditsLoading, setClientCreditsLoading] = useState(false);
    const [clientCreditsError, setClientCreditsError] = useState(null);
    const [selectedClient, setSelectedClient] = useState(null);

    useEffect(() => {
        if (section !== "creditos") return;
        const fetchCredits = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await getCreditAccounts(authToken);
                setCredits(data.results || data || []);
            } catch (err) {
                setError("Error al cargar las cuentas de crédito");
            } finally {
                setLoading(false);
            }
        };
        if (authToken) fetchCredits();
    }, [authToken, section]);

    useEffect(() => {
        if (section !== "otra") return;
        const fetchDebtSummary = async () => {
            setDebtSummaryLoading(true);
            setDebtSummaryError(null);
            try {
                const data = await getDebtSummary(authToken);
                setDebtSummary(data.results || data || []);
            } catch (err) {
                setDebtSummaryError("Error al cargar el resumen de deuda");
            } finally {
                setDebtSummaryLoading(false);
            }
        };
        if (authToken) fetchDebtSummary();
    }, [authToken, section]);

    const handleRowClick = (credit) => {
        setSelectedCredit(credit);
        setShowPaymentInput(false);
        setPaymentAmount("");
        setPaymentError(null);
        setPaymentSuccess(null);
    };

    const closeModal = () => {
        setSelectedCredit(null);
        setShowPaymentInput(false);
        setPaymentAmount("");
        setPaymentError(null);
        setPaymentSuccess(null);
    };

    const handlePayment = async () => {
        setPaymentLoading(true);
        setPaymentError(null);
        setPaymentSuccess(null);
        try {
            const res = await fetch(API_REGISTER_PAYMENT, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Token ${authToken}`,
                },
                body: JSON.stringify({
                    credit_account: selectedCredit.id,
                    amount_paid: Number(paymentAmount),
                }),
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(
                    errData.detail || "Error al registrar el abono"
                );
            }
            setPaymentSuccess("Abono registrado correctamente");
            setShowPaymentInput(false);
            setPaymentAmount("");
            // Refrescar créditos
            const data = await getCreditAccounts(authToken);
            setCredits(data.results || data || []);
            // Actualizar el crédito seleccionado
            const updated = (data.results || data || []).find(
                (c) => c.id === selectedCredit.id
            );
            setSelectedCredit(updated || null);
        } catch (err) {
            setPaymentError(err.message || "Error al registrar el abono");
        } finally {
            setPaymentLoading(false);
        }
    };

    const handleClientClick = async (clientRow) => {
        setSelectedClient(clientRow);
        setShowClientCredits(true);
        setClientCreditsLoading(true);
        setClientCreditsError(null);

        console.log("Cliente seleccionado:", clientRow);

        try {
            // Primero intentamos obtener todos los créditos sin filtro para ver la estructura
            const allCreditsData = await getCreditAccounts(authToken);
            const allCredits = allCreditsData.results || allCreditsData || [];

            console.log("Todos los créditos obtenidos:", allCredits.length);

            // Filtrar los créditos que correspondan al cliente seleccionado
            const filteredCredits = allCredits.filter((credit) => {
                // Verificar si el crédito tiene información de la venta y el cliente
                if (
                    credit.sale_details &&
                    credit.sale_details.customer_details
                ) {
                    const customerName =
                        credit.sale_details.customer_details.name;
                    console.log(
                        "Comparando:",
                        customerName,
                        "con:",
                        clientRow.customer_name
                    );
                    return customerName === clientRow.customer_name;
                }

                // Si no hay detalles de venta, verificar otros campos que puedan contener el nombre del cliente
                if (credit.customer_name) {
                    return credit.customer_name === clientRow.customer_name;
                }

                if (credit.customer) {
                    return credit.customer === clientRow.customer_name;
                }

                // Si el crédito tiene un customer_id, verificar si coincide
                if (credit.customer_id && clientRow.customer_id) {
                    return credit.customer_id === clientRow.customer_id;
                }

                return false;
            });

            console.log(
                "Créditos filtrados para el cliente:",
                filteredCredits.length
            );
            console.log("Créditos filtrados:", filteredCredits);

            setClientCredits(filteredCredits);
        } catch (err) {
            console.error("Error al cargar créditos del cliente:", err);
            setClientCreditsError("Error al cargar los créditos del cliente");
        } finally {
            setClientCreditsLoading(false);
        }
    };

    const closeClientCredits = () => {
        setShowClientCredits(false);
        setClientCredits([]);
        setSelectedClient(null);
        setClientCreditsError(null);
    };

    // Utilidad para formatear valores monetarios en COP
    const formatCOP = (value) => {
        return Number(value || 0).toLocaleString("es-CO", {
            style: "currency",
            currency: "COP",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        });
    };

    // Renderiza los detalles de la venta en el modal
    const renderSaleDetails = (credit) => {
        if (!credit?.sale_details)
            return (
                <div
                    style={{
                        textAlign: "center",
                        padding: "40px 20px",
                        color: "#6c757d",
                    }}
                >
                    <span style={{ fontSize: "48px", opacity: 0.5 }}>📋</span>
                    <p style={{ fontSize: "16px", margin: "16px 0 0 0" }}>
                        No hay detalles de la venta disponibles.
                    </p>
                </div>
            );

        const sale = credit.sale_details;
        const customer = sale.customer_details || {};

        return (
            <div style={{ maxWidth: "100%", minWidth: "550px" }}>
                {/* Resumen del crédito */}
                <div
                    style={{
                        background:
                            "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        color: "white",
                        padding: "24px",
                        borderRadius: "12px",
                        marginBottom: "24px",
                    }}
                >
                    <h3
                        style={{
                            margin: "0 0 16px 0",
                            fontSize: "20px",
                            fontWeight: "700",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                        }}
                    >
                        🛒 Venta #{sale.id}
                    </h3>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "24px",
                        }}
                    >
                        <div>
                            <div
                                style={{
                                    fontSize: "14px",
                                    opacity: 0.9,
                                    marginBottom: "4px",
                                }}
                            >
                                Saldo Pendiente
                            </div>
                            <div
                                style={{
                                    fontSize: "24px",
                                    fontWeight: "700",
                                    color: "#ffeb3b",
                                }}
                            >
                                {formatCOP(credit.remaining_amount)}
                            </div>
                        </div>
                        <div style={{ fontSize: "14px", opacity: 0.8 }}>
                            • Monto original:{" "}
                            {formatCOP(credit.original_amount)}
                        </div>
                        <div style={{ fontSize: "14px", opacity: 0.8 }}>
                            • Pagado: {formatCOP(credit.total_paid)}
                        </div>
                    </div>
                </div>

                {/* Información del cliente */}
                <div
                    style={{
                        background: "#f8f9fa",
                        padding: "20px",
                        borderRadius: "12px",
                        marginBottom: "24px",
                        border: "1px solid #e9ecef",
                    }}
                >
                    <h4
                        style={{
                            margin: "0 0 16px 0",
                            fontSize: "16px",
                            fontWeight: "600",
                            color: "#2c3e50",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                        }}
                    >
                        👤 Información del Cliente
                    </h4>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(auto-fit, minmax(200px, 1fr))",
                            gap: "12px",
                        }}
                    >
                        <div>
                            <div
                                style={{
                                    fontSize: "12px",
                                    color: "#6c757d",
                                    marginBottom: "4px",
                                }}
                            >
                                Nombre
                            </div>
                            <div
                                style={{
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    color: "#2c3e50",
                                }}
                            >
                                {customer.name || "-"}
                            </div>
                        </div>
                        <div>
                            <div
                                style={{
                                    fontSize: "12px",
                                    color: "#6c757d",
                                    marginBottom: "4px",
                                }}
                            >
                                Teléfono
                            </div>
                            <div
                                style={{
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    color: "#2c3e50",
                                }}
                            >
                                {customer.phone || "-"}
                            </div>
                        </div>
                        <div>
                            <div
                                style={{
                                    fontSize: "12px",
                                    color: "#6c757d",
                                    marginBottom: "4px",
                                }}
                            >
                                Email
                            </div>
                            <div
                                style={{
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    color: "#2c3e50",
                                }}
                            >
                                {customer.email || "-"}
                            </div>
                        </div>
                        <div>
                            <div
                                style={{
                                    fontSize: "12px",
                                    color: "#6c757d",
                                    marginBottom: "4px",
                                }}
                            >
                                Notas
                            </div>
                            <div
                                style={{
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    color: "#2c3e50",
                                }}
                            >
                                {customer.notes || "-"}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Detalles de la venta */}
                <div
                    style={{
                        background: "#f8f9fa",
                        padding: "20px",
                        borderRadius: "12px",
                        marginBottom: "24px",
                        border: "1px solid #e9ecef",
                    }}
                >
                    <h4
                        style={{
                            margin: "0 0 16px 0",
                            fontSize: "16px",
                            fontWeight: "600",
                            color: "#2c3e50",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                        }}
                    >
                        📅 Detalles de la Venta
                    </h4>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(auto-fit, minmax(200px, 1fr))",
                            gap: "12px",
                        }}
                    >
                        <div>
                            <div
                                style={{
                                    fontSize: "12px",
                                    color: "#6c757d",
                                    marginBottom: "4px",
                                }}
                            >
                                Fecha de Venta
                            </div>
                            <div
                                style={{
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    color: "#2c3e50",
                                }}
                            >
                                {sale.sale_date
                                    ? new Date(sale.sale_date).toLocaleString()
                                    : "-"}
                            </div>
                        </div>
                        <div>
                            <div
                                style={{
                                    fontSize: "12px",
                                    color: "#6c757d",
                                    marginBottom: "4px",
                                }}
                            >
                                Sede
                            </div>
                            <div
                                style={{
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    color: "#2c3e50",
                                }}
                            >
                                {sale.location_details?.name || "-"}
                            </div>
                        </div>
                        <div>
                            <div
                                style={{
                                    fontSize: "12px",
                                    color: "#6c757d",
                                    marginBottom: "4px",
                                }}
                            >
                                Tipo de Venta
                            </div>
                            <div
                                style={{
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    color: "#2c3e50",
                                }}
                            >
                                {sale.sale_type || "-"}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Productos */}
                <div
                    style={{
                        background: "#f8f9fa",
                        padding: "20px",
                        borderRadius: "12px",
                        marginBottom: "24px",
                        border: "1px solid #e9ecef",
                    }}
                >
                    <h4
                        style={{
                            margin: "0 0 16px 0",
                            fontSize: "16px",
                            fontWeight: "600",
                            color: "#2c3e50",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                        }}
                    >
                        📦 Productos
                    </h4>
                    {sale.items && sale.items.length > 0 ? (
                        <div
                            style={{
                                display: "grid",
                                gap: "12px",
                            }}
                        >
                            {sale.items.map((item, index) => (
                                <div
                                    key={item.id}
                                    style={{
                                        background: "white",
                                        padding: "16px",
                                        borderRadius: "8px",
                                        border: "1px solid #e9ecef",
                                        display: "grid",
                                        gridTemplateColumns: "1fr auto auto",
                                        gap: "16px",
                                        alignItems: "center",
                                    }}
                                >
                                    <div>
                                        <div
                                            style={{
                                                fontSize: "14px",
                                                fontWeight: "600",
                                                color: "#2c3e50",
                                            }}
                                        >
                                            {item.product_details?.name ||
                                                "Producto"}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: "12px",
                                                color: "#6c757d",
                                            }}
                                        >
                                            Cantidad: {item.quantity} | Precio:{" "}
                                            {formatCOP(item.unit_price)}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        <div
                                            style={{
                                                fontSize: "16px",
                                                fontWeight: "700",
                                                color: "#27ae60",
                                            }}
                                        >
                                            {formatCOP(item.subtotal)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div
                            style={{
                                textAlign: "center",
                                color: "#6c757d",
                                padding: "20px",
                            }}
                        >
                            No hay productos registrados.
                        </div>
                    )}
                </div>

                {/* Sección de abono */}
                <div
                    style={{
                        background:
                            "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        color: "white",
                        padding: "24px",
                        borderRadius: "12px",
                        marginTop: "24px",
                    }}
                >
                    <h4
                        style={{
                            margin: "0 0 16px 0",
                            fontSize: "18px",
                            fontWeight: "700",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                        }}
                    >
                        💰 Registrar Abono
                    </h4>

                    {!showPaymentInput ? (
                        <button
                            onClick={() => setShowPaymentInput(true)}
                            style={{
                                background: "rgba(255,255,255,0.2)",
                                color: "white",
                                border: "2px solid rgba(255,255,255,0.3)",
                                borderRadius: "8px",
                                padding: "12px 24px",
                                fontWeight: "600",
                                cursor: "pointer",
                                fontSize: "16px",
                                transition: "all 0.2s ease",
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.background =
                                    "rgba(255,255,255,0.3)";
                                e.target.style.borderColor =
                                    "rgba(255,255,255,0.5)";
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background =
                                    "rgba(255,255,255,0.2)";
                                e.target.style.borderColor =
                                    "rgba(255,255,255,0.3)";
                            }}
                        >
                            💳 Iniciar Abono
                        </button>
                    ) : (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "16px",
                            }}
                        >
                            <div
                                style={{
                                    background: "rgba(255,255,255,0.1)",
                                    padding: "16px",
                                    borderRadius: "8px",
                                    border: "1px solid rgba(255,255,255,0.2)",
                                }}
                            >
                                <label
                                    style={{
                                        display: "block",
                                        marginBottom: "8px",
                                        fontSize: "14px",
                                    }}
                                >
                                    Cantidad a abonar (máximo:{" "}
                                    {formatCOP(credit.remaining_amount)})
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max={
                                        Number(credit.remaining_amount) ||
                                        undefined
                                    }
                                    value={paymentAmount}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (
                                            Number(val) >
                                            Number(credit.remaining_amount)
                                        ) {
                                            setPaymentAmount(
                                                String(credit.remaining_amount)
                                            );
                                        } else {
                                            setPaymentAmount(val);
                                        }
                                    }}
                                    style={{
                                        width: "200px",
                                        padding: "12px",
                                        borderRadius: "8px",
                                        border: "1px solid rgba(255,255,255,0.3)",
                                        background: "rgba(255,255,255,0.1)",
                                        color: "white",
                                        fontSize: "16px",
                                        fontWeight: "600",
                                    }}
                                    placeholder="Ingrese el monto"
                                    disabled={paymentLoading}
                                />
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    gap: "12px",
                                    flexWrap: "wrap",
                                }}
                            >
                                <button
                                    onClick={handlePayment}
                                    disabled={
                                        paymentLoading ||
                                        !paymentAmount ||
                                        Number(paymentAmount) <= 0 ||
                                        Number(paymentAmount) >
                                            Number(credit.remaining_amount)
                                    }
                                    style={{
                                        background: paymentLoading
                                            ? "rgba(255,255,255,0.3)"
                                            : "#27ae60",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "8px",
                                        padding: "12px 24px",
                                        fontWeight: "600",
                                        cursor: paymentLoading
                                            ? "not-allowed"
                                            : "pointer",
                                        fontSize: "16px",
                                        transition: "all 0.2s ease",
                                        flex: "1",
                                        minWidth: "140px",
                                    }}
                                >
                                    {paymentLoading
                                        ? "⏳ Procesando..."
                                        : "✅ Confirmar Abono"}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowPaymentInput(false);
                                        setPaymentAmount("");
                                        setPaymentError(null);
                                    }}
                                    disabled={paymentLoading}
                                    style={{
                                        background: "rgba(255,255,255,0.2)",
                                        color: "white",
                                        border: "2px solid rgba(255,255,255,0.3)",
                                        borderRadius: "8px",
                                        padding: "12px 24px",
                                        fontWeight: "600",
                                        cursor: paymentLoading
                                            ? "not-allowed"
                                            : "pointer",
                                        fontSize: "16px",
                                        transition: "all 0.2s ease",
                                        flex: "1",
                                        minWidth: "140px",
                                    }}
                                >
                                    ❌ Cancelar
                                </button>
                            </div>

                            {paymentError && (
                                <div
                                    style={{
                                        background: "rgba(231, 76, 60, 0.2)",
                                        color: "#ffeb3b",
                                        padding: "12px",
                                        borderRadius: "8px",
                                        border: "1px solid rgba(231, 76, 60, 0.3)",
                                        fontSize: "14px",
                                        fontWeight: "500",
                                    }}
                                >
                                    ❌ {paymentError}
                                </div>
                            )}
                            {paymentSuccess && (
                                <div
                                    style={{
                                        background: "rgba(39, 174, 96, 0.2)",
                                        color: "#28a745",
                                        padding: "12px",
                                        borderRadius: "8px",
                                        border: "1px solid rgba(39, 174, 96, 0.3)",
                                        fontSize: "14px",
                                        fontWeight: "500",
                                    }}
                                >
                                    ✅ {paymentSuccess}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
            {/* Banner Header */}
            <div
                style={{
                    background:
                        "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)",
                    borderRadius: "12px",
                    padding: "32px",
                    marginBottom: "24px",
                    boxShadow: "0 4px 16px rgba(44,62,80,0.15)",
                    border: "1px solid #2c3e50",
                    color: "white",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "24px",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "16px",
                        }}
                    >
                        <div
                            style={{
                                width: "56px",
                                height: "56px",
                                backgroundColor: "rgba(255,255,255,0.2)",
                                borderRadius: "12px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                backdropFilter: "blur(10px)",
                            }}
                        >
                            <svg
                                width="28"
                                height="28"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                style={{ color: "white" }}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </div>
                        <div>
                            <h1
                                style={{
                                    fontSize: "32px",
                                    fontWeight: "800",
                                    color: "white",
                                    margin: "0",
                                    letterSpacing: "-0.5px",
                                }}
                            >
                                Gestión de Créditos
                            </h1>
                            <p
                                style={{
                                    color: "rgba(255,255,255,0.8)",
                                    margin: "8px 0 0 0",
                                    fontSize: "16px",
                                    fontWeight: "500",
                                }}
                            >
                                Administra créditos y pagos de clientes
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <SalesCreditsHeader section={section} setSection={setSection} />
            {section === "creditos" ? (
                <CreditsTable
                    credits={credits}
                    loading={loading}
                    error={error}
                    onRowClick={handleRowClick}
                    selectedCredit={selectedCredit}
                    closeModal={closeModal}
                    showPaymentInput={showPaymentInput}
                    setShowPaymentInput={setShowPaymentInput}
                    paymentAmount={paymentAmount}
                    setPaymentAmount={setPaymentAmount}
                    paymentLoading={paymentLoading}
                    paymentError={paymentError}
                    paymentSuccess={paymentSuccess}
                    handlePayment={handlePayment}
                    formatCOP={formatCOP}
                    renderSaleDetails={renderSaleDetails}
                />
            ) : (
                <div
                    style={{
                        background: "#fff",
                        borderRadius: 12,
                        boxShadow: "0 2px 8px #0001",
                        padding: 24,
                    }}
                >
                    <h2 style={{ marginBottom: 24 }}>
                        Resumen de Deuda por Cliente
                    </h2>
                    <DebtSummaryTable
                        data={debtSummary}
                        loading={debtSummaryLoading}
                        error={debtSummaryError}
                        formatCOP={formatCOP}
                        onClientClick={handleClientClick}
                    />
                </div>
            )}
            {/* Modal de créditos individuales por cliente */}
            {showClientCredits && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100vw",
                        height: "100vh",
                        background: "rgba(0,0,0,0.5)",
                        backdropFilter: "blur(4px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1000,
                        padding: "20px",
                    }}
                    onClick={closeClientCredits}
                >
                    <div
                        style={{
                            background: "#ffffff",
                            borderRadius: "16px",
                            boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
                            minWidth: "800px",
                            maxWidth: "95vw",
                            maxHeight: "90vh",
                            overflowY: "auto",
                            position: "relative",
                            border: "1px solid #e1e5e9",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header con gradiente */}
                        <div
                            style={{
                                background:
                                    "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
                                padding: "24px 32px 20px",
                                borderBottom: "1px solid #dee2e6",
                                position: "sticky",
                                top: 0,
                                zIndex: 10,
                            }}
                        >
                            <button
                                onClick={closeClientCredits}
                                style={{
                                    position: "absolute",
                                    top: 20,
                                    right: 24,
                                    background: "#6c757d",
                                    border: "1px solid #5a6268",
                                    borderRadius: "8px",
                                    padding: "8px 16px",
                                    cursor: "pointer",
                                    fontWeight: "600",
                                    color: "white",
                                    fontSize: "14px",
                                    transition: "all 0.2s ease",
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.background = "#5a6268";
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = "#6c757d";
                                }}
                            >
                                ✕ Cerrar
                            </button>
                            <h2
                                style={{
                                    margin: 0,
                                    textAlign: "center",
                                    color: "#495057",
                                    fontSize: "24px",
                                    fontWeight: "700",
                                }}
                            >
                                💳 Créditos de {selectedClient?.customer_name}
                            </h2>
                        </div>

                        {/* Contenido */}
                        <div style={{ padding: "24px 32px" }}>
                            {clientCreditsLoading ? (
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        padding: "40px",
                                        color: "#6c757d",
                                        fontSize: "16px",
                                        fontWeight: "500",
                                    }}
                                >
                                    <div style={{ marginRight: "12px" }}>
                                        ⏳
                                    </div>
                                    Cargando créditos...
                                </div>
                            ) : clientCreditsError ? (
                                <div
                                    style={{
                                        background: "#f8d7da",
                                        color: "#721c24",
                                        padding: "16px",
                                        borderRadius: "12px",
                                        border: "1px solid #f5c6cb",
                                        fontSize: "14px",
                                        fontWeight: "500",
                                        textAlign: "center",
                                    }}
                                >
                                    ❌ {clientCreditsError}
                                </div>
                            ) : clientCredits.length === 0 ? (
                                <div
                                    style={{
                                        background: "#e2e3e5",
                                        color: "#6c757d",
                                        padding: "24px",
                                        borderRadius: "12px",
                                        textAlign: "center",
                                        fontSize: "16px",
                                        fontWeight: "500",
                                    }}
                                >
                                    📋 No hay créditos registrados para este
                                    cliente.
                                </div>
                            ) : (
                                <div
                                    style={{
                                        background: "#f8f9fa",
                                        borderRadius: "12px",
                                        overflow: "hidden",
                                        border: "1px solid #dee2e6",
                                    }}
                                >
                                    <div style={{ overflowX: "auto" }}>
                                        <table
                                            style={{
                                                width: "100%",
                                                borderCollapse: "collapse",
                                                fontSize: "14px",
                                            }}
                                        >
                                            <thead>
                                                <tr
                                                    style={{
                                                        background: "#e9ecef",
                                                    }}
                                                >
                                                    <th
                                                        style={{
                                                            padding:
                                                                "16px 12px",
                                                            textAlign: "left",
                                                            color: "#495057",
                                                            fontWeight: "700",
                                                            fontSize: "13px",
                                                            textTransform:
                                                                "uppercase",
                                                            letterSpacing:
                                                                "0.5px",
                                                            borderBottom:
                                                                "2px solid #dee2e6",
                                                        }}
                                                    >
                                                        ID
                                                    </th>
                                                    <th
                                                        style={{
                                                            padding:
                                                                "16px 12px",
                                                            textAlign: "left",
                                                            color: "#495057",
                                                            fontWeight: "700",
                                                            fontSize: "13px",
                                                            textTransform:
                                                                "uppercase",
                                                            letterSpacing:
                                                                "0.5px",
                                                            borderBottom:
                                                                "2px solid #dee2e6",
                                                        }}
                                                    >
                                                        Monto Original
                                                    </th>
                                                    <th
                                                        style={{
                                                            padding:
                                                                "16px 12px",
                                                            textAlign: "left",
                                                            color: "#495057",
                                                            fontWeight: "700",
                                                            fontSize: "13px",
                                                            textTransform:
                                                                "uppercase",
                                                            letterSpacing:
                                                                "0.5px",
                                                            borderBottom:
                                                                "2px solid #dee2e6",
                                                        }}
                                                    >
                                                        Saldo Pendiente
                                                    </th>
                                                    <th
                                                        style={{
                                                            padding:
                                                                "16px 12px",
                                                            textAlign: "left",
                                                            color: "#495057",
                                                            fontWeight: "700",
                                                            fontSize: "13px",
                                                            textTransform:
                                                                "uppercase",
                                                            letterSpacing:
                                                                "0.5px",
                                                            borderBottom:
                                                                "2px solid #dee2e6",
                                                        }}
                                                    >
                                                        Pagado
                                                    </th>
                                                    <th
                                                        style={{
                                                            padding:
                                                                "16px 12px",
                                                            textAlign: "left",
                                                            color: "#495057",
                                                            fontWeight: "700",
                                                            fontSize: "13px",
                                                            textTransform:
                                                                "uppercase",
                                                            letterSpacing:
                                                                "0.5px",
                                                            borderBottom:
                                                                "2px solid #dee2e6",
                                                        }}
                                                    >
                                                        Estado
                                                    </th>
                                                    <th
                                                        style={{
                                                            padding:
                                                                "16px 12px",
                                                            textAlign: "left",
                                                            color: "#495057",
                                                            fontWeight: "700",
                                                            fontSize: "13px",
                                                            textTransform:
                                                                "uppercase",
                                                            letterSpacing:
                                                                "0.5px",
                                                            borderBottom:
                                                                "2px solid #dee2e6",
                                                        }}
                                                    >
                                                        Fecha de Inicio
                                                    </th>
                                                    <th
                                                        style={{
                                                            padding:
                                                                "16px 12px",
                                                            textAlign: "left",
                                                            color: "#495057",
                                                            fontWeight: "700",
                                                            fontSize: "13px",
                                                            textTransform:
                                                                "uppercase",
                                                            letterSpacing:
                                                                "0.5px",
                                                            borderBottom:
                                                                "2px solid #dee2e6",
                                                        }}
                                                    >
                                                        Fecha de Vencimiento
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {clientCredits.map(
                                                    (credit, index) => (
                                                        <tr
                                                            key={credit.id}
                                                            style={{
                                                                background:
                                                                    index %
                                                                        2 ===
                                                                    0
                                                                        ? "#ffffff"
                                                                        : "#f8f9fa",
                                                                transition:
                                                                    "all 0.2s ease",
                                                            }}
                                                            onMouseEnter={(
                                                                e
                                                            ) => {
                                                                e.target.parentElement.style.background =
                                                                    "#e3f2fd";
                                                            }}
                                                            onMouseLeave={(
                                                                e
                                                            ) => {
                                                                e.target.parentElement.style.background =
                                                                    index %
                                                                        2 ===
                                                                    0
                                                                        ? "#ffffff"
                                                                        : "#f8f9fa";
                                                            }}
                                                        >
                                                            <td
                                                                style={{
                                                                    padding:
                                                                        "14px 12px",
                                                                    color: "#495057",
                                                                    fontWeight:
                                                                        "600",
                                                                    borderBottom:
                                                                        "1px solid #dee2e6",
                                                                }}
                                                            >
                                                                #{credit.id}
                                                            </td>
                                                            <td
                                                                style={{
                                                                    padding:
                                                                        "14px 12px",
                                                                    color: "#495057",
                                                                    fontWeight:
                                                                        "600",
                                                                    borderBottom:
                                                                        "1px solid #dee2e6",
                                                                }}
                                                            >
                                                                {formatCOP(
                                                                    credit.original_amount
                                                                )}
                                                            </td>
                                                            <td
                                                                style={{
                                                                    padding:
                                                                        "14px 12px",
                                                                    color:
                                                                        credit.remaining_amount >
                                                                        0
                                                                            ? "#dc3545"
                                                                            : "#28a745",
                                                                    fontWeight:
                                                                        "700",
                                                                    borderBottom:
                                                                        "1px solid #dee2e6",
                                                                }}
                                                            >
                                                                {formatCOP(
                                                                    credit.remaining_amount
                                                                )}
                                                            </td>
                                                            <td
                                                                style={{
                                                                    padding:
                                                                        "14px 12px",
                                                                    color: "#28a745",
                                                                    fontWeight:
                                                                        "600",
                                                                    borderBottom:
                                                                        "1px solid #dee2e6",
                                                                }}
                                                            >
                                                                {formatCOP(
                                                                    credit.total_paid
                                                                )}
                                                            </td>
                                                            <td
                                                                style={{
                                                                    padding:
                                                                        "14px 12px",
                                                                    borderBottom:
                                                                        "1px solid rgba(255,255,255,0.1)",
                                                                }}
                                                            >
                                                                <span
                                                                    style={{
                                                                        background:
                                                                            credit.is_fully_paid
                                                                                ? "#d4edda"
                                                                                : credit.is_overdue
                                                                                ? "#f8d7da"
                                                                                : "#fff3cd",
                                                                        color: credit.is_fully_paid
                                                                            ? "#155724"
                                                                            : credit.is_overdue
                                                                            ? "#721c24"
                                                                            : "#856404",
                                                                        padding:
                                                                            "4px 12px",
                                                                        borderRadius:
                                                                            "20px",
                                                                        fontSize:
                                                                            "12px",
                                                                        fontWeight:
                                                                            "700",
                                                                        textTransform:
                                                                            "uppercase",
                                                                        letterSpacing:
                                                                            "0.5px",
                                                                        border: `1px solid ${
                                                                            credit.is_fully_paid
                                                                                ? "#c3e6cb"
                                                                                : credit.is_overdue
                                                                                ? "#f5c6cb"
                                                                                : "#ffeaa7"
                                                                        }`,
                                                                    }}
                                                                >
                                                                    {credit.is_fully_paid
                                                                        ? "✅ Pagado"
                                                                        : credit.is_overdue
                                                                        ? "⏰ Vencido"
                                                                        : "⏳ Pendiente"}
                                                                </span>
                                                            </td>
                                                            <td
                                                                style={{
                                                                    padding:
                                                                        "14px 12px",
                                                                    color: "#6c757d",
                                                                    fontWeight:
                                                                        "500",
                                                                    borderBottom:
                                                                        "1px solid #dee2e6",
                                                                }}
                                                            >
                                                                {credit.start_date
                                                                    ? new Date(
                                                                          credit.start_date
                                                                      ).toLocaleDateString()
                                                                    : "-"}
                                                            </td>
                                                            <td
                                                                style={{
                                                                    padding:
                                                                        "14px 12px",
                                                                    color: credit.is_overdue
                                                                        ? "#dc3545"
                                                                        : "#6c757d",
                                                                    fontWeight:
                                                                        "500",
                                                                    borderBottom:
                                                                        "1px solid #dee2e6",
                                                                }}
                                                            >
                                                                {credit.due_date
                                                                    ? new Date(
                                                                          credit.due_date
                                                                      ).toLocaleDateString()
                                                                    : "-"}
                                                            </td>
                                                        </tr>
                                                    )
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalesCreditsPage;
