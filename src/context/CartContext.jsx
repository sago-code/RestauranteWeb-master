import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import * as cartApi from '../services/cartApi';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe ser usado dentro de un CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [activeCartId, setActiveCartId] = useState(null);
  const { usuario } = useAuth();

  const getUserId = () => {
    const stored = JSON.parse(localStorage.getItem('usuario') || sessionStorage.getItem('usuario') || 'null');
    return stored?.uid || null;
  };

  const normalizeFromServer = (items) => (items || []).map(i => ({
    id: i.productId,
    nombre: i.name,
    imagen: i.image || undefined,
    cantidad: i.quantity,
    precio: i.unitPrice
  }));

  // Sanear guestCartId en localStorage
  const getGuestCartId = () => {
    const id = localStorage.getItem('guestCartId');
    if (!id || id === 'undefined' || id === 'null' || id === '') {
      localStorage.removeItem('guestCartId');
      return null;
    }
    return id;
  };

  // Hidratar en montaje (trae carrito desde Firestore si hay userId o guestCartId)
  // Dentro de CartProvider -> useEffect de hidratación (montaje)
  useEffect(() => {
    const hydrate = async () => {
      try {
        const base = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
        const userId = getUserId();
        if (userId) {
          const url = `${base}/carts/active/${userId}`;
          console.log('[Hydrate] GET', url);
          const { data } = await axios.get(url);
          setCartItems(normalizeFromServer(data.cart?.items));
          setActiveCartId(data.cart?.id || null);
          return;
        }
        // Usa SIEMPRE el helper saneado
        const guestCartId = getGuestCartId(); // ← cambio crítico
        if (guestCartId) {
          const url = `${base}/carts/${guestCartId}`;
          console.log('[Hydrate guest] GET', url);
          const { data } = await axios.get(url);
          setCartItems(normalizeFromServer(data.cart?.items || data.items));
          setActiveCartId(guestCartId);
          return;
        }
        console.log('[Hydrate] no userId ni guestCartId: carrito vacío');
        setCartItems([]);
        setActiveCartId(null);
      } catch (err) {
        console.error('Error hidratando carrito:', err.response?.data || err.message);
      }
    };
    hydrate();
  }, []);

  // Elimina la sincronización automática por efecto; ahora las acciones son backend-first
  useEffect(() => {
    const userId = getUserId();
    if (!userId) {
      console.log('[Sync] skip: no userId (usuario no logueado)');
      return;
    }

    const sync = async () => {
      try {
        const base = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
        if (cartItems.length === 0) {
          const delUrl = `${base}/carts/active/${userId}`;
          console.log('[Sync] DELETE', delUrl, '(declinar porque carrito vacío)');
          await axios.delete(delUrl);
          setActiveCartId(null);
          return;
        }

        const pathname = window.location.pathname;
        const type =
          pathname.includes('hamburguesas') ? 'hamburguesas' :
          pathname.includes('perros') ? 'perros' :
          pathname.includes('salchipapas') ? 'salchipapas' :
          undefined;

        const items = cartItems.map(i => ({
          productId: i.id,
          name: i.nombre,
          image: i.imagen,
          quantity: i.cantidad,
          unitPrice: i.precio,
          currency: 'COP',
          type
        }));

        const putUrl = `${base}/carts/active`;
        console.log('[Sync] PUT', putUrl, 'userId:', userId, 'items:', items.length, 'type:', type);
        const { data } = await axios.put(putUrl, { userId, items });
        setActiveCartId(data.cartId || data.id || null);
      } catch (err) {
        console.error('Error sincronizando carrito activo:', err);
      }
    };

    sync();
  }, [cartItems]);

  // Migrar carrito del invitado al backend cuando el usuario inicia sesión
  useEffect(() => {
    const migrate = async () => {
      if (!usuario?.uid) return;
      const base = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
      const guestCartId = getGuestCartId(); // ← cambio crítico
      try {
        if (guestCartId) {
          const urlAttach = `${base}/carts/${guestCartId}/attach/${usuario.uid}`;
          console.log('[Migrate] ATTACH', urlAttach);
          try {
            const { data } = await axios.put(urlAttach, { items: cartItems.map(i => ({
              productId: i.id, name: i.nombre, image: i.imagen, quantity: i.cantidad, unitPrice: i.precio, currency: 'COP'
            })) });
            setActiveCartId(data.cartId || data.id || guestCartId);
            localStorage.removeItem('guestCartId');
            return;
          } catch (e) {
            console.warn('[Migrate] ATTACH falló, hago fallback a upsertActive', e.response?.data || e.message);
          }
        }
        // Fallback: upsertActive con los items actuales
        const items = cartItems.map(i => ({
          productId: i.id, name: i.nombre, image: i.imagen, quantity: i.cantidad, unitPrice: i.precio, currency: 'COP'
        }));
        const urlActive = `${base}/carts/active`;
        console.log('[Migrate] PUT', urlActive, 'userId:', usuario.uid, 'items:', items.length);
        const { data } = await axios.put(urlActive, { userId: usuario.uid, items });
        setActiveCartId(data.cartId || data.id || null);
        localStorage.removeItem('guestCartId');
      } catch (err) {
        console.error('Error migrando/adoptando carrito tras login:', err.response?.data || err.message);
      }
    };
    migrate();
  }, [usuario?.uid]);

  // Acciones backend-first
  const addToCart = async (item, type) => {
    try {
      const { cartId, items } = await cartApi.addItem(
        { id: item.id, nombre: item.nombre, imagen: item.imagen, precio: item.precio },
        type
      );
      setCartItems(items);
      setActiveCartId(cartId);
    } catch (err) {
      console.error('Error addToCart:', err.response?.data || err.message);
      alert('No se pudo agregar al carrito. Intenta de nuevo.');
    };
  };

  const updateQuantity = async (itemId, newQuantity) => {
    try {
      const { cartId, items } = await cartApi.updateQuantity(itemId, newQuantity);
      setCartItems(items);
      setActiveCartId(cartId);
    } catch (err) {
      console.error('Error updateQuantity:', err.response?.data || err.message);
      alert('No se pudo actualizar el carrito.');
    };
  };

  const removeFromCart = async (itemId) => {
    await updateQuantity(itemId, 0);
  };

  const clearCart = async () => {
    try {
      const { cartId, items } = await cartApi.clearCart();
      setCartItems(items);
      setActiveCartId(cartId);
    } catch (err) {
      console.error('Error clearCart:', err.response?.data || err.message);
    };
  };

  const getTotalItems = () => cartItems.reduce((t, i) => t + i.cantidad, 0);
  const getTotalPrice = () => cartItems.reduce((t, i) => t + (i.precio * i.cantidad), 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      setCartItems,
      activeCartId,
      setActiveCartId,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      getTotalItems,
      getTotalPrice,
      activeCartId,
    }}>
      {children}
    </CartContext.Provider>
  );
}