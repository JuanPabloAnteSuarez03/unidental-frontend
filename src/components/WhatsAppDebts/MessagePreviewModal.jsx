import React, { useEffect } from 'react';
import { formatCurrency } from '../../services/whatsappDebtsService';
import './WhatsAppDebtsStyles.css';

const MessagePreviewModal = ({ 
    isOpen, 
    onClose, 
    debt,
    onSendWhatsApp 
}) => {
    // Cerrar modal con Escape
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Cerrar modal al hacer clic en el overlay
    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!isOpen || !debt) return null;

    const handleSendMessage = () => {
        if (debt.whatsapp_url && debt.has_phone) {
            onSendWhatsApp && onSendWhatsApp(debt);
            window.open(debt.whatsapp_url, '_blank');
        }
    };

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className="modal-content">
                <div className="modal-header">
                    <h3 className="modal-title">Vista Previa del Mensaje</h3>
                    <button 
                        className="modal-close"
                        onClick={onClose}
                        aria-label="Cerrar modal"
                    >
                        ×
                    </button>
                </div>

                <div className="modal-body">
                    {/* Información del proveedor */}
                    <div style={{ marginBottom: '16px' }}>
                        <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>
                            Información del Proveedor
                        </h4>
                        <div style={{ fontSize: '14px', color: '#666' }}>
                            <p><strong>Proveedor:</strong> {debt.supplier_name}</p>
                            <p><strong>Contacto:</strong> {debt.contact_name}</p>
                            <p><strong>Teléfono:</strong> {debt.phone || 'No disponible'}</p>
                            <p><strong>Monto:</strong> {formatCurrency(debt.remaining_amount)}</p>
                            <p><strong>Vencimiento:</strong> {debt.next_payment_date}</p>
                            <p><strong>Estado:</strong> {debt.status_text}</p>
                        </div>
                    </div>

                    {/* Vista previa del mensaje */}
                    <div style={{ marginBottom: '20px' }}>
                        <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>
                            Mensaje de WhatsApp
                        </h4>
                        <div className="message-preview">
                            {debt.whatsapp_message || 'No hay mensaje disponible'}
                        </div>
                    </div>

                    {/* Botones de acción */}
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button
                            className="preview-button"
                            onClick={onClose}
                            style={{ padding: '8px 16px' }}
                        >
                            Cancelar
                        </button>
                        
                        {debt.has_phone ? (
                            <button
                                className="whatsapp-button"
                                onClick={handleSendMessage}
                                style={{ padding: '8px 16px' }}
                            >
                                <svg
                                    className="whatsapp-icon"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                >
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488z"/>
                                </svg>
                                Enviar por WhatsApp
                            </button>
                        ) : (
                            <button
                                className="whatsapp-button no-phone-button"
                                disabled
                                style={{ padding: '8px 16px' }}
                            >
                                Sin teléfono
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MessagePreviewModal; 