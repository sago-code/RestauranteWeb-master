
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import OrderModal from './OrderModal';

const CartModal = ({ isOpen, onClose, cartItems, onUpdateQuantity, onRemoveItem }) => {
  if (!isOpen) return null;

  const total = cartItems.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
  const { clearCart, activeCartId } = useCart();
  const [orderOpen, setOrderOpen] = useState(false);
  const [draftQty, setDraftQty] = useState({});

  // Cerrar todas las capas de modales cuando llegue el evento global
  useEffect(() => {
    const handler = () => {
      setOrderOpen(false);
      onClose && onClose();
    };
    window.addEventListener('CLOSE_ALL_MODALS', handler);
    return () => window.removeEventListener('CLOSE_ALL_MODALS', handler);
  }, [onClose]);

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
      const urlActive = `${base}/carts/active/${userId}/pay`;
      console.log(`[Checkout:${provider}] POST`, urlActive);

      try {
        await axios.post(urlActive, {}, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
      } catch (err) {
        const msg = err.response?.data?.error || err.message;
        // Fallback: si no hay carrito activo, intenta por cartId explícito
        if (err.response?.status === 400 && /No hay carrito activo/i.test(msg)) {
          const fallbackId = activeCartId || localStorage.getItem('guestCartId');
          if (!fallbackId) {
            throw err;
          }
          const urlById = `${base}/carts/${fallbackId}/pay`;
          console.log(`[Checkout:${provider}] Fallback POST`, urlById);
          await axios.post(urlById, {});
        } else {
          throw err;
        }
      }

      await clearCart();
      alert('¡Pedido creado correctamente!');
      setOrderOpen(false);
      onClose && onClose();
    } catch (err) {
      console.error('Error al convertir carrito a pedido:', err.response?.data || err.message);
      alert('No se pudo crear el pedido');
    }
  };

  const commitQuantity = (id, rawValue) => {
    const v = String(rawValue).trim();
    if (v === '') {
      setDraftQty(prev => {
        const { [id]: _, ...rest } = prev;
        return rest;
      });
      return;
    }
    const qty = Math.max(1, parseInt(v, 10));
    onUpdateQuantity(id, qty);
    setDraftQty(prev => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
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
            cartItems.map((item) => {
              const inputValue = draftQty[item.id] !== undefined ? draftQty[item.id] : String(item.cantidad);
              return (
                <div key={item.id} className="cart-item">
                  <div className="item-info">
                    <h5>{item.nombre}</h5>
                    <p>${item.precio.toLocaleString()}</p>
                  </div>
                  <div className="item-quantity">
                    <button
                      onClick={() => {
                        setDraftQty(prev => {
                          const { [item.id]: _, ...rest } = prev;
                          return rest;
                        });
                        onUpdateQuantity(item.id, item.cantidad - 1);
                      }}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={inputValue}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/[^\d]/g, '');
                        setDraftQty(prev => ({ ...prev, [item.id]: digits }));
                      }}
                      onBlur={() => commitQuantity(item.id, draftQty[item.id] ?? '')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          commitQuantity(item.id, draftQty[item.id] ?? '');
                        }
                      }}
                      style={{ width: '64px', textAlign: 'center' }}
                      aria-label={`Cantidad de ${item.nombre}`}
                    />
                    <button
                      onClick={() => {
                        setDraftQty(prev => {
                          const { [item.id]: _, ...rest } = prev;
                          return rest;
                        });
                        onUpdateQuantity(item.id, item.cantidad + 1);
                      }}
                    >
                      +
                    </button>
                  </div>
                  <button 
                    className="remove-item"
                    onClick={() => onRemoveItem(item.id)}
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              );
            })
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