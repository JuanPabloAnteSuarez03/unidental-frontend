import React from 'react';
import { 
    formatCurrency, 
    getUrgencyClass, 
    filterDebts 
} from '../../services/whatsappDebtsService';
import './WhatsAppDebtsStyles.css';

const DebtsTable = ({ 
    debts, 
    filters, 
    onPreviewMessage, 
    onSendWhatsApp,
    isLoading = false 
}) => {
    // Aplicar filtros a las deudas
    const filteredDebts = filterDebts(debts, filters);

    // Aplicar filtros adicionales
    const applyAdvancedFilters = (debts) => {
        let filtered = [...debts];

        // Filtro por urgencia
        if (filters.urgencyFilter && filters.urgencyFilter !== 'all') {
            filtered = filtered.filter(debt => {
                const urgencyClass = getUrgencyClass(debt.days_overdue, debt.status);
                switch (filters.urgencyFilter) {
                    case 'urgent':
                        return urgencyClass === 'urgency-high';
                    case 'medium':
                        return urgencyClass === 'urgency-medium';
                    case 'low':
                        return urgencyClass === 'urgency-low';
                    case 'upcoming':
                        return urgencyClass === 'urgency-upcoming';
                    default:
                        return true;
                }
            });
        }

        // Filtro por estado
        if (filters.statusFilter && filters.statusFilter !== 'all') {
            filtered = filtered.filter(debt => debt.status === filters.statusFilter);
        }

        // Filtro por monto mínimo
        if (filters.minAmount && filters.minAmount > 0) {
            filtered = filtered.filter(debt => 
                parseFloat(debt.remaining_amount) >= parseFloat(filters.minAmount)
            );
        }

        return filtered;
    };

    const finalFilteredDebts = applyAdvancedFilters(filteredDebts);

    const handleWhatsAppClick = (debt) => {
        if (debt.has_phone && debt.whatsapp_url) {
            onSendWhatsApp && onSendWhatsApp(debt);
            window.open(debt.whatsapp_url, '_blank');
        }
    };

    const formatDaysOverdue = (daysOverdue, status) => {
        if (status === 'proximo') {
            return `${Math.abs(daysOverdue)} días restantes`;
        } else if (daysOverdue > 0) {
            return `${daysOverdue} días vencido`;
        } else if (daysOverdue === 0) {
            return 'Vence hoy';
        } else {
            return `${Math.abs(daysOverdue)} días restantes`;
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('es-CL', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
        } catch (error) {
            return dateString;
        }
    };

    if (isLoading) {
        return (
            <div className="debts-table-container">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p style={{ marginTop: '16px', color: '#666' }}>Cargando deudas...</p>
                </div>
            </div>
        );
    }

    if (finalFilteredDebts.length === 0) {
        return (
            <div className="debts-table-container">
                <div className="empty-state">
                    <div className="empty-state-icon">📋</div>
                    <div className="empty-state-title">No hay deudas que mostrar</div>
                    <div className="empty-state-subtitle">
                        {debts.length === 0 
                            ? 'No se encontraron deudas vencidas'
                            : 'Intenta ajustar los filtros para ver más resultados'
                        }
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="debts-table-container">
            <table className="debts-table">
                <thead>
                    <tr>
                        <th>Proveedor</th>
                        <th>Monto Adeudado</th>
                        <th>Vencimiento</th>
                        <th>Estado</th>
                        <th>Días</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {finalFilteredDebts.map((debt) => (
                        <tr 
                            key={debt.id} 
                            className={`debt-row ${getUrgencyClass(debt.days_overdue, debt.status)}`}
                        >
                            <td>
                                <div className="supplier-info">
                                    <div className="supplier-name">{debt.supplier_name}</div>
                                    <div className="contact-name">{debt.contact_name}</div>
                                    {debt.phone && (
                                        <div className="phone-number">📞 {debt.phone}</div>
                                    )}
                                </div>
                            </td>
                            <td>
                                <div className="debt-amount">
                                    {formatCurrency(debt.remaining_amount)}
                                </div>
                            </td>
                            <td>
                                {formatDate(debt.next_payment_date)}
                            </td>
                            <td>
                                <span className={`debt-status status-${debt.status}`}>
                                    {debt.status_text}
                                </span>
                            </td>
                            <td>
                                <span className={debt.days_overdue > 0 ? 'days-overdue' : 'days-upcoming'}>
                                    {formatDaysOverdue(debt.days_overdue, debt.status)}
                                </span>
                            </td>
                            <td>
                                <div className="actions-cell">
                                    <button
                                        className="preview-button"
                                        onClick={() => onPreviewMessage(debt)}
                                        title="Ver mensaje completo"
                                    >
                                        Ver mensaje
                                    </button>
                                    
                                    {debt.has_phone ? (
                                        <button
                                            className="whatsapp-button"
                                            onClick={() => handleWhatsAppClick(debt)}
                                            title={`Enviar recordatorio a ${debt.contact_name}`}
                                        >
                                            <svg
                                                className="whatsapp-icon"
                                                viewBox="0 0 24 24"
                                                fill="currentColor"
                                            >
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488z"/>
                                            </svg>
                                            Enviar
                                        </button>
                                    ) : (
                                        <button
                                            className="whatsapp-button no-phone-button"
                                            disabled
                                            title="Sin teléfono registrado"
                                        >
                                            Sin teléfono
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            
            {/* Mostrar información de resultados */}
            {finalFilteredDebts.length > 0 && (
                <div style={{ 
                    padding: '16px', 
                    textAlign: 'center', 
                    fontSize: '14px', 
                    color: '#666',
                    borderTop: '1px solid #e0e0e0'
                }}>
                    Mostrando {finalFilteredDebts.length} de {debts.length} deudas
                    {finalFilteredDebts.length !== debts.length && (
                        <span style={{ marginLeft: '8px', color: '#999' }}>
                            (filtradas)
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

export default DebtsTable; 