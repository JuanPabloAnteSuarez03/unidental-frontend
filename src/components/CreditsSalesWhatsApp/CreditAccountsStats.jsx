import React from 'react';
import { calculateCreditAccountStats, formatCurrency } from '../../services/creditsSalesWhatsappService';
import './CreditsSalesWhatsAppStyles.css';

const CreditAccountsStats = ({ accounts, isVisible }) => {
    if (!isVisible) return null;

    const stats = calculateCreditAccountStats(accounts);

    const statsConfig = [
        {
            key: 'total_accounts',
            label: 'Total Cuentas',
            value: stats.total_accounts,
            icon: '📊',
            className: 'stat-total',
        },
        {
            key: 'total_amount',
            label: 'Monto Total',
            value: formatCurrency(stats.total_amount),
            icon: '💰',
            className: 'stat-amount',
        },
        {
            key: 'overdue_count',
            label: 'Vencidas',
            value: stats.overdue_count,
            icon: '⚠️',
            className: 'stat-overdue',
        },
        {
            key: 'upcoming_count',
            label: 'Próximas',
            value: stats.upcoming_count,
            icon: '📅',
            className: 'stat-upcoming',
        },
        {
            key: 'active_count',
            label: 'Activas',
            value: stats.active_count,
            icon: '✅',
            className: 'stat-active',
            description: 'Cuentas con saldo pendiente vigente',
        },
        {
            key: 'with_phone_count',
            label: 'Con Teléfono',
            value: stats.with_phone_count,
            icon: '📱',
            className: 'stat-phone',
        },
        {
            key: 'urgent_count',
            label: 'Urgentes',
            value: stats.urgent_count,
            icon: '🔴',
            className: 'stat-urgent',
        },
    ];

    const getPercentage = (value, total) => {
        if (total === 0) return 0;
        return Math.round((value / total) * 100);
    };

    return (
        <div className="credits-stats-container">
            <div className="stats-header">
                <h3>Estadísticas de Cuentas de Crédito</h3>
                <div className="stats-subtitle">
                    Resumen de cuentas vencidas y próximas a vencer
                </div>
            </div>

            <div className="stats-grid">
                {statsConfig.map((stat) => (
                    <div key={stat.key} className={`stat-card ${stat.className}`}>
                        <div className="stat-icon">{stat.icon}</div>
                        <div className="stat-content">
                            <div className="stat-value">{stat.value}</div>
                            <div className="stat-label">{stat.label}</div>
                            {stat.key !== 'total_accounts' && stat.key !== 'total_amount' && (
                                <div className="stat-percentage">
                                    {getPercentage(
                                        stat.key === 'total_amount' ? stats.total_amount : stats[stat.key],
                                        stats.total_accounts
                                    )}% del total
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="stats-insights">
                <div className="insights-grid">
                    <div className="insight-item">
                        <div className="insight-label">Efectividad WhatsApp</div>
                        <div className="insight-value">
                            {getPercentage(stats.with_phone_count, stats.total_accounts)}%
                        </div>
                        <div className="insight-description">
                            Cuentas con teléfono disponible
                        </div>
                    </div>

                    <div className="insight-item">
                        <div className="insight-label">Urgencia</div>
                        <div className="insight-value">
                            {getPercentage(stats.urgent_count, stats.total_accounts)}%
                        </div>
                        <div className="insight-description">
                            Cuentas urgentes (15+ días)
                        </div>
                    </div>

                    <div className="insight-item">
                        <div className="insight-label">Cobertura</div>
                        <div className="insight-value">
                            {getPercentage(stats.overdue_count, stats.total_accounts)}%
                        </div>
                        <div className="insight-description">
                            Cuentas ya vencidas
                        </div>
                    </div>

                    {stats.total_accounts > 0 && (
                        <div className="insight-item">
                            <div className="insight-label">Promedio por Cuenta</div>
                            <div className="insight-value">
                                {formatCurrency(stats.total_amount / stats.total_accounts)}
                            </div>
                            <div className="insight-description">
                                Monto promedio pendiente
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Indicadores visuales */}
            <div className="stats-indicators">
                <div className="indicator-row">
                    <div className="indicator-label">Estado de Cuentas:</div>
                    <div className="indicator-bars">
                        <div className="indicator-bar">
                            <div className="bar-label">Vencidas</div>
                            <div className="bar-container">
                                <div 
                                    className="bar-fill overdue-bar"
                                    style={{ width: `${getPercentage(stats.overdue_count, stats.total_accounts)}%` }}
                                ></div>
                            </div>
                            <div className="bar-percentage">
                                {getPercentage(stats.overdue_count, stats.total_accounts)}%
                            </div>
                        </div>

                        <div className="indicator-bar">
                            <div className="bar-label">Próximas</div>
                            <div className="bar-container">
                                <div 
                                    className="bar-fill upcoming-bar"
                                    style={{ width: `${getPercentage(stats.upcoming_count, stats.total_accounts)}%` }}
                                ></div>
                            </div>
                            <div className="bar-percentage">
                                {getPercentage(stats.upcoming_count, stats.total_accounts)}%
                            </div>
                        </div>

                        <div className="indicator-bar">
                            <div className="bar-label">Con teléfono</div>
                            <div className="bar-container">
                                <div 
                                    className="bar-fill phone-bar"
                                    style={{ width: `${getPercentage(stats.with_phone_count, stats.total_accounts)}%` }}
                                ></div>
                            </div>
                            <div className="bar-percentage">
                                {getPercentage(stats.with_phone_count, stats.total_accounts)}%
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Alertas y recomendaciones */}
            {stats.total_accounts > 0 && (
                <div className="stats-alerts">
                    {stats.urgent_count > 0 && (
                        <div className="alert-item alert-urgent">
                            <span className="alert-icon">🔴</span>
                            <span className="alert-message">
                                {stats.urgent_count} cuenta{stats.urgent_count !== 1 ? 's' : ''} urgente{stats.urgent_count !== 1 ? 's' : ''} 
                                (15+ días vencida{stats.urgent_count !== 1 ? 's' : ''}) requiere{stats.urgent_count !== 1 ? 'n' : ''} atención inmediata
                            </span>
                        </div>
                    )}

                    {stats.with_phone_count === 0 && (
                        <div className="alert-item alert-warning">
                            <span className="alert-icon">⚠️</span>
                            <span className="alert-message">
                                Ninguna cuenta tiene teléfono registrado. Actualizar información de contacto.
                            </span>
                        </div>
                    )}

                    {stats.with_phone_count > 0 && stats.with_phone_count < stats.total_accounts && (
                        <div className="alert-item alert-info">
                            <span className="alert-icon">📱</span>
                            <span className="alert-message">
                                {stats.total_accounts - stats.with_phone_count} cuenta{stats.total_accounts - stats.with_phone_count !== 1 ? 's' : ''} 
                                sin teléfono. Completar información de contacto para mejorar efectividad.
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CreditAccountsStats; 