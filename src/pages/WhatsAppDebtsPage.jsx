import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getOverdueDebtsWithWhatsApp } from '../services/whatsappDebtsService';
import MainLayout from '../components/layouts/MainLayout';
import DebtsFilters from '../components/WhatsAppDebts/DebtsFilters';
import DebtsStats from '../components/WhatsAppDebts/DebtsStats';
import DebtsTable from '../components/WhatsAppDebts/DebtsTable';
import MessagePreviewModal from '../components/WhatsAppDebts/MessagePreviewModal';
import '../components/WhatsAppDebts/WhatsAppDebtsStyles.css';

const WhatsAppDebtsPage = () => {
    const { authToken, currentUser } = useAuth();
    const [debts, setDebts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    
    // Estados para filtros
    const [filters, setFilters] = useState({
        searchTerm: '',
        onlyWithPhone: false,
        upcomingDays: 3,
        includeUpcoming: false,
        urgencyFilter: 'all',
        statusFilter: 'all',
        minAmount: '',
        showStats: true,
    });

    // Estados para modal
    const [previewModal, setPreviewModal] = useState({
        isOpen: false,
        debt: null,
    });

    // Cargar deudas al montar el componente
    useEffect(() => {
        if (authToken) {
            loadDebts();
        }
    }, [authToken]);

    // Recargar cuando cambian los filtros principales
    useEffect(() => {
        if (authToken) {
            const timer = setTimeout(() => {
                loadDebts();
            }, 500); // Debounce para evitar múltiples llamadas

            return () => clearTimeout(timer);
        }
    }, [filters.upcomingDays, filters.includeUpcoming, authToken]);

    const loadDebts = async () => {
        if (!authToken) return;

        setIsLoading(true);
        setError(null);

        try {
            const params = {
                include_upcoming: filters.includeUpcoming,
                upcoming_days: filters.upcomingDays,
            };

            const response = await getOverdueDebtsWithWhatsApp(params, authToken);
            setDebts(response.overdue_accounts || []);
            setLastUpdated(new Date());
        } catch (err) {
            console.error('Error loading debts:', err);
            setError(err.message || 'Error al cargar las deudas');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFiltersChange = (newFilters) => {
        setFilters(newFilters);
    };

    const handleRefresh = () => {
        loadDebts();
    };

    const handlePreviewMessage = (debt) => {
        setPreviewModal({
            isOpen: true,
            debt: debt,
        });
    };

    const handleClosePreviewModal = () => {
        setPreviewModal({
            isOpen: false,
            debt: null,
        });
    };

    const handleSendWhatsApp = (debt) => {
        console.log('Enviando mensaje de WhatsApp a:', debt.contact_name);
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
        <MainLayout>
            <div className="whatsapp-debts-container">
                {/* Header */}
                <div className="whatsapp-debts-header">
                    <h1 className="whatsapp-debts-title">
                        Recordatorios WhatsApp - Deudas Vencidas
                    </h1>
                    <p className="whatsapp-debts-subtitle">
                        Sistema de recordatorios semi-automatizado por WhatsApp para deudas de compras a crédito.
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
                <DebtsFilters
                    filters={filters}
                    onFiltersChange={handleFiltersChange}
                    onRefresh={handleRefresh}
                    isLoading={isLoading}
                />

                {/* Estadísticas */}
                {filters.showStats && (
                    <DebtsStats
                        debts={debts}
                        isVisible={filters.showStats}
                    />
                )}

                {/* Tabla de deudas */}
                <DebtsTable
                    debts={debts}
                    filters={filters}
                    onPreviewMessage={handlePreviewMessage}
                    onSendWhatsApp={handleSendWhatsApp}
                    isLoading={isLoading}
                />

                {/* Modal de vista previa */}
                <MessagePreviewModal
                    isOpen={previewModal.isOpen}
                    debt={previewModal.debt}
                    onClose={handleClosePreviewModal}
                    onSendWhatsApp={handleSendWhatsApp}
                />
            </div>
        </MainLayout>
    );
};

export default WhatsAppDebtsPage; 