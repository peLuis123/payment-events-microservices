const request = require('supertest');
const { createApp } = require('../src/app');

describe('POST /checkout/sessions', () => {
  test('creates a pending checkout session with idempotency context', async () => {
    const checkoutService = {
      createSession: jest.fn().mockResolvedValue({
        checkoutId: 'checkout-123',
        checkoutUrl: 'https://checkout.stripe.test/session-123',
        paymentId: 'payment-123',
        status: 'pending'
      })
    };
    const app = createApp({
      orderService: { createOrder: jest.fn() },
      checkoutService,
      logger: { warn: jest.fn(), error: jest.fn() }
    });
    const payload = {
      items: [{ productId: 'product-123', quantity: 2, unitAmount: 4999 }],
      currency: 'USD',
      paymentProvider: 'stripe',
      successUrl: 'https://frontend.test/success',
      cancelUrl: 'https://frontend.test/cancel',
      externalReference: 'cart-123'
    };

    const response = await request(app)
      .post('/checkout/sessions')
      .set('X-Merchant-Id', 'merchant-123')
      .set('Idempotency-Key', 'checkout-request-123')
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      checkoutId: 'checkout-123',
      checkoutUrl: 'https://checkout.stripe.test/session-123',
      paymentId: 'payment-123',
      status: 'pending'
    });
    expect(checkoutService.createSession).toHaveBeenCalledWith({
      ...payload,
      merchantId: 'merchant-123',
      idempotencyKey: 'checkout-request-123'
    });
  });
});
