import React from 'react';
import './CreditsSalesWhatsAppStyles.css';

const CreditAccountsFilters = ({
    filters,
    onFiltersChange,
    onRefresh,
    isLoading,
}) => {
    const handleFilterChange = (key, value) => {
        const newFilters = { ...filters, [key]: value };
        onFiltersChange(newFilters);
    };

    const handleToggleStats = () => {
        handleFilterChange('showStats', !filters.showStats);
    };

    const handleClearFilters = () => {
        const defaultFilters = {
            searchTerm: '',
            onlyWithPhone: false,
            upcomingDays: 7,
            includeUpcoming: false,
            includeAll: false,
            viewMode: 'overdue',
            urgencyFilter: 'all',
            statusFilter: 'all',
            minAmount: '',
            showStats: filters.showStats, // Mantener el estado de mostrar estadísticas
        };
        onFiltersChange(defaultFilters);
    };

    return (
        <div className="credits-filters-container">
            <div className="filters-header">
                <h3>Filtros de Búsqueda</h3>
                <div className="filters-actions">
                    <button
                        className="toggle-stats-button"
                        onClick={handleToggleStats}
                        title={filters.showStats ? 'Ocultar estadísticas' : 'Mostrar estadísticas'}
                    >
                        {filters.showStats ? '📊 Ocultar Stats' : '📊 Mostrar Stats'}
                    </button>
                    <button
                        className="refresh-button"
                        onClick={onRefresh}
                        disabled={isLoading}
                        title="Actualizar datos"
                    >
                        🔄 {isLoading ? 'Cargando...' : 'Actualizar'}
                    </button>
                </div>
            </div>

            {/* Selector de Modo de Vista - Prominente */}
            <div className="view-mode-selector">
                <h4>Modo de Vista</h4>
                <div className="view-mode-buttons">
                    <button
                        className={`view-mode-button ${filters.viewMode === 'overdue' ? 'active' : ''}`}
                        onClick={() => handleFilterChange('viewMode', 'overdue')}
                    >
                        🚨 Solo Vencidos
                        <span className="mode-description">Solo cuentas vencidas (DEFAULT)</span>
                    </button>
                    <button
                        className={`view-mode-button ${filters.viewMode === 'upcoming' ? 'active' : ''}`}
                        onClick={() => handleFilterChange('viewMode', 'upcoming')}
                    >
                        📅 Vencidos + Próximos
                        <span className="mode-description">Incluye próximos a vencer</span>
                    </button>
                    <button
                        className={`view-mode-button ${filters.viewMode === 'all' ? 'active' : ''}`}
                        onClick={() => handleFilterChange('viewMode', 'all')}
                    >
                        📊 Todos los Créditos
                        <span className="mode-description">TODOS los créditos activos (NUEVO)</span>
                    </button>
                </div>
            </div>

            <div className="filters-grid">
                {/* Búsqueda por texto */}
                <div className="filter-group">
                    <label htmlFor="searchTerm">Buscar Cliente:</label>
                    <input
                        id="searchTerm"
                        type="text"
                        placeholder="Nombre, teléfono o email del cliente..."
                        value={filters.searchTerm}
                        onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                        className="filter-input"
                    />
                </div>

                {/* Filtro por teléfono */}
                <div className="filter-group">
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={filters.onlyWithPhone}
                            onChange={(e) => handleFilterChange('onlyWithPhone', e.target.checked)}
                        />
                        <span className="checkbox-text">Solo con teléfono</span>
                    </label>
                </div>

                {/* Filtro por urgencia */}
                <div className="filter-group">
                    <label htmlFor="urgencyFilter">Urgencia:</label>
                    <select
                        id="urgencyFilter"
                        value={filters.urgencyFilter}
                        onChange={(e) => handleFilterChange('urgencyFilter', e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">Todas las urgencias</option>
                        <option value="urgent">Urgente (15+ días)</option>
                        <option value="medium">Medio (6-15 días)</option>
                        <option value="low">Bajo (1-5 días)</option>
                        <option value="upcoming">Próximo a vencer</option>
                    </select>
                </div>

                {/* Filtro por estado */}
                <div className="filter-group">
                    <label htmlFor="statusFilter">Estado:</label>
                    <select
                        id="statusFilter"
                        value={filters.statusFilter}
                        onChange={(e) => handleFilterChange('statusFilter', e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">Todos los estados</option>
                        {filters.viewMode !== 'all' && <option value="vencido">Vencido</option>}
                        {filters.viewMode !== 'overdue' && <option value="proximo">Próximo a vencer</option>}
                        {filters.viewMode === 'all' && <option value="activo">Activo</option>}
                    </select>
                </div>

                {/* Filtro por monto mínimo */}
                <div className="filter-group">
                    <label htmlFor="minAmount">Monto mínimo:</label>
                    <input
                        id="minAmount"
                        type="number"
                        placeholder="0"
                        value={filters.minAmount}
                        onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                        className="filter-input"
                        min="0"
                    />
                </div>

                {/* Días de anticipación (solo en modo próximos) */}
                {filters.viewMode === 'upcoming' && (
                    <div className="filter-group">
                        <label htmlFor="upcomingDays">Días de anticipación:</label>
                        <select
                            id="upcomingDays"
                            value={filters.upcomingDays}
                            onChange={(e) => handleFilterChange('upcomingDays', parseInt(e.target.value))}
                            className="filter-select"
                        >
                            <option value={1}>1 día</option>
                            <option value={3}>3 días</option>
                            <option value={7}>7 días (default)</option>
                            <option value={15}>15 días</option>
                            <option value={30}>30 días</option>
                        </select>
                    </div>
                )}

                {/* Botón para limpiar filtros */}
                <div className="filter-group">
                    <button
                        className="clear-filters-button"
                        onClick={handleClearFilters}
                        title="Limpiar todos los filtros"
                    >
                        🗑️ Limpiar Filtros
                    </button>
                </div>
            </div>

            {/* Resumen de filtros activos */}
            <div className="active-filters-summary">
                {(filters.searchTerm || filters.onlyWithPhone || filters.urgencyFilter !== 'all' || 
                  filters.statusFilter !== 'all' || filters.minAmount || filters.viewMode !== 'overdue') && (
                    <div className="filters-summary">
                        <span className="summary-label">Configuración activa:</span>
                        <div className="active-filters-list">
                            {filters.viewMode !== 'overdue' && (
                                <span className="active-filter mode-filter">
                                    Modo: {filters.viewMode === 'upcoming' ? 'Vencidos + Próximos' : 
                                          filters.viewMode === 'all' ? 'Todos los Créditos' : 'Solo Vencidos'}
                                    {filters.viewMode === 'upcoming' && ` (${filters.upcomingDays} días)`}
                                </span>
                            )}
                            {filters.searchTerm && (
                                <span className="active-filter">
                                    Búsqueda: "{filters.searchTerm}"
                                </span>
                            )}
                            {filters.onlyWithPhone && (
                                <span className="active-filter">
                                    Solo con teléfono
                                </span>
                            )}
                            {filters.urgencyFilter !== 'all' && (
                                <span className="active-filter">
                                    Urgencia: {filters.urgencyFilter}
                                </span>
                            )}
                            {filters.statusFilter !== 'all' && (
                                <span className="active-filter">
                                    Estado: {filters.statusFilter}
                                </span>
                            )}
                            {filters.minAmount && (
                                <span className="active-filter">
                                    Monto mínimo: ${filters.minAmount}
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreditAccountsFilters; 