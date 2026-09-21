const { createPayPalCheckout } = require('../services/paypal.checkout');

describe('PayPal payouts', () => {
  test('creates a payout batch with PayPal-Request-Id', async () => {
    const fetchImpl = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'token-123' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ batch_header: { payout_batch_id: 'batch-123', batch_status: 'PENDING' } }) });
    const paypal = createPayPalCheckout({ clientId: 'client', clientSecret: 'secret', fetchImpl });

    await expect(paypal.createPayout({
      amount: 5000,
      currency: 'USD',
      merchantAccountId: 'merchant@example.com',
      idempotencyKey: 'payout-123'
    })).resolves.toEqual({ providerPayoutId: 'batch-123', status: 'pending' });
    expect(fetchImpl.mock.calls[1][0]).toBe('https://api-m.sandbox.paypal.com/v1/payments/payouts');
    expect(fetchImpl.mock.calls[1][1].headers['PayPal-Request-Id']).toBe('payout-123');
  });
});
