const crypto = require('node:crypto');

function verifyStripeSignature(payload, signature, secret, toleranceSeconds = 300) {
  const values = Object.fromEntries(signature.split(',').map((part) => part.split('=')));
  const timestamp = Number(values.t);
  if (!timestamp || Math.abs(Date.now() / 1000 - timestamp) > toleranceSeconds || !values.v1) {
    throw new Error('Invalid Stripe signature');
  }
  const expected = crypto.createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex');
  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(values.v1))) {
    throw new Error('Invalid Stripe signature');
  }
  return JSON.parse(payload);
}

function mapStripeEvent(event) {
  const types = {
    'payment_intent.succeeded': 'payment.approved',
    'payment_intent.payment_failed': 'payment.rejected',
    'charge.refunded': 'payment.refunded',
    'charge.dispute.created': 'payment.disputed'
  };
  const eventType = types[event.type];
  if (!eventType) return null;
  return {
    eventId: event.id,
    provider: 'stripe',
    providerEventId: event.id,
    eventType,
    source: 'webhook-service',
    data: { orderId: event.data.object.metadata?.orderId, providerPaymentId: event.data.object.id }
  };
}

module.exports = { verifyStripeSignature, mapStripeEvent };
