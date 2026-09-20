const { randomUUID } = require('node:crypto');

function createCheckoutService({
  provider,
  createCheckoutId = randomUUID,
  createPaymentId = randomUUID
}) {
  async function createSession(request) {
    const checkoutId = createCheckoutId();
    const paymentId = createPaymentId();
    const providerSession = await provider.createCheckout({
      ...request,
      checkoutId,
      paymentId
    });

    return {
      checkoutId,
      checkoutUrl: providerSession.checkoutUrl,
      paymentId,
      status: 'pending'
    };
  }

  return { createSession };
}

module.exports = { createCheckoutService };
