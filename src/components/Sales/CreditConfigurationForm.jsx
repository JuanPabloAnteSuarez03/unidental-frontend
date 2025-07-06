import React, { useState, useEffect } from 'react';
import { 
    PAYMENT_FREQUENCIES, 
    calculateInstallmentAmount,
    validateInstallmentTotal,
    validateCreditData,
    formatCurrency 
} from '../../services/creditsService';

const CreditConfigurationForm = ({ 
    totalAmount, 
    creditConfig, 
    onConfigChange, 
    disabled = false 
}) => {
    const [localConfig, setLocalConfig] = useState({
        hasInitialPayment: false,
        initialPayment: '',
        installmentsCount: 3,
        paymentFrequency: 'monthly',
        customDays: '',
        nextPaymentDate: '',
        installmentAmount: '',
        ...creditConfig
    });

    const [validationErrors, setValidationErrors] = useState([]);

    // Calcular próxima fecha de pago automáticamente según la frecuencia
    useEffect(() => {
        const calculateNextPaymentDate = () => {
            const today = new Date();
            const frequency = PAYMENT_FREQUENCIES[localConfig.paymentFrequency];
            
            if (frequency && frequency.days) {
                // Para frecuencias predefinidas, usar sus días
                today.setDate(today.getDate() + frequency.days);
            } else if (localConfig.paymentFrequency === 'custom' && localConfig.customDays) {
                // Para personalizado, usar los días especificados
                today.setDate(today.getDate() + parseInt(localConfig.customDays));
            } else {
                // Por defecto, 30 días
                today.setDate(today.getDate() + 30);
            }
            
            return today.toISOString().split('T')[0];
        };

        setLocalConfig(prev => ({
            ...prev,
            nextPaymentDate: calculateNextPaymentDate()
        }));
    }, [localConfig.paymentFrequency, localConfig.customDays]);

    // Calcular monto de cuota automáticamente con distribución exacta
    useEffect(() => {
        const initialPayment = localConfig.hasInitialPayment 
            ? parseFloat(localConfig.initialPayment) || 0 
            : 0;
        
        console.log("🔍 CALC - totalAmount:", totalAmount);
        console.log("🔍 CALC - initialPayment:", initialPayment);
        console.log("🔍 CALC - installmentsCount:", localConfig.installmentsCount);
        
        // Calcular cuotas sobre el saldo restante, pero validar según nueva lógica del backend
        const installmentAmount = calculateInstallmentAmount(
            totalAmount, 
            initialPayment,
            localConfig.installmentsCount
        );

        console.log("🔍 CALC - installmentAmount:", installmentAmount);

        // Validar según nueva lógica: pago_inicial + total_cuotas ≈ monto_original
        const validation = validateInstallmentTotal(
            totalAmount, 
            initialPayment,
            installmentAmount, 
            localConfig.installmentsCount
        );
        
        console.log("🔍 CALC - validation result:", validation);

        setLocalConfig(prev => ({
            ...prev,
            installmentAmount: installmentAmount.toString()
        }));
    }, [
        totalAmount, 
        localConfig.hasInitialPayment, 
        localConfig.initialPayment, 
        localConfig.installmentsCount
    ]);

    // Validar configuración
    useEffect(() => {
        const errors = [];
        
        // Validaciones básicas
        if (!totalAmount || totalAmount <= 0) {
            errors.push("Monto original debe ser mayor a 0");
        }
        
        if (localConfig.hasInitialPayment && (!localConfig.initialPayment || parseFloat(localConfig.initialPayment) <= 0)) {
            errors.push("Pago inicial debe ser mayor a 0");
        }
        
        if (localConfig.hasInitialPayment && parseFloat(localConfig.initialPayment) >= totalAmount) {
            errors.push("Pago inicial no puede ser mayor o igual al monto total");
        }
        
        if (!localConfig.installmentsCount || localConfig.installmentsCount <= 0) {
            errors.push("Número de cuotas debe ser mayor a 0");
        }
        
        // Validación específica para frecuencia personalizada
        if (localConfig.paymentFrequency === 'custom') {
            if (!localConfig.customDays || parseInt(localConfig.customDays) <= 0) {
                errors.push("Para frecuencia personalizada, debe especificar días entre pagos");
            }
        }
        
        if (!localConfig.nextPaymentDate) {
            errors.push("Fecha del primer pago es requerida");
        }

        setValidationErrors(errors);
    }, [localConfig, totalAmount]);

    // Enviar cambios al componente padre
    useEffect(() => {
        onConfigChange({
            ...localConfig,
            isValid: validationErrors.length === 0
        });
    }, [localConfig, validationErrors, onConfigChange]);

    const handleChange = (field, value) => {
        if (disabled) return;

        setLocalConfig(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const remainingAmount = localConfig.hasInitialPayment 
        ? totalAmount - (parseFloat(localConfig.initialPayment) || 0)
        : totalAmount;

    return (
        <div 
            style={{
                backgroundColor: '#f8f9fa',
                border: '1px solid #e9ecef',
                borderRadius: '8px',
                padding: '20px',
                marginTop: '16px',
            }}
        >
            <h4 
                style={{
                    margin: '0 0 16px 0',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#2c3e50',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                }}
            >
                📝 Configuración del Crédito
            </h4>

            {/* Resumen del monto */}
            <div 
                style={{
                    backgroundColor: '#e8f4fd',
                    border: '1px solid #bee5eb',
                    borderRadius: '6px',
                    padding: '12px',
                    marginBottom: '20px',
                    fontSize: '14px',
                }}
            >
                <div style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '4px' }}>
                    💰 Monto Total: {formatCurrency(totalAmount)}
                </div>
                {localConfig.hasInitialPayment && localConfig.initialPayment && (
                    <div style={{ fontSize: '12px', color: '#6c757d' }}>
                        Pago inicial: {formatCurrency(localConfig.initialPayment)} | 
                        Restante: {formatCurrency(remainingAmount)}
                    </div>
                )}
            </div>

            <div 
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '16px',
                    marginBottom: '16px',
                }}
            >
                {/* Pago inicial */}
                <div>
                    <label
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '8px',
                            cursor: disabled ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#2c3e50',
                        }}
                    >
                        <input
                            type="checkbox"
                            checked={localConfig.hasInitialPayment}
                            onChange={(e) => handleChange('hasInitialPayment', e.target.checked)}
                            disabled={disabled}
                            style={{ marginRight: '4px' }}
                        />
                        💳 Pago Inicial
                    </label>
                    
                    {localConfig.hasInitialPayment && (
                        <input
                            type="number"
                            value={localConfig.initialPayment}
                            onChange={(e) => handleChange('initialPayment', e.target.value)}
                            disabled={disabled}
                            placeholder="Monto del pago inicial"
                            min="0"
                            max={totalAmount}
                            style={{
                                width: '100%',
                                boxSizing: 'border-box',
                                padding: '10px',
                                border: '1px solid #dee2e6',
                                borderRadius: '4px',
                                fontSize: '14px',
                                backgroundColor: disabled ? '#f8f9fa' : 'white',
                            }}
                        />
                    )}
                </div>

                {/* Número de cuotas */}
                <div>
                    <label
                        style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#2c3e50',
                            marginBottom: '8px',
                        }}
                    >
                        📅 Número de Cuotas
                    </label>
                    <input
                        type="number"
                        value={localConfig.installmentsCount}
                        onChange={(e) => handleChange('installmentsCount', parseInt(e.target.value) || 1)}
                        disabled={disabled}
                        min="1"
                        max="36"
                        style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '10px',
                            border: '1px solid #dee2e6',
                            borderRadius: '4px',
                            fontSize: '14px',
                            backgroundColor: disabled ? '#f8f9fa' : 'white',
                        }}
                    />
                </div>
            </div>

            <div 
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '16px',
                    marginBottom: '16px',
                }}
            >
                {/* Frecuencia de pago */}
                <div>
                    <label
                        style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#2c3e50',
                            marginBottom: '8px',
                        }}
                    >
                        🔄 Frecuencia de Pago
                    </label>
                    <select
                        value={localConfig.paymentFrequency}
                        onChange={(e) => handleChange('paymentFrequency', e.target.value)}
                        disabled={disabled}
                        style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '10px',
                            border: '1px solid #dee2e6',
                            borderRadius: '4px',
                            fontSize: '14px',
                            backgroundColor: disabled ? '#f8f9fa' : 'white',
                        }}
                    >
                        {Object.values(PAYMENT_FREQUENCIES).map((freq) => (
                            <option key={freq.value} value={freq.value}>
                                {freq.label}
                            </option>
                        ))}
                    </select>
                    
                    {/* Campo para días personalizados */}
                    {localConfig.paymentFrequency === 'custom' && (
                        <div style={{ marginTop: '8px' }}>
                            <input
                                type="number"
                                value={localConfig.customDays}
                                onChange={(e) => handleChange('customDays', e.target.value)}
                                disabled={disabled}
                                placeholder="Días entre pagos"
                                min="1"
                                max="365"
                                style={{
                                    width: '100%',
                                    boxSizing: 'border-box',
                                    padding: '8px',
                                    border: '1px solid #dee2e6',
                                    borderRadius: '4px',
                                    fontSize: '13px',
                                    backgroundColor: disabled ? '#f8f9fa' : 'white',
                                }}
                            />
                            <div style={{ fontSize: '11px', color: '#6c757d', marginTop: '4px' }}>
                                Especifica cada cuántos días se debe pagar una cuota
                            </div>
                        </div>
                    )}
                </div>

                {/* Fecha del primer pago */}
                <div>
                    <label
                        style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#2c3e50',
                            marginBottom: '8px',
                        }}
                    >
                        📆 Primer Pago (Automático)
                    </label>
                    <input
                        type="date"
                        value={localConfig.nextPaymentDate}
                        onChange={(e) => handleChange('nextPaymentDate', e.target.value)}
                        disabled={disabled}
                        min={new Date().toISOString().split('T')[0]}
                        style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '10px',
                            border: '1px solid #dee2e6',
                            borderRadius: '4px',
                            fontSize: '14px',
                            backgroundColor: disabled ? '#f8f9fa' : 'white',
                        }}
                    />
                    <div style={{ fontSize: '11px', color: '#6c757d', marginTop: '4px' }}>
                        Se calcula automáticamente según la frecuencia seleccionada
                    </div>
                </div>
            </div>

            {/* Monto calculado por cuota */}
            <div 
                style={{
                    backgroundColor: '#d4edda',
                    border: '1px solid #c3e6cb',
                    borderRadius: '6px',
                    padding: '12px',
                    marginBottom: '16px',
                }}
            >
                <div 
                    style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#155724',
                        marginBottom: '4px',
                    }}
                >
                    💰 Monto por Cuota: {formatCurrency(localConfig.installmentAmount)}
                </div>
                <div style={{ fontSize: '12px', color: '#6c757d' }}>
                    {localConfig.installmentsCount} cuotas de {formatCurrency(localConfig.installmentAmount)} cada{' '}
                    {localConfig.paymentFrequency === 'custom' && localConfig.customDays
                        ? `${localConfig.customDays} días`
                        : PAYMENT_FREQUENCIES[localConfig.paymentFrequency]?.label.toLowerCase()
                    }
                </div>
                {localConfig.hasInitialPayment && localConfig.initialPayment && (
                    <div style={{ fontSize: '11px', color: '#6c757d', marginTop: '4px', fontStyle: 'italic' }}>
                        ℹ️ Pago inicial de {formatCurrency(localConfig.initialPayment)} + cuotas deben sumar {formatCurrency(totalAmount)}
                    </div>
                )}
            </div>

            {/* Errores de validación */}
            {validationErrors.length > 0 && (
                <div 
                    style={{
                        backgroundColor: '#f8d7da',
                        border: '1px solid #f5c6cb',
                        borderRadius: '6px',
                        padding: '12px',
                        marginBottom: '16px',
                    }}
                >
                    <div 
                        style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#721c24',
                            marginBottom: '8px',
                        }}
                    >
                        ⚠️ Errores de configuración:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#721c24' }}>
                        {validationErrors.map((error, index) => (
                            <li key={index}>{error}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Información adicional */}
            <div 
                style={{
                    fontSize: '11px',
                    color: '#6c757d',
                    fontStyle: 'italic',
                    marginTop: '12px',
                    padding: '8px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e9ecef',
                    borderRadius: '4px',
                }}
            >
                💡 <strong>Cómo funciona:</strong><br/>
                • La fecha del primer pago se calcula automáticamente según la frecuencia elegida<br/>
                • <strong>Semanal:</strong> 7 días, <strong>Quincenal:</strong> 15 días, <strong>Mensual:</strong> 30 días, <strong>Trimestral:</strong> 90 días<br/>
                • <strong>Personalizado:</strong> Permite configurar un número específico de días entre pagos<br/>
                • <strong>Pago inicial:</strong> Se registra por separado y se suma con las cuotas para validar el total<br/>
                • <strong>Cuotas:</strong> Se calculan sobre el saldo restante, pero el sistema valida que pago inicial + cuotas ≈ monto original<br/>
                • Los pagos posteriores se registran individualmente desde el sistema de gestión de créditos
            </div>
        </div>
    );
};

export default CreditConfigurationForm; 