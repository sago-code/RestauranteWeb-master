import axios from 'axios';

// Helpers existentes
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
    try {
      const { data } = await axios.get(
        `${b}/carts/active/${userId}`,
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );
      return { cartId: data.cart?.id || null, items: data.cart?.items || [] };
    } catch (err) {
      if (err.response?.status === 404) {
        // No hay carrito activo aún: continuar con flujo de creación/upsert
        return { cartId: null, items: [] };
      }
      throw err;
    }
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

// Fusiona listas de items sumando cantidades por productId
function mergeItems(listA = [], listB = []) {
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
}

export async function addItem(product, type) {
  const { userId, token } = auth();
  const b = base();
  const current = await fetchCurrentCart();
  const headers = token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;

  // Si hay sesión y carrito invitado, fusionar ambos antes de agregar
  const guestId = sanitizeGuestId();
  let nextServerItems;

  if (userId && guestId) {
    let guestItems = [];
    try {
      const { data } = await axios.get(`${b}/carts/${guestId}`);
      guestItems = data.cart?.items || data.items || [];
    } catch (err) {
      if (err.response?.status !== 404) throw err;
    }

    const combined = mergeItems(current.items, guestItems);
    nextServerItems = addOne(combined, product, type);

    // Intentar upsert del activo
    try {
      const putRes = await axios.put(`${b}/carts/active`, { userId, items: toServerItems(nextServerItems) }, headers);

      // Eliminar carrito invitado para evitar duplicidad
      try {
        await axios.delete(`${b}/carts/${guestId}`);
      } catch (err) {
        if (err.response?.status !== 404) console.warn('[GuestCart] delete falló:', err.response?.data || err.message);
      }
      localStorage.removeItem('guestCartId');

      // Releer activo; si 404, fallback con lo enviado al PUT
      try {
        const { data } = await axios.get(`${b}/carts/active/${userId}`, headers);
        return { cartId: data.cart?.id || putRes.data.cartId || null, items: normalizeFromServer(data.cart?.items) };
      } catch (err) {
        if (err.response?.status === 404) {
          return { cartId: putRes.data.cartId || null, items: normalizeFromServer(nextServerItems) };
        }
        throw err;
      }
    } catch (err) {
      // Fallback duro: crear y adjuntar si el PUT falló
      const created = await axios.post(`${b}/carts`, { items: toServerItems(nextServerItems), status: 'active' });
      const newId = created.data?.cartId || created.data?.id || null;
      if (newId) {
        await axios.put(`${b}/carts/${newId}/attach/${userId}`, { items: toServerItems(nextServerItems) }, headers);
        try {
          const { data } = await axios.get(`${b}/carts/active/${userId}`, headers);
          return { cartId: data.cart?.id || newId, items: normalizeFromServer(data.cart?.items) };
        } catch (e) {
          return { cartId: newId, items: normalizeFromServer(nextServerItems) };
        }
      }
      return { cartId: null, items: [] };
    }
  }

  // Flujo normal (sin carrito invitado)
  const baseItems = current.items;
  nextServerItems = addOne(baseItems, product, type);

  if (userId) {
    try {
      const putRes = await axios.put(`${b}/carts/active`, { userId, items: toServerItems(nextServerItems) }, headers);
      try {
        const { data } = await axios.get(`${b}/carts/active/${userId}`, headers);
        return { cartId: data.cart?.id || putRes.data.cartId || null, items: normalizeFromServer(data.cart?.items) };
      } catch (err) {
        if (err.response?.status === 404) {
          return { cartId: putRes.data.cartId || null, items: normalizeFromServer(nextServerItems) };
        }
        throw err;
      }
    } catch (err) {
      // Fallback: crear y adjuntar
      const created = await axios.post(`${b}/carts`, { items: toServerItems(nextServerItems), status: 'active' });
      const newId = created.data?.cartId || created.data?.id || null;
      if (newId) {
        await axios.put(`${b}/carts/${newId}/attach/${userId}`, { items: toServerItems(nextServerItems) }, headers);
        try {
          const { data } = await axios.get(`${b}/carts/active/${userId}`, headers);
          return { cartId: data.cart?.id || newId, items: normalizeFromServer(data.cart?.items) };
        } catch (e) {
          return { cartId: newId, items: normalizeFromServer(nextServerItems) };
        }
      }
      return { cartId: null, items: [] };
    }
  }

  // Invitado
  let guest = sanitizeGuestId();
  if (!guest) {
    const { data } = await axios.post(`${b}/carts`, { items: toServerItems(nextServerItems), status: 'active' });
    const newId = data?.cartId || data?.id || null;
    if (newId) {
      localStorage.setItem('guestCartId', newId);
      guest = newId;
    } else {
      return { cartId: null, items: [] };
    }
  } else {
    try {
      await axios.put(`${b}/carts/${guest}`, { items: toServerItems(nextServerItems) });
    } catch (err) {
      if (err.response?.status === 404) {
        localStorage.removeItem('guestCartId');
        const { data } = await axios.post(`${b}/carts`, { items: toServerItems(nextServerItems), status: 'active' });
        const newId = data?.cartId || data?.id || null;
        if (newId) {
          localStorage.setItem('guestCartId', newId);
          guest = newId;
        } else {
          return { cartId: null, items: [] };
        }
      } else {
        throw err;
      }
    }
  }
  const safeId = sanitizeGuestId();
  if (!safeId) return { cartId: null, items: [] };
  const got = await axios.get(`${b}/carts/${safeId}`);
  return { cartId: safeId, items: normalizeFromServer(got.data.cart?.items || got.data.items) };
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
    if (nextServerItems.length === 0) {
      await axios.delete(`${b}/carts/active/${userId}`, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
      return { cartId: null, items: [] };
    }
    const putRes = await axios.put(
      `${b}/carts/active`,
      { userId, items: toServerItems(nextServerItems) },
      token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
    );
    try {
      const { data } = await axios.get(`${b}/carts/active/${userId}`, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
      return { cartId: data.cart?.id || putRes.data.cartId || null, items: normalizeFromServer(data.cart?.items) };
    } catch (err) {
      if (err.response?.status === 404) {
        // Si el GET falla por 404 (consistencia eventual), devolver lo enviado al PUT
        return { cartId: putRes.data.cartId || null, items: normalizeFromServer(nextServerItems) };
      }
      throw err;
    }
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