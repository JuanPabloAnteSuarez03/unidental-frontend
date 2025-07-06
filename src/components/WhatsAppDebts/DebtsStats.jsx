import React from 'react';
import { calculateDebtStats, formatCurrency } from '../../services/whatsappDebtsService';
import './WhatsAppDebtsStyles.css';

const DebtsStats = ({ debts, isVisible = true }) => {
    if (!isVisible) return null;

    const stats = calculateDebtStats(debts);

    return (
        <div className="debts-stats">
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-value">{stats.total_debts}</div>
                    <div className="stat-label">Total Deudas</div>
                </div>
                
                <div className="stat-card">
                    <div className="stat-value stat-amount">
                        {formatCurrency(stats.total_amount)}
                    </div>
                    <div className="stat-label">Monto Total</div>
                </div>
                
                <div className="stat-card">
                    <div className="stat-value stat-overdue">{stats.overdue_count}</div>
                    <div className="stat-label">Vencidas</div>
                </div>
                
                <div className="stat-card">
                    <div className="stat-value stat-upcoming">{stats.upcoming_count}</div>
                    <div className="stat-label">Próximas</div>
                </div>
                
                <div className="stat-card">
                    <div className="stat-value stat-phone">{stats.with_phone_count}</div>
                    <div className="stat-label">Con Teléfono</div>
                </div>
                
                <div className="stat-card">
                    <div className="stat-value stat-overdue">{stats.urgent_count}</div>
                    <div className="stat-label">Urgentes (+15 días)</div>
                </div>
            </div>
        </div>
    );
};

export default DebtsStats; 