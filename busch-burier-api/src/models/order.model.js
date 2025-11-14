export class OrderModel {
  constructor({
    id,
    cartUid,
    userId,
    typePageMetod, // 'paypal' | 'payu' | 'contraentrega'
    status,        // 'paid' | 'pending' | 'declined'
    paypalOrderId, // opcional según método
    subtotalCOP,
    shippingCost,
    totalCOP,
    totalUSD,
    currency = 'COP',
    payment,       // objeto raw del gateway (capture de PayPal / confirm de PayU)
    referenceCode, // 🔹 nuevo: clave para enlazar confirmación PayU
    createdAt,
    updatedAt,
  }) {
    this.id = id || null;
    this.cartUid = cartUid || null;
    this.userId = userId || null;
    this.typePageMetod = typePageMetod;
    this.status = status || 'paid';
    this.paypalOrderId = paypalOrderId || null;
    this.subtotalCOP = subtotalCOP || 0;
    this.shippingCost = shippingCost || 0;
    this.totalCOP = totalCOP || 0;
    this.totalUSD = totalUSD || 0;
    this.currency = currency || 'COP';
    this.payment = payment || null;
    this.referenceCode = referenceCode || null;
    this.createdAt = createdAt || null;
    this.updatedAt = updatedAt || null;
  }

  toFirestore() {
    return {
      cartUid: this.cartUid,
      userId: this.userId,
      typePageMetod: this.typePageMetod,
      status: this.status,
      paypalOrderId: this.paypalOrderId,
      subtotalCOP: this.subtotalCOP,
      shippingCost: this.shippingCost,
      totalCOP: this.totalCOP,
      totalUSD: this.totalUSD,
      currency: this.currency,
      payment: this.payment,
      referenceCode: this.referenceCode, // 🔹 nuevo
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}