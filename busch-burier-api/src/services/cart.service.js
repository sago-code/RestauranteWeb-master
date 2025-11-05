import admin from "firebase-admin";
import { db } from "../../firebase.js";
import { CartModel, CartItemModel } from "../models/cart.model.js";

const ALLOWED_STATUSES = ['active', 'declined', 'paged'];

export class CartService {
    static computeTotals(items) {
        const subtotal = items.reduce((sum, i) => sum + (i.unitPrice * i.quantity), 0);
        return { subtotal, total: subtotal };
    }

    static async upsertActiveCartByUser({ userId, items }) {
        if (!userId) throw new Error("userId es requerido para carrito activo");
        if (!Array.isArray(items) || items.length === 0) {
            return await CartService.declineActiveCartByUser(userId);
        }

        const qActive = await db
            .collection("carts")
            .where("userId", "==", userId)
            .where("status", "==", "active")
            .limit(1)
            .get();

        const cartItems = items.map((i) => {
            const item = CartItemModel.fromClient(i);
            // Usar Timestamp.now() dentro de arrays
            item.added_at = admin.firestore.Timestamp.now();
            return item;
        });
        const { subtotal, total } = CartService.computeTotals(cartItems);

        if (!qActive.empty) {
            const doc = qActive.docs[0];
            await doc.ref.update({
                items: cartItems.map(i => i.toFirestore()),
                subtotal,
                total,
                updated_at: admin.firestore.FieldValue.serverTimestamp(),
            });
            const snap = await doc.ref.get();
            return { id: snap.id, ...snap.data() };
        }

        // crear nuevo active
        const cart = new CartModel({
            userId,
            status: "active",
            items: cartItems,
            subtotal,
            total,
            currency: "COP",
            created_at: admin.firestore.FieldValue.serverTimestamp(),
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });
        const docRef = await db.collection("carts").add(cart.toFirestore());
        // FIX: devolver el id real sin que lo pise el id=null del modelo
        return { ...cart, id: docRef.id };
    }

    static async createCart({ userId = null, status = "active", items = [] }) {
        if (!ALLOWED_STATUSES.includes(status)) throw new Error("Estado no permitido");
        const cartItems = (items || []).map((i) => {
            const item = CartItemModel.fromClient(i);
            item.added_at = admin.firestore.Timestamp.now();
            return item;
        });
        const { subtotal, total } = CartService.computeTotals(cartItems);

        const cart = new CartModel({
            userId,
            status,
            items: cartItems,
            subtotal,
            total,
            currency: "COP",
            created_at: admin.firestore.FieldValue.serverTimestamp(),
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });
        const docRef = await db.collection("carts").add(cart.toFirestore());
        // FIX: primero el spread, luego id real
        return { ...cart, id: docRef.id };
    }

    static async getCart(id) {
        const doc = await db.collection("carts").doc(id).get();
        if (!doc.exists) throw new Error("Carrito no encontrado");
        return { id: doc.id, ...doc.data() };
    }

    static async updateStatus(id, status) {
        if (!ALLOWED_STATUSES.includes(status)) throw new Error("Estado no permitido");
        const ref = db.collection("carts").doc(id);
        const snap = await ref.get();
        if (!snap.exists) throw new Error("Carrito no encontrado");
        await ref.update({
            status,
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });
        const updated = await ref.get();
        return { id: updated.id, ...updated.data() };
    }

    static async updateCartItems(id, items = []) {
        const ref = db.collection("carts").doc(id);
        const snap = await ref.get();
        if (!snap.exists) throw new Error("Carrito no encontrado");

        const cartItems = items.map((i) => {
            const item = CartItemModel.fromClient(i);
            item.added_at = admin.firestore.Timestamp.now();
            return item;
        });
        const { subtotal, total } = CartService.computeTotals(cartItems);

        await ref.update({
            items: cartItems.map(i => i.toFirestore()),
            subtotal,
            total,
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });
        const updated = await ref.get();
        return { id: updated.id, ...updated.data() };
    }

    static async attachCartToUser(id, userId, items = []) {
        if (!userId) throw new Error("userId es requerido");
        const ref = db.collection("carts").doc(id);
        const snap = await ref.get();
        if (!snap.exists) throw new Error("Carrito no encontrado");

        let cartItems = (items || []).map((i) => {
            const item = CartItemModel.fromClient(i);
            item.added_at = admin.firestore.Timestamp.now();
            return item;
        });
        if (cartItems.length === 0) {
            // Si no nos mandan items, conserva los existentes
            const existing = snap.data().items || [];
            cartItems = existing.map(i => new CartItemModel({
                productId: i.productId,
                name: i.name,
                image: i.image,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
                currency: i.currency,
                type: i.type,
                added_at: i.added_at,
            }));
        }
        const { subtotal, total } = CartService.computeTotals(cartItems);

        await ref.update({
            userId,
            status: "active",
            items: cartItems.map(i => i.toFirestore()),
            subtotal,
            total,
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });

        const updated = await ref.get();
        return { id: updated.id, ...updated.data() };
    }

    static async getActiveCartByUser(userId) {
        if (!userId) throw new Error("userId es requerido");
        const q = await db
            .collection("carts")
            .where("userId", "==", userId)
            .where("status", "==", "active")
            .limit(1)
            .get();

        if (q.empty) {
            throw new Error("No hay carrito activo");
        }
        const snap = q.docs[0];
        return { id: snap.id, ...snap.data() };
    }

    static async declineActiveCartByUser(userId) {
        if (!userId) throw new Error("userId es requerido");
        const q = await db
            .collection("carts")
            .where("userId", "==", userId)
            .where("status", "==", "active")
            .limit(1)
            .get();

        if (q.empty) {
            return { message: "No hay carrito activo" };
        }
        const doc = q.docs[0];
        await doc.ref.update({
            status: "declined",
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });
        const snap = await doc.ref.get();
        return { id: snap.id, ...snap.data() };
    }

    static async payActiveCartByUser(userId) {
        if (!userId) throw new Error("userId es requerido");
        const q = await db
            .collection("carts")
            .where("userId", "==", userId)
            .where("status", "==", "active")
            .limit(1)
            .get();

        if (q.empty) {
            throw new Error("No hay carrito activo para pagar");
        }
        const doc = q.docs[0];
        await doc.ref.update({
            status: "paged",
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });
        const snap = await doc.ref.get();
        return { id: snap.id, ...snap.data() };
    }
}