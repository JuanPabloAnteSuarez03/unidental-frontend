import React from 'react';
import './WhatsAppDebtsStyles.css';

const DebtsFilters = ({
    filters,
    onFiltersChange,
    onRefresh,
    isLoading = false
}) => {
    const handleFilterChange = (key, value) => {
        onFiltersChange({
            ...filters,
            [key]: value
        });
    };

    return (
        <div className="whatsapp-debts-filters">
            <div className="filters-row">
                {/* Búsqueda de texto */}
                <div className="filter-group">
                    <label className="filter-label">Buscar</label>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Buscar proveedor, contacto o teléfono..."
                        value={filters.searchTerm || ''}
                        onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                    />
                </div>

                {/* Checkbox: Solo mostrar con teléfono */}
                <div className="filter-group">
                    <label className="filter-label">Filtros</label>
                    <div className="filter-checkbox">
                        <input
                            type="checkbox"
                            id="onlyWithPhone"
                            checked={filters.onlyWithPhone || false}
                            onChange={(e) => handleFilterChange('onlyWithPhone', e.target.checked)}
                        />
                        <label htmlFor="onlyWithPhone">Solo con teléfono</label>
                    </div>
                </div>

                {/* Selector: Días de anticipación */}
                <div className="filter-group">
                    <label className="filter-label">Días de anticipación</label>
                    <select
                        className="filter-select"
                        value={filters.upcomingDays || 3}
                        onChange={(e) => handleFilterChange('upcomingDays', parseInt(e.target.value))}
                    >
                        <option value={1}>1 día</option>
                        <option value={2}>2 días</option>
                        <option value={3}>3 días</option>
                        <option value={4}>4 días</option>
                        <option value={5}>5 días</option>
                        <option value={6}>6 días</option>
                        <option value={7}>7 días</option>
                    </select>
                </div>

                {/* Toggle: Incluir próximas a vencer */}
                <div className="filter-group">
                    <label className="filter-label">Recordatorios</label>
                    <div className="filter-toggle">
                        <input
                            type="checkbox"
                            id="includeUpcoming"
                            checked={filters.includeUpcoming || false}
                            onChange={(e) => handleFilterChange('includeUpcoming', e.target.checked)}
                        />
                        <label htmlFor="includeUpcoming">Incluir próximas a vencer</label>
                    </div>
                </div>

                {/* Botón: Actualizar datos */}
                <div className="filter-group">
                    <label className="filter-label">Acciones</label>
                    <button
                        className="filter-button"
                        onClick={onRefresh}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Actualizando...' : 'Actualizar datos'}
                    </button>
                </div>
            </div>

            {/* Filtros adicionales en una segunda fila */}
            <div className="filters-row" style={{ marginTop: '12px' }}>
                {/* Filtro por urgencia */}
                <div className="filter-group">
                    <label className="filter-label">Urgencia</label>
                    <select
                        className="filter-select"
                        value={filters.urgencyFilter || 'all'}
                        onChange={(e) => handleFilterChange('urgencyFilter', e.target.value)}
                    >
                        <option value="all">Todas las urgencias</option>
                        <option value="urgent">+16 días (Urgente)</option>
                        <option value="medium">6-15 días (Medio)</option>
                        <option value="low">1-5 días (Bajo)</option>
                        <option value="upcoming">Próximas a vencer</option>
                    </select>
                </div>

                {/* Filtro por estado */}
                <div className="filter-group">
                    <label className="filter-label">Estado</label>
                    <select
                        className="filter-select"
                        value={filters.statusFilter || 'all'}
                        onChange={(e) => handleFilterChange('statusFilter', e.target.value)}
                    >
                        <option value="all">Todos los estados</option>
                        <option value="vencido">Vencido</option>
                        <option value="proximo">Próximo</option>
                        <option value="hoy">Hoy</option>
                    </select>
                </div>

                {/* Filtro por monto */}
                <div className="filter-group">
                    <label className="filter-label">Monto mínimo</label>
                    <input
                        type="number"
                        className="search-input"
                        placeholder="Monto mínimo..."
                        value={filters.minAmount || ''}
                        onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                        style={{ maxWidth: '150px' }}
                    />
                </div>

                {/* Mostrar totales */}
                <div className="filter-group">
                    <label className="filter-label">Vista</label>
                    <div className="filter-toggle">
                        <input
                            type="checkbox"
                            id="showStats"
                            checked={filters.showStats !== false}
                            onChange={(e) => handleFilterChange('showStats', e.target.checked)}
                        />
                        <label htmlFor="showStats">Mostrar estadísticas</label>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DebtsFilters; 