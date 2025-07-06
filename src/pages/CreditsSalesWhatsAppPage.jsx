import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getCreditAccountsWithWhatsApp } from '../services/creditsSalesWhatsappService';
import CreditAccountsFilters from '../components/CreditsSalesWhatsApp/CreditAccountsFilters';
import CreditAccountsStats from '../components/CreditsSalesWhatsApp/CreditAccountsStats';
import CreditAccountsTable from '../components/CreditsSalesWhatsApp/CreditAccountsTable';
import CreditMessagePreviewModal from '../components/CreditsSalesWhatsApp/CreditMessagePreviewModal';
import '../components/CreditsSalesWhatsApp/CreditsSalesWhatsAppStyles.css';

const CreditsSalesWhatsAppPage = () => {
    const { authToken, currentUser } = useAuth();
    const [accounts, setAccounts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    
    // Estados para filtros
    const [filters, setFilters] = useState({
        searchTerm: '',
        onlyWithPhone: false,
        upcomingDays: 7,
        includeUpcoming: false,
        includeAll: false,
        viewMode: 'overdue', // 'overdue', 'upcoming', 'all'
        urgencyFilter: 'all',
        statusFilter: 'all',
        minAmount: '',
        showStats: true,
    });

    // Estados para modal
    const [previewModal, setPreviewModal] = useState({
        isOpen: false,
        account: null,
    });

    // Cargar cuentas al montar el componente
    useEffect(() => {
        if (authToken) {
            loadAccounts();
        }
    }, [authToken]);

    // Recargar cuando cambian los filtros principales
    useEffect(() => {
        if (authToken) {
            const timer = setTimeout(() => {
                loadAccounts();
            }, 500); // Debounce para evitar múltiples llamadas

            return () => clearTimeout(timer);
        }
    }, [filters.upcomingDays, filters.includeUpcoming, filters.includeAll, filters.viewMode, authToken]);

    const loadAccounts = async () => {
        if (!authToken) return;

        setIsLoading(true);
        setError(null);

        try {
            const params = {
                include_upcoming: filters.includeUpcoming,
                upcoming_days: filters.upcomingDays,
                include_all: filters.includeAll,
            };

            // Ajustar parámetros según el modo de vista
            if (filters.viewMode === 'all') {
                params.include_all = true;
            } else if (filters.viewMode === 'upcoming') {
                params.include_upcoming = true;
                params.include_all = false;
            } else if (filters.viewMode === 'overdue') {
                params.include_upcoming = false;
                params.include_all = false;
            }

            console.log('🔍 Loading accounts with params:', params);

            const response = await getCreditAccountsWithWhatsApp(params, authToken);
            setAccounts(response.overdue_accounts || []);
            setLastUpdated(new Date());
        } catch (err) {
            console.error('Error loading credit accounts:', err);
            setError(err.message || 'Error al cargar las cuentas de crédito');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFiltersChange = (newFilters) => {
        setFilters(newFilters);
    };

    const handleRefresh = () => {
        loadAccounts();
    };

    const handlePreviewMessage = (account) => {
        setPreviewModal({
            isOpen: true,
            account: account,
        });
    };

    const handleClosePreviewModal = () => {
        setPreviewModal({
            isOpen: false,
            account: null,
        });
    };

    const handleSendWhatsApp = (account) => {
        console.log('Enviando mensaje de WhatsApp a:', account.customer_name);
        // Aquí podrías agregar logging o analytics
    };

    const formatLastUpdated = (date) => {
        if (!date) return '';
        return date.toLocaleString('es-CL', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="credits-sales-whatsapp-container">
            {/* Header */}
            <div className="credits-sales-whatsapp-header">
                <h1 className="credits-sales-whatsapp-title">
                    Recordatorios WhatsApp - Cuentas de Crédito
                </h1>
                <p className="credits-sales-whatsapp-subtitle">
                    Sistema de recordatorios semi-automatizado por WhatsApp para cuentas de crédito de ventas.
                    <br />
                    <strong>🆕 NUEVAS OPCIONES:</strong> Visualiza solo vencidos, próximos a vencer, o TODOS los créditos activos.
                    {lastUpdated && (
                        <span style={{ marginLeft: '16px', color: '#999' }}>
                            Última actualización: {formatLastUpdated(lastUpdated)}
                        </span>
                    )}
                </p>
            </div>

            {/* Error */}
            {error && (
                <div className="error-container">
                    <div className="error-title">Error al cargar datos</div>
                    <div className="error-message">{error}</div>
                </div>
            )}

            {/* Filtros */}
            <CreditAccountsFilters
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onRefresh={handleRefresh}
                isLoading={isLoading}
            />

            {/* Estadísticas */}
            {filters.showStats && (
                <CreditAccountsStats
                    accounts={accounts}
                    isVisible={filters.showStats}
                />
            )}

            {/* Tabla de cuentas */}
            <CreditAccountsTable
                accounts={accounts}
                filters={filters}
                onPreviewMessage={handlePreviewMessage}
                onSendWhatsApp={handleSendWhatsApp}
                isLoading={isLoading}
            />

            {/* Modal de vista previa */}
            <CreditMessagePreviewModal
                isOpen={previewModal.isOpen}
                account={previewModal.account}
                onClose={handleClosePreviewModal}
                onSendWhatsApp={handleSendWhatsApp}
            />
        </div>
    );
};

export default CreditsSalesWhatsAppPage; 