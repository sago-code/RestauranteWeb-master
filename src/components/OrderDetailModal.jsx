import React from 'react';

function OrderDetailModal({ isOpen, onClose, order, items = [], loading, error, onReorder }) {
  if (!isOpen) return null;

  const createdAt = order?.createdAt?.toDate
    ? order.createdAt.toDate()
    : (order?.createdAt?._seconds ? new Date(order.createdAt._seconds * 1000) : null);
  const dateStr = createdAt ? createdAt.toLocaleString() : '-';
  const total = items.reduce((sum, i) => sum + (Number(i.precio || i.unitPrice || 0) * Number(i.cantidad || i.quantity || 0)), 0);

  return (
    <div className="order-modal-overlay" onClick={onClose}>
      <div
        className="order-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-detail-title"
      >
        <div className="order-modal-header">
          <h3 id="order-detail-title">Detalle del Pedido</h3>
          <button className="close-button" onClick={onClose} aria-label="Cerrar">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="order-modal-content">
          <div className="mb-2">
            <small className="text-muted">Fecha:</small> <span>{dateStr}</span><br />
            <small className="text-muted">Estado:</small>{' '}
            {order?.status === 'paid' && <span className="badge bg-success">Pagado</span>}
            {order?.status === 'pending' && <span className="badge bg-warning text-dark">Pendiente</span>}
            {order?.status === 'declined' && <span className="badge bg-danger">Declinado</span>}
            <br />
            <small className="text-muted">Método:</small> <span>{order?.typePageMetod?.toUpperCase() || '-'}</span><br />
            <small className="text-muted">Referencia:</small> <span>{order?.referenceCode || order?.paypalOrderId || '-'}</span>
          </div>

          {loading && <div className="alert alert-info">Cargando detalles...</div>}
          {!loading && error && <div className="alert alert-danger">{error}</div>}

          {!loading && !error && (
            <>
              {items.length === 0 ? (
                <div className="alert alert-secondary">No hay items asociados.</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-dark table-hover align-middle">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Precio</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((i) => {
                        const qty = i.cantidad ?? i.quantity ?? 0;
                        const price = i.precio ?? i.unitPrice ?? 0;
                        return (
                          <tr key={i.id || i.productId}>
                            <td>{i.nombre || i.name}</td>
                            <td>{qty}</td>
                            <td>COP {Number(price).toLocaleString()}</td>
                            <td>COP {(Number(price) * Number(qty)).toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="cart-footer" style={{ justifyContent: 'space-between' }}>
                <div className="cart-total">
                  <span>Total:</span>
                  <span>COP {Number(total).toLocaleString()}</span>
                </div>
                <div>
                  <button className="btn btn-primary w-100 w-md-auto" onClick={onReorder} disabled={items.length === 0}>
                    <i className="fas fa-redo me-1"></i> Volver a pedir
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default OrderDetailModal;