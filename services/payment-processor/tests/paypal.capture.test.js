const { createPayPalCheckout } = require('../services/paypal.checkout');

describe('PayPal capture', () => {
  test('captures an approved PayPal order with PayPal-Request-Id', async () => {
    const fetchImpl = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'access-token-123' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({
        id: 'capture-123',
        status: 'COMPLETED'
      }) });
    const checkout = createPayPalCheckout({
      clientId: 'client-123',
      clientSecret: 'secret-123',
      fetchImpl,
      apiBaseUrl: 'https://api-m.sandbox.paypal.com'
    });

    await expect(checkout.captureOrder('paypal-order-123', 'capture-key-123'))
      .resolves.toEqual({ captureId: 'capture-123', status: 'COMPLETED' });

    expect(fetchImpl).toHaveBeenLastCalledWith(
      'https://api-m.sandbox.paypal.com/v2/checkout/orders/paypal-order-123/capture',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer access-token-123',
          'PayPal-Request-Id': 'capture-key-123'
        })
      })
    );
  });
});
