export class CartItemModel {
    constructor({ productId, name, image, quantity, unitPrice, currency = 'COP', type, added_at }) {
        this.productId = productId;
        this.name = name;
        this.image = image || null;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.currency = currency;
        this.type = type || null;
        this.added_at = added_at || null;
    }

    static fromClient(item) {
        return new CartItemModel({
            productId: item.productId,
            name: item.name,
            image: item.image,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            currency: item.currency || 'COP',
            type: item.type,
        });
    }

    toFirestore() {
        return {
            productId: this.productId,
            name: this.name,
            image: this.image,
            quantity: this.quantity,
            unitPrice: this.unitPrice,
            currency: this.currency,
            type: this.type,
            added_at: this.added_at,
        };
    }
}

export class CartModel {
    constructor({ id, userId, status, items, subtotal, total, currency = 'COP', created_at, updated_at }) {
        this.id = id || null;
        this.userId = userId || null;
        this.status = status;
        this.items = items;
        this.subtotal = subtotal;
        this.total = total;
        this.currency = currency;
        this.created_at = created_at;
        this.updated_at = updated_at;
    }

    toFirestore() {
        return {
            userId: this.userId,
            status: this.status,
            items: this.items.map(i => i.toFirestore()),
            subtotal: this.subtotal,
            total: this.total,
            currency: this.currency,
            created_at: this.created_at,
            updated_at: this.updated_at,
        };
    }
}