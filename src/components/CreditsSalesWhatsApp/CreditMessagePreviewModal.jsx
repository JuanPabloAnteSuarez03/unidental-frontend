import React from 'react';
import { formatCurrency } from '../../services/creditsSalesWhatsappService';
import './CreditsSalesWhatsAppStyles.css';

const CreditMessagePreviewModal = ({
    isOpen,
    account,
    onClose,
    onSendWhatsApp
}) => {
    if (!isOpen || !account) return null;

    const handleSendWhatsApp = () => {
        if (account.whatsapp_url && account.has_phone) {
            onSendWhatsApp && onSendWhatsApp(account);
            window.open(account.whatsapp_url, '_blank');
        }
    };

    const formatPhoneNumber = (phone) => {
        if (!phone) return 'Sin teléfono';
        const cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length === 9) {
            return `+56 ${cleanPhone.substring(0, 1)} ${cleanPhone.substring(1, 5)} ${cleanPhone.substring(5)}`;
        }
        return phone;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Sin fecha';
        return new Date(dateString).toLocaleDateString('es-CL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getStatusText = (status, daysOverdue) => {
        if (status === 'vencido') {
            return `Vencido hace ${daysOverdue} día${daysOverdue !== 1 ? 's' : ''}`;
        } else if (status === 'proximo') {
            return 'Próximo a vencer';
        }
        return status;
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Vista previa - Recordatorio de Pago</h3>
                    <button className="modal-close-button" onClick={onClose}>
                        ×
                    </button>
                </div>

                <div className="modal-body">
                    {/* Información del cliente */}
                    <div className="customer-info-section">
                        <h4>Información del Cliente</h4>
                        <div className="info-grid">
                            <div className="info-item">
                                <span className="info-label">Cliente:</span>
                                <span className="info-value">{account.customer_name || 'Sin nombre'}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Teléfono:</span>
                                <span className="info-value">{formatPhoneNumber(account.customer_phone)}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Email:</span>
                                <span className="info-value">{account.customer_email || 'Sin email'}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Monto pendiente:</span>
                                <span className="info-value amount">{formatCurrency(account.remaining_amount)}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Fecha referencia:</span>
                                <span className="info-value">{formatDate(account.reference_date)}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Estado:</span>
                                <span className="info-value status">{getStatusText(account.status, account.days_overdue)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Mensaje de WhatsApp */}
                    <div className="message-section">
                        <h4>Mensaje de WhatsApp</h4>
                        <div className="message-preview">
                            <div className="message-header">
                                <span className="message-icon">📱</span>
                                <span className="message-title">Mensaje que se enviará</span>
                            </div>
                            <div className="message-content">
                                {account.whatsapp_message || 'No hay mensaje disponible'}
                            </div>
                        </div>
                    </div>

                    {/* Estado de disponibilidad */}
                    <div className="availability-section">
                        <div className={`availability-status ${account.has_phone ? 'available' : 'unavailable'}`}>
                            <span className="availability-icon">
                                {account.has_phone ? '✅' : '❌'}
                            </span>
                            <span className="availability-text">
                                {account.has_phone 
                                    ? 'Cliente disponible para WhatsApp' 
                                    : 'Cliente no disponible - Sin teléfono registrado'
                                }
                            </span>
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button 
                        className="cancel-button"
                        onClick={onClose}
                    >
                        Cerrar
                    </button>
                    
                    {account.has_phone && account.whatsapp_url ? (
                        <button
                            className="whatsapp-button"
                            onClick={handleSendWhatsApp}
                        >
                            <span className="whatsapp-icon">📱</span>
                            Enviar por WhatsApp
                        </button>
                    ) : (
                        <button
                            className="whatsapp-button no-phone-button"
                            disabled
                        >
                            <span className="whatsapp-icon">📱</span>
                            Sin teléfono disponible
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CreditMessagePreviewModal; 