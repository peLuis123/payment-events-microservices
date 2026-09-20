const { createStripeCheckout } = require('../services/stripe.checkout');

describe('Stripe refunds', () => {
  test('creates a refund for a payment intent', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 're_test_123', status: 'succeeded' })
    });
    const stripe = createStripeCheckout({
      secretKey: 'sk_test_123',
      fetchImpl
    });

    await expect(stripe.refundPayment({
      paymentId: 'pi_test_123',
      amount: 1200,
      idempotencyKey: 'refund-123'
    })).resolves.toEqual({
      refundId: 're_test_123',
      status: 'succeeded'
    });
    expect(fetchImpl).toHaveBeenCalledWith('https://api.stripe.com/v1/refunds', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ 'Idempotency-Key': 'refund-123' }),
      body: 'payment_intent=pi_test_123&amount=1200'
    }));
  });
});
