import admin from "firebase-admin";
import { db } from "../../firebase.js";
import { OrderModel } from "../models/order.model.js";

const ALLOWED_METHODS = ['paypal', 'payu', 'contraentrega'];

export class OrderService {
  static async createOrder({
    cartUid,
    userId,
    typePageMetod,
    status = 'paid',
    paypalOrderId = null,
    subtotalCOP = 0,
    shippingCost = 0,
    totalCOP = 0,
    totalUSD = 0,
    currency = 'COP',
    payment = null,
    referenceCode = null, // 🔹 nuevo
  }) {
    if (!ALLOWED_METHODS.includes(typePageMetod)) {
      throw new Error("typePageMetod no permitido");
    }

    const order = new OrderModel({
      cartUid,
      userId,
      typePageMetod,
      status,
      paypalOrderId,
      subtotalCOP,
      shippingCost,
      totalCOP,
      totalUSD,
      currency,
      payment,
      referenceCode, // 🔹 nuevo
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const docRef = await db.collection("orders").add(order.toFirestore());
    return { id: docRef.id, ...order.toFirestore() };
  }

  // 🔹 nuevo: actualizar por referenceCode desde confirmación PayU
  static async updateByReferenceCode(referenceCode, status, payment = null) {
    const snapshot = await db.collection("orders")
      .where("referenceCode", "==", referenceCode)
      .limit(1)
      .get();

    if (snapshot.empty) {
      throw new Error("Orden no encontrada para referenceCode");
    }

    const docRef = snapshot.docs[0].ref;
    await docRef.update({
      status,
      payment,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const updated = await docRef.get();
    return { id: updated.id, ...updated.data() };
  }

  // Nuevo: obtener orden por referenceCode
  static async getByReferenceCode(referenceCode) {
    const snapshot = await db
      .collection("orders")
      .where("referenceCode", "==", referenceCode)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }
  static async listByUser(userId, limit = 20) {
    if (!userId) throw new Error("userId es requerido");
    const base = db.collection("orders").where("userId", "==", userId);
    const lim = Number(limit) || 20;

    try {
      const snapshot = await base.orderBy("createdAt", "desc").limit(lim).get();
      const orders = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      return orders;
    } catch (error) {
      // Fallback cuando Firestore requiere índice compuesto
      if (String(error?.message || '').includes('requires an index')) {
        const snapshot = await base.limit(lim).get();
        const orders = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        return orders;
      }
      throw error;
    }
  }
}