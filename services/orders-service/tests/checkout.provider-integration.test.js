const request = require('supertest');
const { createApp } = require('../src/app');

describe('checkout provider integration', () => {
  test('delegates a validated checkout request to the provider processor', async () => {
    const checkoutProcessor = {
      createCheckout: jest.fn().mockResolvedValue({
        checkoutId: 'checkout-stripe-123',
        checkoutUrl: 'https://checkout.stripe.test/session-123',
        paymentId: 'payment-stripe-123',
        status: 'pending'
      })
    };
    const checkoutService = {
      createSession: jest.fn().mockImplementation((request) =>
        checkoutProcessor.createCheckout(request)
      )
    };
    const app = createApp({
      orderService: { createOrder: jest.fn() },
      checkoutService,
      logger: { warn: jest.fn(), error: jest.fn() }
    });

    const response = await request(app)
      .post('/checkout/sessions')
      .set('X-Merchant-Id', 'merchant-123')
      .set('Idempotency-Key', 'checkout-stripe-123')
      .send({
        items: [{ productId: 'product-123', quantity: 1 }],
        currency: 'USD',
        paymentProvider: 'stripe',
        successUrl: 'https://frontend.test/success',
        cancelUrl: 'https://frontend.test/cancel',
        externalReference: 'cart-123'
      });

    expect(response.status).toBe(201);
    expect(response.body.paymentId).toBe('payment-stripe-123');
    expect(checkoutProcessor.createCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentProvider: 'stripe',
        merchantId: 'merchant-123',
        idempotencyKey: 'checkout-stripe-123'
      })
    );
  });
});
