// OrderModal component
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function OrderModal({
  isOpen,
  onClose,
  items = [],
  onPayPaypal,
}) {
  const SHIPPING_COST = 2000;
  const formatCOP = (v) => `$${v.toLocaleString()}`;
  const subtotal = items.reduce((s, i) => s + (i.precio * i.cantidad), 0);
  const total = subtotal + SHIPPING_COST;

  // Conversión COP → USD
  const USD_RATE = Number(import.meta.env.VITE_USD_RATE || '0.00025');
  const usdSubtotal = (subtotal * USD_RATE).toFixed(2);
  const usdShipping = (SHIPPING_COST * USD_RATE).toFixed(2);
  const usdTotal = (total * USD_RATE).toFixed(2);

  const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID;
  const LOCALE = 'es_CO';

  const { activeCartId, clearCart } = useCart();
  const { usuario } = useAuth();
  const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/+$/, '');

  const [showPaypal, setShowPaypal] = useState(false);
  const payuWinRef = useRef(null);
  const lastReferenceRef = useRef(null);

  // Manejar respuesta de PayU por postMessage (si existiera)
  useEffect(() => {
    const handler = async (e) => {
      if (e?.data?.type === 'PAYU_DONE') {
        try {
          const payload = e.data.payload || {};
          const ref =
            payload.referenceCode ||
            payload.reference_pol ||
            lastReferenceRef.current;

          // Confirmación cliente→backend para ambientes locales (sin webhook público)
          if (payload && Object.keys(payload).length > 0) {
            try {
              await axios.post(`${API_BASE}/payu/confirm`, payload);
            } catch (err) {
              console.warn('Confirmación PayU client-side falló:', err.response?.data || err.message);
            }
          }

          if (!ref) return;

          // Consultar orden actualizada
          const { data: orderRes } = await axios.get(
            `${API_BASE}/orders/by-reference/${encodeURIComponent(ref)}`
          );
          const order = orderRes?.order || orderRes;

          if (order?.status === 'paid') {
            try {
              const stored = JSON.parse(localStorage.getItem('usuario') || sessionStorage.getItem('usuario') || 'null');
              const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
              const userId = stored?.uid || usuario?.uid || null;
              if (userId) {
                await axios.post(`${API_BASE}/carts/active/${userId}/pay`, {}, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
              } else if (activeCartId) {
                await axios.post(`${API_BASE}/carts/${activeCartId}/pay`);
              }
              await clearCart();
            } catch (err) {
              console.error('Error al vaciar/convertir carrito tras confirmación:', err.response?.data || err.message);
            }

            alert('¡Pedido pagado!');
          }

          // Cerrar todas las capas de modales
          window.dispatchEvent(new Event('CLOSE_ALL_MODALS'));
          onClose && onClose();
        } catch (err) {
          console.error('No se pudo obtener la orden tras PAYU_DONE:', err.response?.data || err.message);
          // Cerrar todas las capas de modales incluso en error
          window.dispatchEvent(new Event('CLOSE_ALL_MODALS'));
          onClose && onClose();
        }
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [API_BASE, clearCart, usuario, activeCartId, onClose]);

  const handlePayU = useCallback(async () => {
    const referenceCode = `ORD-${Date.now()}`;
    lastReferenceRef.current = referenceCode;

    // 1) Guardar orden inicial en estado pending
    try {
      const cartUid = activeCartId || localStorage.getItem('guestCartId') || null;
      const userId = usuario?.uid || null;

      const payload = {
        cartUid,
        userId,
        typePageMetod: 'payu',
        status: 'pending',
        paypalOrderId: null,
        subtotalCOP: subtotal,
        shippingCost: SHIPPING_COST,
        totalCOP: total,
        totalUSD: Number(usdTotal),
        currency: 'COP',
        payment: null,
        referenceCode,
      };
      await axios.post(`${API_BASE}/orders`, payload);
    } catch (err) {
      console.error('Error guardando orden PayU:', err.response?.data || err.message);
      alert('No se pudo guardar la orden antes de ir a PayU. Intenta nuevamente.');
      return;
    }

    // 2) Preparar pago con PayU y abrir ventana
    try {
      const { data } = await axios.post(`${API_BASE}/payu/prepare`, {
        amount: total,
        description: 'Orden Restaurante',
        referenceCode,
        currency: 'COP',
        buyerEmail: usuario?.email || 'guest@example.com',
        test: true
        // eliminado: campos de contra-entrega (isCashOnDeliveryApply, displayShippingInformation, etc.)
      });

      const { gatewayUrl, fields } = data;

      const winName = 'payuWin';
      const payuWin = window.open('', winName);
      if (!payuWin) {
        alert('Tu navegador bloqueó la ventana de pago. Habilita los pop-ups e inténtalo nuevamente.');
        return;
      }
      payuWinRef.current = payuWin;

      const form = document.createElement('form');
      form.method = 'POST';
      form.action = gatewayUrl;
      form.target = winName;

      Object.entries(fields).forEach(([name, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = value;
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);

      // 3) Consultar la orden al cerrarse la ventana y cerrar modales
      const check = setInterval(async () => {
        if (payuWinRef.current && payuWinRef.current.closed) {
          clearInterval(check);
          payuWinRef.current = null;
          try {
            const ref = lastReferenceRef.current;
            const { data: orderRes } = await axios.get(`${API_BASE}/orders/by-reference/${encodeURIComponent(ref)}`);
            const order = orderRes?.order || orderRes;

            if (order?.status === 'paid') {
              try {
                const stored = JSON.parse(localStorage.getItem('usuario') || sessionStorage.getItem('usuario') || 'null');
                const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
                const userId = stored?.uid || usuario?.uid || null;
                if (userId) {
                  const url = `${API_BASE}/carts/active/${userId}/pay`;
                  await axios.post(url, {}, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
                } else if (activeCartId) {
                  await axios.post(`${API_BASE}/carts/${activeCartId}/pay`);
                }
                await clearCart();
              } catch (err) {
                console.error('Error al vaciar/convertir carrito tras cierre:', err.response?.data || err.message);
              }

              alert('¡Pedido pagado!');
            }
          } catch (err) {
            console.error('No se pudo obtener la orden tras cerrar PayU:', err.response?.data || err.message);
          } finally {
            // Cerrar todas las capas de modales al cerrar PayU
            window.dispatchEvent(new Event('CLOSE_ALL_MODALS'));
            onClose && onClose();
          }
        }
      }, 500);
    } catch (e) {
      console.error('Error preparando PayU:', e.response?.data || e.message);
      alert('No se pudo preparar el pago con PayU.');
    }
  }, [activeCartId, usuario, subtotal, SHIPPING_COST, total, usdTotal, API_BASE, clearCart, onClose]);

  const openPaypalWindow = () => {
    setShowPaypal(true);
  };

  const loadPayPalScript = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (window.paypal && typeof window.paypal.Buttons === 'function') {
        return resolve();
      }
      if (!PAYPAL_CLIENT_ID) {
        return reject(new Error('Falta VITE_PAYPAL_CLIENT_ID en .env'));
      }

      // Si ya existe un script del SDK, no añadimos otro
      const existing = document.querySelector('script[data-paypal-sdk="true"]');
      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => reject(new Error('No se pudo cargar PayPal SDK')));
        return;
      }

      const src =
        `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}` +
        `&currency=USD&intent=capture&components=buttons&locale=${LOCALE}`;

      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.setAttribute('data-paypal-sdk', 'true');
      script.onload = () => {
        if (window.paypal && typeof window.paypal.Buttons === 'function') {
          resolve();
        } else {
          reject(new Error('SDK cargado sin Buttons. Revisa client-id o components=buttons.'));
        }
      };
      script.onerror = () => reject(new Error('No se pudo cargar PayPal SDK'));
      document.body.appendChild(script);
    });
  }, [PAYPAL_CLIENT_ID, LOCALE]);

  // Efecto para cargar PayPal cuando se muestra
  useEffect(() => {
    if (!showPaypal) return;

    let paypalButtons = null;

    loadPayPalScript()
      .then(() => {
        const container = document.getElementById('paypal-btn-container');
        if (!container) return;

        // Limpia el contenedor antes de renderizar
        container.innerHTML = '';

        if (window.paypal && typeof window.paypal.Buttons === 'function') {
          paypalButtons = window.paypal.Buttons({
            createOrder: (data, actions) => {
              return actions.order.create({
                purchase_units: [
                  {
                    amount: {
                      value: usdTotal,
                      currency_code: 'USD',
                      breakdown: {
                        item_total: { value: usdSubtotal, currency_code: 'USD' },
                        shipping: { value: usdShipping, currency_code: 'USD' },
                      },
                    },
                    items: items.map(item => ({
                      name: item.nombre,
                      unit_amount: { value: (item.precio * USD_RATE).toFixed(2), currency_code: 'USD' },
                      quantity: item.cantidad,
                    })),
                  },
                ],
              });
            },
            onApprove: async (data, actions) => {
              try {
                const details = await actions.order.capture();

                // NUEVO: crear orden en backend + convertir carrito
                const cartUid = activeCartId || localStorage.getItem('guestCartId') || null;
                const userId = usuario?.uid || null;
                const paypalOrderId =
                  details?.id ||
                  details?.purchase_units?.[0]?.payments?.captures?.[0]?.id ||
                  data?.orderID || null;

                const payload = {
                  cartUid,
                  userId,
                  typePageMetod: 'paypal',
                  status: 'paid',
                  paypalOrderId,
                  subtotalCOP: subtotal,
                  shippingCost: SHIPPING_COST,
                  totalCOP: total,
                  totalUSD: Number(usdTotal),
                  currency: 'COP',
                  payment: details,
                  referenceCode: null,
                };

                try {
                  await axios.post(`${API_BASE}/orders`, payload);
                } catch (err) {
                  console.error('Error creando orden PayPal:', err.response?.data || err.message);
                }

                try {
                  const stored = JSON.parse(localStorage.getItem('usuario') || sessionStorage.getItem('usuario') || 'null');
                  const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
                  const uid = stored?.uid || usuario?.uid || null;
                  if (uid) {
                    await axios.post(
                      `${API_BASE}/carts/active/${uid}/pay`,
                      {},
                      token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
                    );
                  } else if (cartUid) {
                    await axios.post(`${API_BASE}/carts/${cartUid}/pay`);
                  }
                  await clearCart();
                } catch (err) {
                  console.error('Error al convertir carrito tras PayPal:', err.response?.data || err.message);
                }

                // Compatibilidad: mantener callback si alguien lo usa
                try { onPayPaypal && onPayPaypal(details); } catch {}

                // Cerrar modal después del pago exitoso
                onClose();
              } catch (error) {
                console.error('Error capturando orden PayPal:', error);
                alert('Hubo un error procesando tu pago con PayPal.');
              }
            },
            onError: (err) => {
              console.error('PayPal Button Error:', err);
              alert('Error al inicializar PayPal. Intenta nuevamente.');
            },
          });

          paypalButtons.render(container);
        }
      })
      .catch((error) => {
        console.error('Error loading PayPal:', error);
        alert('No se pudo cargar PayPal. Intenta nuevamente.');
      });

    return () => {
      if (paypalButtons) {
        // Cleanup if needed
      }
    };
  }, [showPaypal, items, usdTotal, usdSubtotal, usdShipping, USD_RATE, loadPayPalScript, onPayPaypal, onClose]);

  // Modal de resultado de PayU
  const PayUResponseModalInline = ({ open, onClose, data }) => {
    if (!open) return null;

    return createPortal(
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
        }}
        onClick={onClose}
      >
        <div
          style={{
            background: '#fff',
            padding: '20px',
            borderRadius: '8px',
            maxWidth: '500px',
            width: '90%',
            color: '#000',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h3>Resultado del Pago PayU</h3>
          <pre>{JSON.stringify(data, null, 2)}</pre>
          <button onClick={onClose} className="btn btn-primary">
            Cerrar
          </button>
        </div>
      </div>,
      document.body
    );
  };

  // Solo renderizar si el modal de orden está abierto
  if (!isOpen) return null;

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
      onClick={(e) => {
        // No cerrar por clic fuera: modal estático
        e.stopPropagation();
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
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
          color: '#000'
        }}
      >
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

          {/* Sección de botones de pago */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
              <button 
                className="btn btn-outline-secondary" 
                onClick={onClose} 
                style={{ color: '#000', borderColor: '#000' }}
              >
                Seguir comprando
              </button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-primary"
                  onClick={openPaypalWindow}
                  style={{ color: '#000' }}
                >
                  Pagar con PayPal
                </button>
                <button
                  className="btn btn-warning"
                  onClick={handlePayU}
                  style={{ color: '#000' }}
                >
                  Pagar con PayU
                </button>
              </div>
          </div>
          
          {/* Apartado de pagos de PayPal dentro del OrderModal */}
          {showPaypal && (
            <div style={{ marginTop: 16 }}>
              <h4 style={{ margin: 0, marginBottom: 8 }}>Pago con PayPal</h4>
              <div id="paypal-btn-container"></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                <span style={{ fontWeight: 600 }}>Total: {formatCOP(total)}</span>
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => setShowPaypal(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}