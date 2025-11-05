import axios from 'axios';

const base = () => (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/+$/, '');
const auth = () => {
  const stored = JSON.parse(localStorage.getItem('usuario') || sessionStorage.getItem('usuario') || 'null');
  const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
  return { userId: stored?.uid || null, token };
};
const sanitizeGuestId = () => {
  const id = localStorage.getItem('guestCartId');
  if (!id || id === 'undefined' || id === 'null' || id === '') {
    localStorage.removeItem('guestCartId');
    return null;
  }
  return id;
};

const normalizeFromServer = (items) => (items || []).map(i => ({
  id: i.productId,
  nombre: i.name,
  imagen: i.image || undefined,
  cantidad: i.quantity,
  precio: i.unitPrice
}));

const toServerItems = (items) => (items || []).map(i => ({
  productId: i.productId ?? i.id,
  name: i.name ?? i.nombre,
  image: i.image ?? i.imagen,
  quantity: i.quantity ?? i.cantidad,
  unitPrice: i.unitPrice ?? i.precio,
  currency: i.currency ?? 'COP',
  type: i.type
}));

async function fetchCurrentCart() {
  const { userId, token } = auth();
  const b = base();
  if (userId) {
    const { data } = await axios.get(`${b}/carts/active/${userId}`, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
    return { cartId: data.cart?.id || null, items: data.cart?.items || [] };
  }
  const guestId = sanitizeGuestId();
  if (guestId) {
    try {
      const { data } = await axios.get(`${b}/carts/${guestId}`);
      return { cartId: guestId, items: data.cart?.items || data.items || [] };
    } catch (err) {
      if (err.response?.status === 404) {
        localStorage.removeItem('guestCartId'); // el carrito ya no existe, regenerar cuando se necesite
        return { cartId: null, items: [] };
      }
      throw err;
    }
  }
  return { cartId: null, items: [] };
}

function addOne(existingServerItems, product, type) {
  const items = [...existingServerItems];
  const idx = items.findIndex(i => (i.productId ?? i.id) === product.id);
  if (idx >= 0) {
    items[idx] = { ...items[idx], quantity: (items[idx].quantity ?? items[idx].cantidad) + 1 };
  } else {
    items.push({
      productId: product.id,
      name: product.nombre,
      image: product.imagen,
      quantity: 1,
      unitPrice: product.precio,
      currency: 'COP',
      type
    });
  }
  return items;
}

export async function addItem(product, type) {
  const { userId, token } = auth();
  const b = base();
  const current = await fetchCurrentCart();
  const nextServerItems = addOne(current.items, product, type);

  if (userId) {
    await axios.put(`${b}/carts/active`, { userId, items: toServerItems(nextServerItems) }, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
    const { data } = await axios.get(`${b}/carts/active/${userId}`, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
    return { cartId: data.cart?.id || null, items: normalizeFromServer(data.cart?.items) };
  }

  let guestId = sanitizeGuestId();
  if (!guestId) {
    const { data } = await axios.post(`${b}/carts`, { items: toServerItems(nextServerItems), status: 'active' });
    const newId = data?.cartId || data?.id || null;
    if (newId) {
      localStorage.setItem('guestCartId', newId);
      guestId = newId;
    } else {
      return { cartId: null, items: [] };
    }
  } else {
    try {
      await axios.put(`${b}/carts/${guestId}`, { items: toServerItems(nextServerItems) });
    } catch (err) {
      if (err.response?.status === 404) {
        // El carrito fue borrado en backend: crear uno nuevo
        localStorage.removeItem('guestCartId');
        const { data } = await axios.post(`${b}/carts`, { items: toServerItems(nextServerItems), status: 'active' });
        const newId = data?.cartId || data?.id || null;
        if (newId) {
          localStorage.setItem('guestCartId', newId);
          guestId = newId;
        } else {
          return { cartId: null, items: [] };
        }
      } else {
        throw err;
      }
    }
  }
  // Releer y confirmar ID válido antes del GET
  const safeId = sanitizeGuestId();
  if (!safeId) return { cartId: null, items: [] };
  const { data } = await axios.get(`${b}/carts/${safeId}`);
  return { cartId: safeId, items: normalizeFromServer(data.cart?.items || data.items) };
}

export async function updateQuantity(itemId, newQty) {
  const { userId, token } = auth();
  const b = base();
  const current = await fetchCurrentCart();
  const nextServerItems = (current.items || []).reduce((acc, it) => {
    const pid = it.productId ?? it.id;
    const qty = it.quantity ?? it.cantidad;
    if (pid === itemId) {
      if (newQty > 0) acc.push({ ...it, quantity: newQty });
    } else {
      acc.push(it);
    }
    return acc;
  }, []);

  if (userId) {
    if (nextServerItems.length === 0) {
      await axios.delete(`${b}/carts/active/${userId}`, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
      return { cartId: null, items: [] };
    }
    await axios.put(`${b}/carts/active`, { userId, items: toServerItems(nextServerItems) }, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
    const { data } = await axios.get(`${b}/carts/active/${userId}`, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
    return { cartId: data.cart?.id || null, items: normalizeFromServer(data.cart?.items) };
  }

  let guestId = sanitizeGuestId();
  if (!guestId) {
    if (nextServerItems.length === 0) return { cartId: null, items: [] };
    const { data } = await axios.post(`${b}/carts`, { items: toServerItems(nextServerItems), status: 'active' });
    const newId = data?.cartId || data?.id || null;
    if (newId) localStorage.setItem('guestCartId', newId);
    const safeId = sanitizeGuestId();
    if (!safeId) return { cartId: null, items: [] };
    const got = await axios.get(`${b}/carts/${safeId}`);
    return { cartId: safeId, items: normalizeFromServer(got.data.cart?.items || got.data.items) };
  } else {
    if (nextServerItems.length === 0) {
      await axios.delete(`${b}/carts/${guestId}`);
      localStorage.removeItem('guestCartId');
      return { cartId: null, items: [] };
    }
    try {
      await axios.put(`${b}/carts/${guestId}`, { items: toServerItems(nextServerItems) });
    } catch (err) {
      if (err.response?.status === 404) {
        // El carrito desapareció: recrear
        localStorage.removeItem('guestCartId');
        const { data } = await axios.post(`${b}/carts`, { items: toServerItems(nextServerItems), status: 'active' });
        const newId = data?.cartId || data?.id || null;
        if (newId) localStorage.setItem('guestCartId', newId);
      } else {
        throw err;
      }
    }
    const safeId = sanitizeGuestId();
    if (!safeId) return { cartId: null, items: [] };
    const { data } = await axios.get(`${b}/carts/${safeId}`);
    return { cartId: safeId, items: normalizeFromServer(data.cart?.items || data.items) };
  }
}

export async function removeItem(itemId) {
  return updateQuantity(itemId, 0);
}

export async function clearCart() {
  const { userId, token } = auth();
  const b = base();
  if (userId) {
    await axios.delete(`${b}/carts/active/${userId}`, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
    return { cartId: null, items: [] };
  }
  const guestId = sanitizeGuestId();
  if (guestId) {
    await axios.delete(`${b}/carts/${guestId}`);
    localStorage.removeItem('guestCartId');
  }
  return { cartId: null, items: [] };
}

export async function hydrate() {
  const current = await fetchCurrentCart();
  return { cartId: current.cartId, items: normalizeFromServer(current.items) };
}

// Exportar helpers para uso directo con axios en páginas
export { base, auth, sanitizeGuestId, normalizeFromServer };