const { createPayPalCheckout } = require('../services/paypal.checkout');

describe('createPayPalCheckout', () => {
  test('creates a PayPal order with PayPal-Request-Id', async () => {
    const fetchImpl = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'access-token-123' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({
        id: 'paypal-order-123',
        links: [{ rel: 'approve', href: 'https://www.sandbox.paypal.com/checkoutnow?token=paypal-order-123' }]
      }) });
    const checkout = createPayPalCheckout({
      clientId: 'client-123',
      clientSecret: 'secret-123',
      fetchImpl,
      apiBaseUrl: 'https://api-m.sandbox.paypal.com'
    });
    const request = {
      items: [{ productId: 'product-123', quantity: 1, unitAmount: 4999 }],
      currency: 'USD',
      successUrl: 'https://frontend.test/success',
      cancelUrl: 'https://frontend.test/cancel',
      externalReference: 'cart-123',
      idempotencyKey: 'checkout-request-123',
      paymentId: 'payment-123'
    };

    await expect(checkout.createCheckout(request)).resolves.toEqual({
      checkoutId: 'paypal-order-123',
      checkoutUrl: 'https://www.sandbox.paypal.com/checkoutnow?token=paypal-order-123',
      paymentId: 'paypal-order-123',
      providerTransactionId: 'paypal-order-123'
    });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(fetchImpl.mock.calls[1][1].headers['PayPal-Request-Id']).toBe('checkout-request-123');
  });
});
