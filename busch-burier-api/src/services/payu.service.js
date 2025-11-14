import crypto from 'crypto';

class PayUService {
  static preparePayment({
    amount,
    currency = 'COP',
    description = 'Orden',
    referenceCode,
    buyerEmail = 'guest@example.com',
    test = true,
  }) {
    const API_KEY = process.env.PAYU_API_KEY;
    const MERCHANT_ID = process.env.PAYU_MERCHANT_ID;
    const ACCOUNT_ID = process.env.PAYU_ACCOUNT_ID;
    const RESPONSE_URL = process.env.PAYU_RESPONSE_URL || 'http://localhost:5173/payu/close.html';
    const CONFIRMATION_URL = process.env.PAYU_CONFIRMATION_URL || 'http://localhost:3000/payu/confirm';
    const GATEWAY_URL = process.env.PAYU_GATEWAY_URL || 'https://sandbox.checkout.payulatam.com/ppp-web-gateway-payu/';

    if (!API_KEY || !MERCHANT_ID || !ACCOUNT_ID) {
      const missing = [
        !API_KEY && 'PAYU_API_KEY',
        !MERCHANT_ID && 'PAYU_MERCHANT_ID',
        !ACCOUNT_ID && 'PAYU_ACCOUNT_ID',
      ].filter(Boolean).join(', ');
      const err = new Error(`Faltan variables de entorno: ${missing}`);
      err.status = 500;
      throw err;
    }

    if (amount == null || referenceCode == null) {
      const err = new Error('amount y referenceCode son requeridos');
      err.status = 400;
      throw err;
    }

    // Normalizar monto como string con dos decimales
    const amountStr = Number(amount).toFixed(2);

    // Firma MD5 según PayU Latam
    const signatureBase = `${API_KEY}~${MERCHANT_ID}~${referenceCode}~${amountStr}~${currency}`;
    const signature = crypto.createHash('md5').update(signatureBase).digest('hex');

    // Impuestos (ajusta según tu lógica; aquí 0 por defecto)
    const tax = '0';
    const taxReturnBase = '0';

    const fields = {
      merchantId: String(MERCHANT_ID),
      accountId: String(ACCOUNT_ID),
      description,
      referenceCode,
      amount: amountStr,
      tax,
      taxReturnBase,
      currency,
      signature,
      test: test ? '1' : '0',
      buyerEmail,
      responseUrl: RESPONSE_URL,
      confirmationUrl: CONFIRMATION_URL,
    };

    return { gatewayUrl: GATEWAY_URL, fields };
  }
}

export default PayUService;