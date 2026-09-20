const { createCheckoutService } = require('../services/checkout.service');

describe('checkout idempotency', () => {
  test('returns the same session and does not call the provider twice', async () => {
    const provider = {
      createCheckout: jest.fn().mockResolvedValue({
        checkoutUrl: 'https://checkout.stripe.test/session-123'
      })
    };
    const service = createCheckoutService({
      provider,
      createCheckoutId: () => 'checkout-123',
      createPaymentId: () => 'payment-123'
    });
    const request = {
      merchantId: 'merchant-123',
      items: [{ productId: 'product-123', quantity: 1, unitAmount: 4999 }],
      currency: 'USD',
      paymentProvider: 'stripe',
      successUrl: 'https://frontend.test/success',
      cancelUrl: 'https://frontend.test/cancel',
      externalReference: 'cart-123',
      idempotencyKey: 'checkout-request-123'
    };

    const first = await service.createSession(request);
    const duplicate = await service.createSession(request);

    expect(duplicate).toEqual(first);
    expect(provider.createCheckout).toHaveBeenCalledTimes(1);
  });
});
