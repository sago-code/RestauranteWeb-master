// OrderModal component
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function OrderModal({
  isOpen,
  onClose,
  items = [],
  onPayPaypal,
  onPayPayU
}) {
  // Permite cerrar con Escape y bloquea el scroll/borroso mientras está abierto
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose?.();
      }
    };
    document.body.style.overflow = 'hidden';
    const root = document.getElementById('root');
    const previousFilter = root ? root.style.filter : '';
    if (root) root.style.filter = 'blur(3px)';

    window.addEventListener('keydown', onKeyDown, { capture: true });

    return () => {
      window.removeEventListener('keydown', onKeyDown, { capture: true });
      document.body.style.overflow = '';
      if (root) root.style.filter = previousFilter || '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const SHIPPING_COST = 2000;
  const formatCOP = (v) => `$${v.toLocaleString()}`;
  const subtotal = items.reduce((s, i) => s + (i.precio * i.cantidad), 0);
  const total = subtotal + SHIPPING_COST;

  // Cierre al hacer click fuera y texto en negro
  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.35)',
        backdropFilter: 'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)',
        zIndex: 9999
      }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: '#fff',
          borderRadius: 8,
          width: 'min(520px, 92vw)',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 8px 24px rgba(0,0,0,.25)',
          color: '#000' // fuerza tipografía en negro
        }}
      >
        {/* Header con botón X */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #eee', color: '#000' }}>
          <h3 style={{ margin: 0, fontSize: 18 }}>Resumen de Orden</h3>
          <button
            aria-label="Cerrar"
            onClick={onClose}
            style={{ border: 'none', background: 'transparent', fontSize: 20, cursor: 'pointer', lineHeight: 1, color: '#000' }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: 16, color: '#000' }}>
          {items.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#000' }}>Tu carrito está vacío</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {items.map((item) => (
                <li
                  key={item.id}
                  style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}
                >
                  <div>
                    <strong>{item.nombre}</strong>
                    <div style={{ color: '#000' }}>{formatCOP(item.precio)} × {item.cantidad}</div>
                  </div>
                  <div>{formatCOP(item.precio * item.cantidad)}</div>
                </li>
              ))}
            </ul>
          )}

          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span>Subtotal</span>
              <span>{formatCOP(subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span>Envío</span>
              <span>{formatCOP(SHIPPING_COST)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontWeight: 600 }}>
              <span>Total</span>
              <span>{formatCOP(total)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
            <button className="btn btn-outline-secondary" onClick={onClose} style={{ color: '#000', borderColor: '#000' }}>
              Seguir comprando
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-primary"
                onClick={() => onPayPaypal?.({ subtotal, shipping: SHIPPING_COST, total })}
                disabled={items.length === 0}
                style={{ color: '#000' }}
              >
                Pagar con PayPal
              </button>
              <button
                className="btn btn-warning"
                onClick={() => onPayPayU?.({ subtotal, shipping: SHIPPING_COST, total })}
                disabled={items.length === 0}
                style={{ color: '#000' }}
              >
                Pagar con PayU
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}