import React from 'react';
import { PAYMENT_METHODS } from '../../services/creditsService';

const PaymentMethodSelector = ({ 
    selectedMethod, 
    onMethodChange, 
    disabled = false 
}) => {
    const handleMethodChange = (method) => {
        if (!disabled) {
            onMethodChange(method);
        }
    };

    return (
        <div style={{ marginBottom: '20px' }}>
            <label
                style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#2c3e50',
                    marginBottom: '12px',
                }}
            >
                Método de Pago
            </label>
            
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '12px',
                }}
            >
                {Object.values(PAYMENT_METHODS).map((method) => (
                    <button
                        key={method.value}
                        type="button"
                        onClick={() => handleMethodChange(method.value)}
                        disabled={disabled}
                        style={{
                            padding: '16px 12px',
                            border: selectedMethod === method.value 
                                ? '2px solid #3498db' 
                                : '1px solid #dee2e6',
                            borderRadius: '8px',
                            backgroundColor: selectedMethod === method.value 
                                ? '#e8f4fd' 
                                : disabled 
                                    ? '#f8f9fa' 
                                    : 'white',
                            color: disabled 
                                ? '#6c757d' 
                                : selectedMethod === method.value 
                                    ? '#2c3e50' 
                                    : '#6c757d',
                            cursor: disabled ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '6px',
                            textAlign: 'center',
                            position: 'relative',
                            ...(selectedMethod === method.value && {
                                boxShadow: '0 0 0 3px rgba(52, 152, 219, 0.1)',
                            }),
                            ...(disabled && {
                                opacity: 0.6,
                            }),
                        }}
                        onMouseEnter={(e) => {
                            if (!disabled && selectedMethod !== method.value) {
                                e.target.style.backgroundColor = '#f8f9fa';
                                e.target.style.borderColor = '#adb5bd';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!disabled && selectedMethod !== method.value) {
                                e.target.style.backgroundColor = 'white';
                                e.target.style.borderColor = '#dee2e6';
                            }
                        }}
                    >
                        <span style={{ fontSize: '24px', lineHeight: 1 }}>
                            {method.icon}
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: '600' }}>
                            {method.label}
                        </span>
                        
                        {/* Indicador de selección */}
                        {selectedMethod === method.value && (
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '6px',
                                    right: '6px',
                                    width: '16px',
                                    height: '16px',
                                    backgroundColor: '#27ae60',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '10px',
                                    color: 'white',
                                }}
                            >
                                ✓
                            </div>
                        )}
                    </button>
                ))}
            </div>
            
            {/* Descripción del método seleccionado */}
            {selectedMethod && (
                <div
                    style={{
                        marginTop: '12px',
                        padding: '12px',
                        backgroundColor: '#f8f9fa',
                        border: '1px solid #e9ecef',
                        borderRadius: '6px',
                        fontSize: '12px',
                        color: '#6c757d',
                    }}
                >
                    {selectedMethod === 'cash' && (
                        <span>💡 Pago inmediato en efectivo. La venta se registra como completada.</span>
                    )}
                    {selectedMethod === 'card' && (
                        <span>💡 Pago inmediato con tarjeta. La venta se registra como completada.</span>
                    )}
                    {selectedMethod === 'credit' && (
                        <span>💡 Sistema de crédito especial. Configure las cuotas y fechas de pago.</span>
                    )}
                </div>
            )}
        </div>
    );
};

export default PaymentMethodSelector; 