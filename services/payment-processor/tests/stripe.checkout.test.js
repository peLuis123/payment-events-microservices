const { createStripeCheckout } = require('../services/stripe.checkout');

describe('createStripeCheckout', () => {
  test('creates a Stripe checkout session with idempotency', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/cs_test_123',
        payment_intent: 'pi_test_123'
      })
    });
    const checkout = createStripeCheckout({
      secretKey: 'sk_test_value',
      fetchImpl
    });
    const request = {
      items: [{ productId: 'product-123', quantity: 1, unitAmount: 4999 }],
      currency: 'USD',
      successUrl: 'https://frontend.test/success',
      cancelUrl: 'https://frontend.test/cancel',
      externalReference: 'cart-123',
      idempotencyKey: 'checkout-request-123',
      paymentId: 'payment-123',
      merchantId: 'merchant-123'
    };

    await expect(checkout.createCheckout(request)).resolves.toEqual({
      checkoutId: 'cs_test_123',
      checkoutUrl: 'https://checkout.stripe.com/cs_test_123',
      paymentId: 'payment-123',
      providerTransactionId: 'pi_test_123'
    });
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.stripe.com/v1/checkout/sessions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer sk_test_value',
          'Idempotency-Key': 'checkout-request-123'
        })
      })
    );
  });
});
