const { createCheckoutService } = require('../services/checkout.service');

describe('createCheckoutService', () => {
  test('creates a pending checkout with internal payment references', async () => {
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
      items: [{ productId: 'product-123', quantity: 1 }],
      currency: 'USD',
      paymentProvider: 'stripe',
      successUrl: 'https://frontend.test/success',
      cancelUrl: 'https://frontend.test/cancel',
      externalReference: 'cart-123',
      idempotencyKey: 'checkout-request-123'
    };

    await expect(service.createSession(request)).resolves.toEqual({
      checkoutId: 'checkout-123',
      checkoutUrl: 'https://checkout.stripe.test/session-123',
      paymentId: 'payment-123',
      status: 'pending'
    });
    expect(provider.createCheckout).toHaveBeenCalledWith({
      ...request,
      checkoutId: 'checkout-123',
      paymentId: 'payment-123'
    });
  });
});
