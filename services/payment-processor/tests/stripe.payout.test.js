const { createStripeCheckout } = require('../services/stripe.checkout');

describe('Stripe payouts', () => {
  test('creates a Connect transfer with idempotency', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'tr_123', object: 'transfer' })
    });
    const stripe = createStripeCheckout({ secretKey: 'sk_test_123', fetchImpl });

    await expect(stripe.createPayout({
      amount: 5000,
      currency: 'USD',
      merchantAccountId: 'acct_123',
      idempotencyKey: 'payout-123'
    })).resolves.toEqual({ providerPayoutId: 'tr_123', status: 'paid' });
    expect(fetchImpl).toHaveBeenCalledWith('https://api.stripe.com/v1/transfers', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ 'Idempotency-Key': 'payout-123' }),
      body: 'amount=5000&currency=usd&destination=acct_123'
    }));
  });
});
