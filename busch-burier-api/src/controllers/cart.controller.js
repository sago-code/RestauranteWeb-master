import { CartService } from "../services/cart.service.js";

export class CartController {
    static async create(req, res) {
        try {
            const { userId = null, status = 'active', items = [] } = req.body;
            const cart = await CartService.createCart({ userId, status, items });
            return res.status(201).json({ message: "Carrito creado", cartId: cart.id });
        } catch (error) {
            console.error("❌ Error creando carrito:", error);
            return res.status(400).json({ error: error.message });
        }
    }

    static async updateItems(req, res) {
        try {
            const { id } = req.params;
            const { items = [] } = req.body;
            const cart = await CartService.updateCartItems(id, items);
            return res.status(200).json({ message: "Carrito actualizado", cart });
        } catch (error) {
            console.error("❌ Error actualizando items:", error);
            return res.status(400).json({ error: error.message });
        }
    }

    static async attachToUser(req, res) {
        try {
            const { id, userId } = req.params;
            const { items = [] } = req.body;
            const cart = await CartService.attachCartToUser(id, userId, items);
            return res.status(200).json({ message: "Carrito adoptado por usuario", cartId: cart.id, cart });
        } catch (error) {
            console.error("❌ Error adoptando carrito:", error);
            return res.status(400).json({ error: error.message });
        }
    }

    static async decline(req, res) {
        try {
            const { id } = req.params;
            const cart = await CartService.updateStatus(id, 'declined');
            return res.status(200).json({ message: "Carrito declinado", cart });
        } catch (error) {
            console.error("❌ Error actualizando estado:", error);
            return res.status(400).json({ error: error.message });
        }
    }

    static async pay(req, res) {
        try {
            const { id } = req.params;
            const cart = await CartService.updateStatus(id, 'paged');
            return res.status(200).json({ message: "Carrito convertido a pedido", cart });
        } catch (error) {
            console.error("❌ Error actualizando estado:", error);
            return res.status(400).json({ error: error.message });
        }
    }

    static async getOne(req, res) {
        try {
            const { id } = req.params;
            const cart = await CartService.getCart(id);
            return res.status(200).json({ cart });
        } catch (error) {
            console.error("❌ Error obteniendo carrito:", error);
            return res.status(404).json({ error: error.message });
        }
    }

    // Nuevos: manejo de carrito activo por userId
    static async upsertActive(req, res) {
        try {
            const { userId, items } = req.body;
            console.log('➡️ [API] upsertActive called:', { userId, itemsCount: Array.isArray(items) ? items.length : 0 });
            const cart = await CartService.upsertActiveCartByUser({ userId, items });
            return res.status(200).json({ message: "Carrito activo sincronizado", cartId: cart.id });
        } catch (error) {
            console.error("❌ Error upsert activo:", error);
            return res.status(400).json({ error: error.message });
        }
    }

    static async getActive(req, res) {
        try {
            const { userId } = req.params;
            console.log('➡️ [API] getActive called:', { userId });
            const cart = await CartService.getActiveCartByUser(userId);
            return res.status(200).json({ cart });
        } catch (error) {
            return res.status(404).json({ error: error.message });
        }
    }

    static async declineActive(req, res) {
        try {
            const { userId } = req.params;
            console.log('➡️ [API] declineActive called:', { userId });
            const cart = await CartService.declineActiveCartByUser(userId);
            return res.status(200).json({ message: "Carrito activo declinado", cart });
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    static async payActive(req, res) {
        try {
            const { userId } = req.params;
            console.log('➡️ [API] payActive called:', { userId });
            const cart = await CartService.payActiveCartByUser(userId);
            return res.status(200).json({ message: "Carrito convertido a pedido", cart });
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
}