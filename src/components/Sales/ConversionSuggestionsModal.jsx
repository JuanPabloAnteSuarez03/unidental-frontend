import React, { useState } from 'react';
import '../CreditsSalesWhatsApp/CreditsSalesWhatsAppStyles.css';
import { getProductBatches } from '../../services/conversionService';
import { executeConversion } from '../../services/conversionService';
import { useAuth } from '../../context/AuthContext';

/**
 * Modal que muestra sugerencias de conversión cuando no hay suficiente stock
 * Actualizado para el nuevo sistema de lotes y conversiones
 * props:
 *  - isOpen: boolean
 *  - error: objeto con información del error de stock y sugerencias
 *  - locationId: ID de la ubicación actual
 *  - onCancel: callback
 *  - onConfirm: callback que recibe la sugerencia seleccionada y lote (si aplica)
 */
const ConversionSuggestionsModal = ({ isOpen, error, locationId, onCancel, onConfirm }) => {
  const { authToken } = useAuth();
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [requiresBatchControl, setRequiresBatchControl] = useState(false);
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [batchError, setBatchError] = useState(null);
  const [conversionErrorMsg, setConversionErrorMsg] = useState(null);
  const [loadingConversion, setLoadingConversion] = useState(false);
  const [fifoBatch, setFifoBatch] = useState(null);

  if (!isOpen || !error) return null;

  const handleSuggestionSelect = async (suggestion) => {
    setSelectedSuggestion(suggestion);
    setRequiresBatchControl(false);
    setBatches([]);
    setFifoBatch(null);
    setSelectedBatch(null);
    setBatchError(null);
    setLoading(true);
    try {
      // 1. Consultar si requiere lote
      const productId = suggestion.conversion.from_product;
      const response = await fetch(
        `https://unidental-backend.onrender.com/api/catalogs/products/${productId}/`,
        {
          headers: {
            Authorization: `Token ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) throw new Error('Error consultando producto');
      const productData = await response.json();
      console.log('[ConversionModal] requires_batch_control:', productData.requires_batch_control);
      if (productData.requires_batch_control) {
        setRequiresBatchControl(true);
        // 2. Consultar lotes disponibles
        const data = await getProductBatches(
          productId,
          locationId,
          authToken
        );
        const availableBatches = (data.batches || []).filter(batch => {
          const locationStock = batch.locations?.find(loc => loc.location_id === locationId);
          return locationStock && locationStock.quantity > 0;
        });
        console.log('[ConversionModal] Lotes disponibles:', availableBatches);
        setBatches(availableBatches);
        if (availableBatches.length > 0) {
          // Ordenar por fecha de fabricación ascendente (FIFO)
          const sorted = [...availableBatches].sort((a, b) => new Date(a.manufacturing_date) - new Date(b.manufacturing_date));
          setFifoBatch(sorted[0]);
          console.log('[ConversionModal] Lote FIFO seleccionado:', sorted[0]);
        } else {
          setBatchError('❌ No hay lotes disponibles para desarmar en esta ubicación');
          setFifoBatch(null);
          console.log('[ConversionModal] No hay lotes disponibles para desarmar en esta ubicación');
        }
      } else {
        setRequiresBatchControl(false);
        setFifoBatch(null);
        console.log('[ConversionModal] El producto NO requiere control de lotes');
      }
    } catch (err) {
      setBatchError('Error consultando producto/lotes');
      setFifoBatch(null);
      console.log('[ConversionModal] Error consultando producto/lotes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedSuggestion) return;
    if (requiresBatchControl && !fifoBatch) {
      setBatchError('No hay lote FIFO disponible');
      return;
    }
    setLoadingConversion(true);
    setConversionErrorMsg(null);
    try {
      const conversionData = {
        conversion_id: selectedSuggestion.conversion?.id,
        quantity_to_convert: selectedSuggestion.units_needed,
        location_id: locationId,
        notes: `Conversión sugerida desde modal - ${selectedSuggestion.conversion?.from_product_name} → ${error.product}`
      };
      if (requiresBatchControl) {
        conversionData.batch_id = fifoBatch.batch_id || fifoBatch.id;
      }
      await executeConversion(conversionData, authToken);
      setLoadingConversion(false);
      onConfirm(selectedSuggestion, fifoBatch);
      handleCancel();
    } catch (err) {
      setLoadingConversion(false);
      setConversionErrorMsg(err.message || 'Error ejecutando conversión');
    }
  };

  const handleCancel = () => {
    onCancel();
    setSelectedSuggestion(null);
    setRequiresBatchControl(false);
    setBatches([]);
    setSelectedBatch(null);
    setBatchError(null);
    setConversionErrorMsg(null);
    setLoading(false);
    setLoadingConversion(false);
    setFifoBatch(null);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 700 }}>
        {/* Overlay de carga global */}
        {(loadingConversion || loading) && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(255,255,255,0.7)',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 12,
          }}>
            <div className="spinner" style={{ marginBottom: 12 }}>
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="18" stroke="#007bff" strokeWidth="4" strokeDasharray="90 60" strokeLinecap="round">
                  <animateTransform attributeName="transform" type="rotate" repeatCount="indefinite" dur="1s" from="0 20 20" to="360 20 20" />
                </circle>
              </svg>
            </div>
            <div style={{ color: '#007bff', fontWeight: 600, fontSize: 16 }}>
              {loadingConversion ? 'Ejecutando conversión...' : 'Cargando información...'}
            </div>
          </div>
        )}
        <div className="modal-header">
          <h3>💡 Obtener Más Stock</h3>
          <button className="modal-close-button" onClick={handleCancel}>&times;</button>
        </div>
        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <div style={{ marginBottom: 16 }}>
            <p style={{ marginBottom: 8, fontWeight: 600 }}>
              {error.message || 'No hay suficiente stock disponible'}
            </p>
            <div className="stock-summary" style={{
              padding: '8px 12px',
              backgroundColor: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: '4px',
              fontSize: '14px'
            }}>
              <span style={{ color: '#856404' }}>
                📦 Disponible: <strong>{error.available}</strong> | 
                📋 Necesario: <strong>{error.required}</strong> | 
                ❗ Falta: <strong>{error.deficit}</strong>
              </span>
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#2c3e50' }}>
              💡 Opciones para Obtener Más Stock
            </h4>
            <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#6c757d' }}>
              No hay suficiente stock de <strong>{error.product}</strong>. Puedes desarmar otros productos para obtener más:
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            {error.suggestions?.map((suggestion, index) => (
              <div
                key={index}
                onClick={async () => {
                  console.log('[ConversionModal] Sugerencia clickeada:', suggestion);
                  setLoading(true);
                  await handleSuggestionSelect(suggestion);
                  setLoading(false);
                }}
                style={{
                  padding: '12px',
                  border: selectedSuggestion === suggestion ? '2px solid #007bff' : '1px solid #dee2e6',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: selectedSuggestion === suggestion ? '#f8f9fa' : 'white',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: '#2c3e50' }}>
                      📦 Abrir {suggestion.units_needed}x {suggestion.conversion?.from_product_name || 'Producto origen'}
                      {suggestion.conversion?.from_product_name && suggestion.conversion?.conversion_rate && (
                        <span style={{ fontSize: '12px', color: '#ffc107', marginLeft: '4px', padding: '2px 6px', backgroundColor: '#fff3cd', borderRadius: '3px', border: '1px solid #ffeaa7' }}>
                          🏷️ Factor: 1 → {suggestion.conversion.conversion_rate}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '13px', color: '#6c757d', marginTop: '2px' }}>
                      {suggestion.conversion?.from_product_sku && (
                        <>SKU: {suggestion.conversion.from_product_sku}</>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#28a745' }}>
                      → +{suggestion.would_convert_to} {error.product}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6c757d' }}>
                      {suggestion.conversion?.conversion_rate && (
                        <>(Obtienes {suggestion.conversion.conversion_rate} por cada unidad)</>
                      )}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6c757d', paddingTop: '8px', borderTop: '1px solid #f1f3f4' }}>
                  <span>📊 Disponible: {suggestion.available_stock}</span>
                  <span>🎯 Puede dar: {suggestion.can_provide} unidades</span>
                </div>
              </div>
            ))}
          </div>
          {loading && <div style={{ textAlign: 'center', color: '#007bff', margin: '16px 0' }}>Cargando información...</div>}
          {selectedSuggestion && requiresBatchControl && !loading && fifoBatch && (
            <div style={{ padding: '12px', backgroundColor: '#e8f4f8', border: '1px solid #bee5eb', borderRadius: '8px', marginBottom: '16px' }}>
              <h5 style={{ margin: '0 0 12px 0', color: '#0c5460' }}>🏷️ Lote FIFO seleccionado automáticamente</h5>
              <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>{fifoBatch.batch_number}</div>
              <div style={{ fontSize: '12px', color: '#6c757d', lineHeight: 1.4 }}>
                <div>📅 Vence: {new Date(fifoBatch.expiry_date).toLocaleDateString()}</div>
                <div>🏭 Fabricación: {new Date(fifoBatch.manufacturing_date).toLocaleDateString()}</div>
                {fifoBatch.supplier_reference && (<div>🏢 Proveedor: {fifoBatch.supplier_reference}</div>)}
              </div>
            </div>
          )}
          {selectedSuggestion && !requiresBatchControl && !loading && (
            <div style={{ padding: '12px', backgroundColor: '#d4edda', border: '1px solid #c3e6cb', borderRadius: '8px', marginBottom: '16px' }}>
              <div style={{ color: '#155724', fontSize: '14px', fontWeight: 500 }}>
                ℹ️ Este producto no requiere control de lotes
              </div>
              <div style={{ color: '#6c757d', fontSize: '12px', marginTop: '4px' }}>
                La conversión se ejecutará directamente sin necesidad de seleccionar lotes específicos.
              </div>
            </div>
          )}
          {batchError && (
            <div style={{ color: '#721c24', backgroundColor: '#f8d7da', border: '1px solid #f1aeb5', borderRadius: '4px', padding: '12px', marginBottom: '16px', textAlign: 'center' }}>
              {batchError}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="cancel-button" onClick={handleCancel}>
            No Desarmar - Cancelar Venta
          </button>
          <button
            className="toggle-stats-button"
            onClick={handleConfirm}
            disabled={
              !selectedSuggestion ||
              loadingConversion ||
              (requiresBatchControl && !fifoBatch)
            }
            style={{
              opacity:
                selectedSuggestion && (!requiresBatchControl || fifoBatch)
                  ? 1
                  : 0.6,
              cursor:
                selectedSuggestion && (!requiresBatchControl || fifoBatch)
                  ? 'pointer'
                  : 'not-allowed',
            }}
          >
            {loadingConversion
              ? 'Ejecutando...'
              : requiresBatchControl && !fifoBatch
              ? 'Selecciona un lote'
              : `Desarmar para Obtener ${error.product}`}
          </button>
          {conversionErrorMsg && (
            <div style={{ color: 'red', marginTop: 8 }}>{conversionErrorMsg}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversionSuggestionsModal; 