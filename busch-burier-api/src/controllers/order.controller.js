import { OrderService } from "../services/order.service.js";

export class OrderController {
  static async create(req, res) {
    try {
      const {
        cartUid = null,
        userId = null,
        typePageMetod,
        status = 'paid',
        paypalOrderId = null,
        subtotalCOP = 0,
        shippingCost = 0,
        totalCOP = 0,
        totalUSD = 0,
        currency = 'COP',
        payment = null,
        referenceCode = null,
      } = req.body;

      if (!typePageMetod) {
        return res.status(400).json({ error: "typePageMetod es requerido" });
      }

      const saved = await OrderService.createOrder({
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
        referenceCode,
      });

      return res.status(201).json({ message: "Orden creada", orderId: saved.id, order: saved });
    } catch (error) {
      console.error("❌ Error creando orden:", error);
      return res.status(400).json({ error: error.message });
    }
  }
  static async getByReferenceCode(req, res) {
    try {
      const { referenceCode } = req.params;
      const order = await OrderService.getByReferenceCode(referenceCode);

      if (!order) {
        return res.status(404).json({ error: "Orden no encontrada" });
      }

      return res.status(200).json({ order });
    } catch (error) {
      console.error("❌ Error consultando orden por referencia:", error);
      return res.status(400).json({ error: error.message });
    }
  }
  static async listByUser(req, res) {
    try {
      const { userId } = req.params;
      const limit = Number(req.query.limit) || 20;
      const orders = await OrderService.listByUser(userId, limit);
      return res.status(200).json({ orders });
    } catch (error) {
      console.error("❌ Error listando órdenes por usuario:", error);
      return res.status(400).json({ error: error.message });
    }
  }
}