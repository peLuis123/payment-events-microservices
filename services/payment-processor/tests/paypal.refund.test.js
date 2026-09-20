const { createPayPalCheckout } = require('../services/paypal.checkout');

describe('PayPal refunds', () => {
  test('refunds a capture with PayPal-Request-Id', async () => {
    const fetchImpl = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'access-token-123' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'refund-123', status: 'COMPLETED' }) });
    const paypal = createPayPalCheckout({
      clientId: 'client-123',
      clientSecret: 'secret-123',
      fetchImpl
    });

    await expect(paypal.refundPayment({
      paymentId: 'capture-123',
      amount: 1200,
      currency: 'USD',
      idempotencyKey: 'refund-123'
    })).resolves.toEqual({
      refundId: 'refund-123',
      status: 'COMPLETED'
    });
    expect(fetchImpl.mock.calls[1][0])
      .toBe('https://api-m.sandbox.paypal.com/v2/payments/captures/capture-123/refund');
    expect(fetchImpl.mock.calls[1][1].headers['PayPal-Request-Id']).toBe('refund-123');
  });
});
