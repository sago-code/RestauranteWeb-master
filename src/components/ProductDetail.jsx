import React from 'react';

function ProductDetail({ product, isOpen, onClose, onAdd }) {
  if (!isOpen || !product) return null;

  return (
    <div className="product-detail-overlay" role="dialog" aria-modal="true" aria-label="Detalle de producto">
      <div className="product-detail-modal">
        <button className="product-detail-close" onClick={onClose}>Cerrar</button>

        <div className="product-vision">
          <div className="vision-image-wrap">
            <img
              src={product.imagen}
              alt={product.nombre}
              className="vision-image"
            />
          </div>
        </div>

        <div className="product-info">
          <h3 className="product-title">{product.nombre}</h3>
          <div className="product-price">${product.precio.toLocaleString()}</div>
          <p className="product-desc">{product.descripcion}</p>
          <div className="product-actions">
            <button className="btn-modern-primary" onClick={() => onAdd?.(product)}>
              Agregar al carrito
            </button>
            <button className="btn-modern-secondary" onClick={onClose}>
              Seguir viendo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
