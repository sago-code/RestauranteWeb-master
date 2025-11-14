import React, { useState } from 'react';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';
import * as cartApi from '../services/cartApi';
import OrderModal from '../components/OrderModal.jsx';

function CartModal() {
  const { cartItems, setCartItems, setActiveCartId, getTotalPrice, clearCart } = useCart();
  const [orderOpen, setOrderOpen] = useState(false);
  const [draftQty, setDraftQty] = useState({});

  const handleDecrease = async (item) => {
    setDraftQty(prev => {
      const { [item.id]: _, ...rest } = prev;
      return rest;
    });
    const { items, cartId } = await cartApi.updateQuantity(item.id, item.cantidad - 1);
    setCartItems(items);
    setActiveCartId(cartId);
  };

  const handleIncrease = async (item) => {
    setDraftQty(prev => {
      const { [item.id]: _, ...rest } = prev;
      return rest;
    });
    const { items, cartId } = await cartApi.updateQuantity(item.id, item.cantidad + 1);
    setCartItems(items);
    setActiveCartId(cartId);
  };

  const handleSetQuantity = async (item, rawValue) => {
    const v = String(rawValue).trim();
    if (v === '') {
      setDraftQty(prev => {
        const { [item.id]: _, ...rest } = prev;
        return rest;
      });
      return;
    }
    const qty = Math.max(1, parseInt(v, 10));
    const { items, cartId } = await cartApi.updateQuantity(item.id, qty);
    setCartItems(items);
    setActiveCartId(cartId);
    setDraftQty(prev => {
      const { [item.id]: _, ...rest } = prev;
      return rest;
    });
  };

  const handleRemove = async (itemId) => {
    const { items, cartId } = await cartApi.removeItem(itemId);
    setCartItems(items);
    setActiveCartId(cartId);
  };

  const total = getTotalPrice();

  const handleClear = async () => {
    await clearCart();
    alert('Carrito vaciado');
  };

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
    } catch (err) {
      console.error('Error al convertir carrito a pedido:', err.response?.data || err.message);
      alert('No se pudo crear el pedido');
    }
  };

  return (
    <>
      // En el contenedor del modal de Bootstrap, asegúrate de marcarlo estático:
      <div
        className="modal fade"
        tabIndex="-1"
        data-bs-backdrop="static"
        data-bs-keyboard="false"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="cartModalLabel">Carrito de Compras</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
            </div>
            <div className="modal-body">
              {cartItems.length === 0 ? (
                <p>El carrito está vacío</p>
              ) : (
                <ul className="list-group mb-3">
                  {cartItems.map(item => {
                    const inputValue = draftQty[item.id] !== undefined ? draftQty[item.id] : String(item.cantidad);
                    return (
                      <li key={item.id} className="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                          <strong>{item.nombre}</strong>
                          <div className="text-muted">${item.precio.toLocaleString()}</div>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <button className="btn btn-sm btn-outline-secondary" onClick={() => handleDecrease(item)}>-</button>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={inputValue}
                            onChange={(e) => {
                              const digits = e.target.value.replace(/[^\d]/g, '');
                              setDraftQty(prev => ({ ...prev, [item.id]: digits }));
                            }}
                            onBlur={() => handleSetQuantity(item, draftQty[item.id] ?? '')}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSetQuantity(item, draftQty[item.id] ?? '');
                              }
                            }}
                            style={{ width: '64px', textAlign: 'center' }}
                            aria-label={`Cantidad de ${item.nombre}`}
                          />
                          <button className="btn btn-sm btn-outline-secondary" onClick={() => handleIncrease(item)}>+</button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleRemove(item.id)}>
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
              <p>Total: <span id="cart-total">${total.toLocaleString()}</span></p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
              <button type="button" className="btn btn-outline-danger" onClick={handleClear} disabled={cartItems.length === 0}>
                Vaciar carrito
              </button>
              {!(JSON.parse(localStorage.getItem('usuario') || sessionStorage.getItem('usuario') || 'null')?.uid) ? (
                <Link to="/login" className="btn btn-primary">Iniciar sesión para pedir</Link>
              ) : (
                <button type="button" className="btn btn-primary" onClick={() => setOrderOpen(true)} disabled={cartItems.length === 0}>
                  Ver orden y pagar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <OrderModal
        isOpen={orderOpen}
        onClose={() => setOrderOpen(false)}
        items={cartItems}
        onPayPaypal={() => handlePay('paypal')}
        onPayPayU={() => handlePay('payu')}
      />
    </>
  );
}

export default CartModal;
