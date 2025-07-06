import React, { useState } from 'react';
import {
    formatCurrency,
    getUrgencyClass,
    filterCreditAccounts,
} from '../../services/creditsSalesWhatsappService';
import './CreditsSalesWhatsAppStyles.css';

const CreditAccountsTable = ({
    accounts,
    filters,
    onPreviewMessage,
    onSendWhatsApp,
    isLoading,
}) => {
    const [sortConfig, setSortConfig] = useState({
        key: 'days_overdue',
        direction: 'desc',
    });

    // Aplicar filtros
    const filteredAccounts = filterCreditAccounts(accounts, filters);

    // Aplicar ordenamiento
    const sortedAccounts = [...filteredAccounts].sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Manejar casos especiales de ordenamiento
        if (sortConfig.key === 'remaining_amount') {
            aValue = parseFloat(aValue || 0);
            bValue = parseFloat(bValue || 0);
        } else if (sortConfig.key === 'days_overdue') {
            aValue = parseInt(aValue || 0);
            bValue = parseInt(bValue || 0);
        }

        if (aValue < bValue) {
            return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
            return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
    });

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
        }));
    };

    const getSortIcon = (key) => {
        if (sortConfig.key === key) {
            return sortConfig.direction === 'asc' ? '↑' : '↓';
        }
        return '⇅';
    };

    const handleWhatsAppClick = (account) => {
        if (account.has_phone && account.whatsapp_url) {
            onSendWhatsApp && onSendWhatsApp(account);
            window.open(account.whatsapp_url, '_blank');
        }
    };

    const formatPhoneNumber = (phone) => {
        if (!phone) return 'Sin teléfono';
        // Formatear número chileno
        const cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length === 9) {
            return `+56 ${cleanPhone.substring(0, 1)} ${cleanPhone.substring(1, 5)} ${cleanPhone.substring(5)}`;
        }
        return phone;
    };

    const getStatusBadge = (status, daysOverdue, referenceDate) => {
        const urgencyClass = getUrgencyClass(daysOverdue, status);
        let statusText = '';
        let extraClass = '';

        if (status === 'vencido') {
            statusText = `VENCIDO ${daysOverdue} DÍAS`;
        } else if (status === 'proximo') {
            statusText = `PRÓXIMO A VENCER`;
        } else if (status === 'activo') {
            const daysToDue = Math.abs(daysOverdue);
            statusText = `ACTIVO (${daysToDue} días)`;
        } else if (status === 'hoy') {
            statusText = 'HOY';
            extraClass = 'status-today';
        } else if (status === 'sin_fecha') {
            statusText = 'SIN_FECHA';
            extraClass = 'status-nodate';
        } else {
            statusText = status;
        }

        return (
            <span className={`status-badge ${urgencyClass} ${extraClass}`}>
                {statusText}
            </span>
        );
    };

    if (isLoading) {
        return (
            <div className="credits-table-container">
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Cargando cuentas de crédito...</p>
                </div>
            </div>
        );
    }

    if (!accounts || accounts.length === 0) {
        return (
            <div className="credits-table-container">
                <div className="empty-state">
                    <h3>No hay cuentas de crédito disponibles</h3>
                    <p>No se encontraron cuentas de crédito vencidas o próximas a vencer.</p>
                </div>
            </div>
        );
    }

    if (filteredAccounts.length === 0) {
        return (
            <div className="credits-table-container">
                <div className="empty-state">
                    <h3>No hay resultados</h3>
                    <p>No se encontraron cuentas que coincidan con los filtros aplicados.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="credits-table-container">
            <div className="table-header">
                <h3>Cuentas de Crédito - Recordatorios WhatsApp</h3>
                <div className="results-count">
                    Mostrando {filteredAccounts.length} de {accounts.length} cuentas
                </div>
            </div>

            <div className="table-wrapper">
                <table className="credits-table">
                    <thead>
                        <tr>
                            <th onClick={() => handleSort('customer_name')}>
                                Cliente {getSortIcon('customer_name')}
                            </th>
                            <th onClick={() => handleSort('customer_phone')}>
                                Teléfono {getSortIcon('customer_phone')}
                            </th>
                            <th onClick={() => handleSort('remaining_amount')}>
                                Monto Pendiente {getSortIcon('remaining_amount')}
                            </th>
                            <th onClick={() => handleSort('days_overdue')}>
                                Días Vencidos {getSortIcon('days_overdue')}
                            </th>
                            <th onClick={() => handleSort('reference_date')}>
                                Fecha Referencia {getSortIcon('reference_date')}
                            </th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedAccounts.map((account, index) => (
                            <tr key={account.id || index} className={getUrgencyClass(account.days_overdue, account.status)}>
                                <td className="customer-info">
                                    <div className="customer-details">
                                        <div className="customer-name">
                                            {account.customer_name || 'Sin nombre'}
                                        </div>
                                        {account.customer_email && (
                                            <div className="customer-email">
                                                {account.customer_email}
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="phone-info">
                                    <div className="phone-container">
                                        <span className="phone-number">
                                            {formatPhoneNumber(account.customer_phone)}
                                        </span>
                                        {account.has_phone && (
                                            <span className="phone-status-icon">✓</span>
                                        )}
                                    </div>
                                </td>
                                <td className="amount-info">
                                    <div className="amount-container">
                                        <span className="amount-value">
                                            {formatCurrency(account.remaining_amount)}
                                        </span>
                                    </div>
                                </td>
                                <td className="days-info">
                                    <div className="days-container">
                                        <span className={`days-value ${getUrgencyClass(account.days_overdue, account.status)}`}>
                                            {account.days_overdue || 0}
                                        </span>
                                    </div>
                                </td>
                                <td className="date-info">
                                    <div className="date-container">
                                        <span className="date-value">
                                            {account.reference_date ? 
                                                new Date(account.reference_date).toLocaleDateString('es-CL') : 
                                                'Sin fecha'
                                            }
                                        </span>
                                    </div>
                                </td>
                                <td className="status-info">
                                    {getStatusBadge(account.status, account.days_overdue, account.reference_date)}
                                </td>
                                <td className="actions-info">
                                    <div className="actions-container">
                                        <button
                                            className="preview-button"
                                            onClick={() => onPreviewMessage(account)}
                                            title="Ver mensaje de WhatsApp"
                                        >
                                            👁️
                                        </button>
                                        
                                        {account.has_phone && account.whatsapp_url ? (
                                            <button
                                                className="whatsapp-button"
                                                onClick={() => handleWhatsAppClick(account)}
                                                title="Enviar por WhatsApp"
                                            >
                                                <span className="whatsapp-icon">📱</span>
                                                WhatsApp
                                            </button>
                                        ) : (
                                            <button
                                                className="whatsapp-button no-phone-button"
                                                disabled
                                                title="Cliente sin teléfono"
                                            >
                                                <span className="whatsapp-icon">📱</span>
                                                Sin teléfono
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="table-footer">
                <div className="table-summary">
                    <div className="summary-item">
                        <span className="summary-label">Total mostrado:</span>
                        <span className="summary-value">
                            {formatCurrency(
                                filteredAccounts.reduce((sum, account) => 
                                    sum + parseFloat(account.remaining_amount || 0), 0
                                )
                            )}
                        </span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">Con teléfono:</span>
                        <span className="summary-value">
                            {filteredAccounts.filter(account => account.has_phone).length}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreditAccountsTable; 