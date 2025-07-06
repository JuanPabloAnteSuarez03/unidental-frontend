import React, { useState, useEffect } from 'react';
import { registerPayment, getCreditAccountById } from '../../services/creditsService';
import './CreditsSalesWhatsAppStyles.css';

const CreditPaymentModal = ({
  isOpen,
  account,
  onClose,
  onPaymentSuccess,
  installmentAmount,
  paymentFrequency,
  authToken,
}) => {
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  /**
   * Cuota en estado local para asegurar re-render cuando llega desde backend.
   */
  const calculateInitialInstallment = () => {
    if (installmentAmount && installmentAmount > 0) return installmentAmount;
    return parseFloat(account?.installment_amount || 0);
  };

  const [localInstallment, setLocalInstallment] = useState(calculateInitialInstallment());

  // Reset cuota cuando cambie la cuenta seleccionada
  useEffect(() => {
    setLocalInstallment(calculateInitialInstallment());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account]);

  // Si la cuota no está disponible, cargar detalles de la cuenta
  useEffect(() => {
    const fetchDetailsIfNeeded = async () => {
      if (!account || installmentAmount > 0 || account.installment_amount) return;

      try {
        const details = await getCreditAccountById(account.id, authToken);
        if (details && details.installment_amount) {
          setLocalInstallment(parseFloat(details.installment_amount));
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error fetching credit account details:', err);
      }
    };

    fetchDetailsIfNeeded();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, installmentAmount, authToken]);

  if (!isOpen || !account) return null;

  const parsedAmount = parseFloat(amount);

  // Mostrar logs de depuración en desarrollo
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.log('🪵 [CreditPaymentModal] account:', account);
    // eslint-disable-next-line no-console
    console.log('🪵 [CreditPaymentModal] installmentAmount prop:', installmentAmount);
    // eslint-disable-next-line no-console
    console.log('🪵 [CreditPaymentModal] localInstallment:', localInstallment);
  }

  let infoMsg = '';
  if (parsedAmount > 0 && localInstallment > 0) {
    if (parsedAmount < localInstallment) {
      infoMsg = 'El abono es menor a la cuota, la fecha de corte NO se actualizará.';
    } else {
      infoMsg = `El abono cubre una cuota (${paymentFrequency}), la fecha de corte SÍ se actualizará.`;
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Evitar envío si no hay cuota configurada.
    if (!localInstallment || localInstallment === 0) {
      setError('No se ha configurado una cuota para este crédito.');
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');
    try {
      await registerPayment({
        credit_account: account.id,
        amount_paid: parsedAmount,
        notes,
      }, authToken);
      setMessage('¡Pago registrado correctamente!');
      setAmount('');
      setNotes('');
      onPaymentSuccess?.();
      setTimeout(() => {
        setMessage('');
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.message || 'Error al registrar el pago.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Registrar Abono / Pago</h3>
          <button className="modal-close-button" onClick={onClose}>&times;</button>
        </div>
        <form className="modal-body" onSubmit={handleSubmit}>
          <div className="customer-info-section">
            <h4>Cliente: {account.customer_name}</h4>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Monto pendiente:</span>
                <span className="info-value amount">{account.remaining_amount}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Cuota actual:</span>
                <span className="info-value">{localInstallment || '—'} ({paymentFrequency})</span>
              </div>
            </div>
          </div>
          {/* Mostrar advertencia si no hay cuota configurada */}
          {!localInstallment && (
            <div style={{ color: 'red', marginBottom: 12 }}>
              No se ha configurado una cuota para este crédito. Configura una cuota antes de registrar abonos.
            </div>
          )}
          <div style={{ marginBottom: 16 }}>
            <label>Monto a abonar:</label>
            <input
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
              className="filter-input"
              style={{ width: '100%' }}
              disabled={!localInstallment}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <textarea
              placeholder="Notas (opcional)"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="filter-input"
              style={{ width: '100%' }}
              disabled={!localInstallment}
            />
          </div>
          {localInstallment > 0 && (
            <div style={{ color: parsedAmount < localInstallment ? 'orange' : 'green', marginBottom: 12 }}>
              {infoMsg}
            </div>
          )}
          {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
          {message && <div style={{ color: 'green', marginBottom: 8 }}>{message}</div>}
          <div className="modal-footer">
            <button type="button" className="cancel-button" onClick={onClose} disabled={loading}>Cancelar</button>
            <button type="submit" className="toggle-stats-button" disabled={loading || !parsedAmount || !localInstallment}>Registrar abono</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreditPaymentModal; 