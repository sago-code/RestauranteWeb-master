import PayUService from '../services/payu.service.js';
import crypto from 'crypto';
import { OrderService } from '../services/order.service.js';
import { CartService } from '../services/cart.service.js';

const PayUController = {
  async prepare(req, res) {
    try {
      const {
        amount,
        currency = 'COP',
        description = 'Orden Restaurante',
        referenceCode,
        buyerEmail,
        test = true,
      } = req.body || {};
      const result = PayUService.preparePayment({
        amount,
        currency,
        description,
        referenceCode,
        buyerEmail,
        test,
      });
      res.status(200).json(result);
    } catch (err) {
      const status = err.status || 500;
      res.status(status).json({ error: err.message || 'Error preparando pago con PayU' });
    }
  },

  // 🔹 nuevo: confirmación servidor-a-servidor desde PayU
  async confirm(req, res) {
    try {
      // PayU puede enviar application/x-www-form-urlencoded; Express ya lo parsea
      const body = req.body || {};
      const merchantId = body.merchantId || body.merchant_id;
      const referenceCode = body.referenceCode || body.reference_pol;
      const value = body.TX_VALUE || body.value;
      const currency = body.currency || 'COP';
      const transactionState = body.transactionState || body.state_pol;
      const signature = body.signature || body.sign;

      // Mapear estado de PayU → estado interno
      const stateNum = String(transactionState || '').trim();
      const status =
        stateNum === '4' ? 'paid' :
        stateNum === '6' ? 'declined' :
        'pending';

      const payment = {
        gateway: 'payu',
        transactionState: transactionState,
        referenceCode,
        value: Number(value),
        currency,
        merchantId,
        signature,
        receivedAt: new Date().toISOString(),
        raw: body,
      };

      // Actualizar la orden
      const updatedOrder = await OrderService.updateByReferenceCode(referenceCode, status, payment);

      // Si fue aprobada, marcar carrito como pagado (paged)
      if (updatedOrder?.cartUid && status === 'paid') {
        try {
          await CartService.updateStatus(updatedOrder.cartUid, 'paged');
        } catch (e) {
          console.warn('No se pudo marcar carrito como paged:', e.message || e);
        }
      }

      return res.status(200).json({ message: 'Confirmación PayU procesada', order: updatedOrder });
    } catch (err) {
      console.error('❌ Error en confirm PayU:', err);
      const status = err.status || 500;
      return res.status(status).json({ error: err.message || 'Error confirmando pago PayU' });
    }
  }
};

export default PayUController;