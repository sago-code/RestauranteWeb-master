import React, { useState } from 'react';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import OrderModal from './OrderModal';

const CartModal = ({ isOpen, onClose, cartItems, onUpdateQuantity, onRemoveItem }) => {
  if (!isOpen) return null;

  const total = cartItems.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
  const { clearCart } = useCart();
  const [orderOpen, setOrderOpen] = useState(false);

  const handlePay = async (provider) => {
    try {
      const stored = JSON.parse(localStorage.getItem('usuario') || sessionStorage.getItem('usuario') || 'null');
      const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
      const userId = stored?.uid || null;
      if (!userId) {
        alert('Debes iniciar sesión para pagar');
        return;
      }

      const base = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
      const url = `${base}/carts/active/${userId}/pay`;
      console.log(`[Checkout:${provider}] POST`, url);

      await axios.post(url, {}, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
      await clearCart();
      alert('¡Pedido creado correctamente!');
      setOrderOpen(false);
      onClose && onClose();
    } catch (err) {
      console.error('Error al convertir carrito a pedido:', err.response?.data || err.message);
      alert('No se pudo crear el pedido');
    }
  };

  return (
    <div className="cart-modal-overlay" onClick={onClose}>
      <div className="cart-modal" onClick={e => e.stopPropagation()}>
        <div className="cart-modal-header">
          <h3>Carrito de Compras</h3>
          <button className="close-button" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="cart-items">
          {cartItems.length === 0 ? (
            <p className="text-center">El carrito está vacío</p>
          ) : (
            cartItems.map((item) => (
              <div key={item.id} className="cart-item">
                <div className="item-info">
                  <h5>{item.nombre}</h5>
                  <p>${item.precio.toLocaleString()}</p>
                </div>
                <div className="item-quantity">
                  <button onClick={() => onUpdateQuantity(item.id, item.cantidad - 1)}>-</button>
                  <span>{item.cantidad}</span>
                  <button onClick={() => onUpdateQuantity(item.id, item.cantidad + 1)}>+</button>
                </div>
                <button 
                  className="remove-item"
                  onClick={() => onRemoveItem(item.id)}
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            ))
          )}
        </div>

        <div className="cart-footer">
          <div className="cart-total">
            <span>Total:</span>
            <span>${total.toLocaleString()}</span>
          </div>
          <button
            className="btn btn-outline-danger"
            onClick={async () => {
              await clearCart();
              alert('Carrito vaciado');
            }}
            disabled={cartItems.length === 0}
            style={{ marginRight: '8px' }}
          >
            Vaciar carrito
          </button>
          {!(JSON.parse(localStorage.getItem('usuario') || sessionStorage.getItem('usuario') || 'null')?.uid) ? (
            <a href="/login" className="checkout-button">Iniciar sesión para pedir</a>
          ) : (
            <button className="checkout-button" onClick={() => setOrderOpen(true)} disabled={cartItems.length === 0}>
              Ver orden y pagar
            </button>
          )}
        </div>

        <OrderModal
          isOpen={orderOpen}
          onClose={() => setOrderOpen(false)}
          items={cartItems}
          onPayPaypal={() => handlePay('paypal')}
          onPayPayU={() => handlePay('payu')}
        />
      </div>
    </div>
  );
}

export default CartModal;