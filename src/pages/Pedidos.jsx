import { useEffect, useState } from 'react';
import axios from 'axios';
import Breadcrumbs from './Breadcrumbs';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { base as apiBase, normalizeFromServer } from '../services/cartApi.js';
import OrderDetailModal from '../components/OrderDetailModal.jsx';

function Pedidos() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { usuario } = useAuth();
  const storedUser = JSON.parse(localStorage.getItem('usuario') || sessionStorage.getItem('usuario') || 'null');
  const userId = usuario?.uid || storedUser?.uid || null;
  const { cartItems, setCartItems } = useCart();

  // NUEVO: estado del modal de detalle
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailItems, setDetailItems] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  const mergeServerItems = (listA = [], listB = []) => {
    const map = new Map();
    const ingest = (arr) => {
      arr.forEach(it => {
        const pid = it.productId ?? it.id;
        const qty = it.quantity ?? it.cantidad ?? 0;
        if (!pid) return;
        const prev = map.get(pid);
        if (prev) {
          const baseQty = prev.quantity ?? prev.cantidad ?? 0;
          map.set(pid, { ...prev, quantity: baseQty + qty, productId: pid });
        } else {
          map.set(pid, {
            productId: pid,
            name: it.name ?? it.nombre,
            image: it.image ?? it.imagen,
            quantity: qty,
            unitPrice: it.unitPrice ?? it.precio,
            currency: it.currency ?? 'COP',
            type: it.type
          });
        }
      });
    };
    ingest(listA);
    ingest(listB);
    return Array.from(map.values());
  };

  const toServerItems = (items = []) => (items || []).map(i => ({
    productId: i.productId ?? i.id,
    name: i.name ?? i.nombre,
    image: i.image ?? i.imagen,
    quantity: i.quantity ?? i.cantidad,
    unitPrice: i.unitPrice ?? i.precio,
    currency: i.currency ?? 'COP',
    type: i.type
  }));

  // NUEVO: abrir modal de detalle y cargar items del carrito asociado
  const openDetail = async (order) => {
    try {
      setSelectedOrder(order);
      setDetailLoading(true);
      setDetailError('');
      setDetailItems([]);

      if (!order?.cartUid) {
        setDetailError('Esta orden no tiene carrito asociado.');
        setIsDetailOpen(true);
        setDetailLoading(false);
        return;
      }

      const b = apiBase();
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const headers = token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;

      const { data } = await axios.get(`${b}/carts/${order.cartUid}`, headers);
      const serverItems = data.cart?.items || data.items || [];
      setDetailItems(normalizeFromServer(serverItems));
      setIsDetailOpen(true);
    } catch (err) {
      console.error('[OrderDetail] error:', err?.response?.status, err?.response?.data || err?.message);
      setDetailError('No se pudieron cargar los detalles del pedido.');
      setIsDetailOpen(true);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setIsDetailOpen(false);
    setSelectedOrder(null);
    setDetailItems([]);
    setDetailError('');
  };

  const handleReorder = async (order) => {
    try {
      if (!order?.cartUid) {
        alert('Esta orden no tiene carrito asociado para volver a pedir.');
        return;
      }
      const b = apiBase();
      // 1) Items del carrito original de la orden
      const { data: cartData } = await axios.get(`${b}/carts/${order.cartUid}`);
      const originalServerItems = cartData.cart?.items || cartData.items || [];

      // 2) Items actuales del carrito (en formato servidor)
      const currentServerItems = toServerItems(cartItems);

      // 3) Fusionar sumando cantidades por productId
      const mergedServerItems = mergeServerItems(currentServerItems, originalServerItems);

      // 4) Persistir en backend según estado de sesión
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const headers = token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;

      if (userId) {
        await axios.put(`${b}/carts/active`, { userId, items: mergedServerItems }, headers);
      } else {
        let guestId = localStorage.getItem('guestCartId');
        if (!guestId || guestId === 'undefined' || guestId === 'null' || guestId === '') {
          const created = await axios.post(`${b}/carts`, { items: mergedServerItems, status: 'active' });
          const newId = created.data?.cartId || created.data?.id || null;
          if (newId) {
            localStorage.setItem('guestCartId', newId);
            guestId = newId;
          }
        } else {
          await axios.put(`${b}/carts/${guestId}`, { items: mergedServerItems });
        }
      }

      // 5) Reflejar en UI
      const normalized = normalizeFromServer(mergedServerItems);
      setCartItems(normalized);
      alert('Productos añadidos al carrito. ¡Listo para volver a pedir!');
    } catch (err) {
      console.error('[Reorder] error:', err?.response?.status, err?.response?.data || err?.message);
      alert('No se pudieron remontar los productos. Intenta de nuevo.');
    }
  };

  useEffect(() => {
    const fetchOrders = async () => {
      if (!userId) {
        setError('Debes iniciar sesión para ver tus pedidos.');
        setLoading(false);
        return;
      }
      try {
        const base = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
        const url = `${base}/orders/user/${userId}`;
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const { data } = await axios.get(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        setOrders(Array.isArray(data?.orders) ? data.orders : []);
      } catch (err) {
        console.error('[Pedidos] error:', err?.response?.status, err?.response?.data || err?.message);
        setError('No se pudieron cargar tus pedidos');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [userId]);

  return (
    <div className="container py-4">
      <Breadcrumbs items={[{ label: 'Inicio', to: '/' }, { label: 'Mis Pedidos' }]} />
      <h2 className="mb-3"><i className="fas fa-shopping-bag me-2"></i> Mis Pedidos</h2>

      {loading && <div className="alert alert-info">Cargando pedidos...</div>}
      {!loading && error && <div className="alert alert-danger">{error}</div>}

      {!loading && !error && orders.length === 0 && (
        <div className="alert alert-secondary">No tienes pedidos aún.</div>
      )}

      {!loading && !error && orders.length > 0 && (
        <>
          {/* Desktop/Tablet: Tabla */}
          <div className="table-responsive d-none d-md-block">
            <table className="table table-dark table-hover align-middle">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th>Método</th>
                  <th>Referencia</th>
                  <th>Total</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const createdAt = o.createdAt?.toDate
                    ? o.createdAt.toDate()
                    : (o.createdAt?._seconds ? new Date(o.createdAt._seconds * 1000) : null);
                  const dateStr = createdAt ? createdAt.toLocaleString() : '-';
                  return (
                    <tr key={o.id} onClick={() => openDetail(o)} style={{ cursor: 'pointer' }}>
                      <td>{dateStr}</td>
                      <td>
                        {o.status === 'paid' && <span className="badge bg-success">Pagado</span>}
                        {o.status === 'pending' && <span className="badge bg-warning text-dark">Pendiente</span>}
                        {o.status === 'declined' && <span className="badge bg-danger">Declinado</span>}
                      </td>
                      <td>{o.typePageMetod?.toUpperCase() || '-'}</td>
                      <td>{o.referenceCode || o.paypalOrderId || '-'}</td>
                      <td>{o.currency || 'COP'} {Number(o.totalCOP || o.totalUSD || 0).toLocaleString()}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={(e) => { e.stopPropagation(); handleReorder(o); }}
                          title="Volver a pedir"
                        >
                          <i className="fas fa-redo me-1"></i> Volver a pedir
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile: Tarjetas */}
          <div className="d-block d-md-none">
            {orders.map((o) => {
              const createdAt = o.createdAt?.toDate
                ? o.createdAt.toDate()
                : (o.createdAt?._seconds ? new Date(o.createdAt._seconds * 1000) : null);
              const dateStr = createdAt ? createdAt.toLocaleString() : '-';
              const totalStr = `${o.currency || 'COP'} ${Number(o.totalCOP || o.totalUSD || 0).toLocaleString()}`;
              return (
                <div
                  key={o.id}
                  className="card bg-dark text-light mb-2"
                  onClick={() => openDetail(o)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div className="fw-semibold">{dateStr}</div>
                      <div>
                        {o.status === 'paid' && <span className="badge bg-success">Pagado</span>}
                        {o.status === 'pending' && <span className="badge bg-warning text-dark">Pendiente</span>}
                        {o.status === 'declined' && <span className="badge bg-danger">Declinado</span>}
                      </div>
                    </div>

                    <div className="small mb-1">
                      <span className="text-muted">Método:</span> {o.typePageMetod?.toUpperCase() || '-'}
                    </div>
                    <div className="small mb-2">
                      <span className="text-muted">Referencia:</span> {o.referenceCode || o.paypalOrderId || '-'}
                    </div>

                    <div className="d-flex justify-content-between align-items-center mt-2">
                      <div className="fw-semibold">Total: {totalStr}</div>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={(e) => { e.stopPropagation(); handleReorder(o); }}
                      >
                        <i className="fas fa-redo me-1"></i> Volver a pedir
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* NUEVO: Modal de detalle */}
      <OrderDetailModal
        isOpen={isDetailOpen}
        onClose={closeDetail}
        order={selectedOrder}
        items={detailItems}
        loading={detailLoading}
        error={detailError}
        onReorder={() => selectedOrder && handleReorder(selectedOrder)}
      />
    </div>
  );
}

export default Pedidos;