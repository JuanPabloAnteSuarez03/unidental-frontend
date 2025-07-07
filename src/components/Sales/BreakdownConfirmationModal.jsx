import React from 'react';
import '../../components/CreditsSalesWhatsApp/CreditsSalesWhatsAppStyles.css';

/**
 * Modal que muestra el plan de ruptura de cajas/kits cuando el backend responde 409.
 * props:
 *  - isOpen: boolean
 *  - breakdownPlan: array of plans from backend
 *  - message: text message from backend
 *  - onCancel: callback
 *  - onConfirm: callback
 */
const BreakdownConfirmationModal = ({ isOpen, breakdownPlan = [], message = '', onCancel, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <h3>Confirmar ruptura de cajas/kits</h3>
          <button className="modal-close-button" onClick={onCancel}>&times;</button>
        </div>
        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          <p style={{ marginBottom: 12 }}>{message || 'Para completar la venta es necesario desarmar los siguientes kits/cajas:'}</p>
          <table className="credits-table" style={{ fontSize: 13 }}>
            <thead>
              <tr>
                <th>Kit/Caja</th>
                <th>Unidades por kit</th>
                <th>Componentes obtenidos</th>
              </tr>
            </thead>
            <tbody>
              {breakdownPlan.map((plan, idx) => (
                <tr key={idx}>
                  <td>{plan.kit_name || `Kit #${plan.kit_id}`}</td>
                  <td style={{ textAlign: 'center' }}>{plan.units_per_kit}</td>
                  <td style={{ textAlign: 'center' }}>{plan.components_obtained}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="modal-footer">
          <button className="cancel-button" onClick={onCancel}>Cancelar</button>
          <button className="toggle-stats-button" onClick={onConfirm}>Confirmar ruptura y continuar</button>
        </div>
      </div>
    </div>
  );
};

export default BreakdownConfirmationModal; 