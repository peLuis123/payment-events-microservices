const { randomUUID } = require('node:crypto');

function createCheckoutService({
  provider,
  createCheckoutId = randomUUID,
  createPaymentId = randomUUID,
  sessionStore = new Map()
}) {
  async function createSession(request) {
    const idempotencyKey = `${request.merchantId}:${request.idempotencyKey}`;
    if (sessionStore.has(idempotencyKey)) {
      return sessionStore.get(idempotencyKey);
    }

    const checkoutId = createCheckoutId();
    const paymentId = createPaymentId();
    const providerSession = await provider.createCheckout({
      ...request,
      checkoutId,
      paymentId
    });

    const session = {
      checkoutId,
      checkoutUrl: providerSession.checkoutUrl,
      paymentId,
      status: 'pending'
    };
    sessionStore.set(idempotencyKey, session);
    return session;
  }

  return { createSession };
}

module.exports = { createCheckoutService };
