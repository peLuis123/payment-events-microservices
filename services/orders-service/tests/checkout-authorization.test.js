const request = require('supertest');
const { createApp } = require('../src/app');

const payload = {
  items: [{ productId: 'product-123', quantity: 1 }],
  currency: 'USD',
  paymentProvider: 'stripe',
  successUrl: 'https://frontend.test/success',
  cancelUrl: 'https://frontend.test/cancel',
  externalReference: 'cart-123'
};

describe('checkout authorization', () => {
  test('rejects checkout creation without a merchant identity', async () => {
    const checkoutService = { createSession: jest.fn() };
    const app = createApp({
      orderService: { createOrder: jest.fn() },
      checkoutService,
      logger: { warn: jest.fn(), error: jest.fn() }
    });

    const response = await request(app)
      .post('/checkout/sessions')
      .set('Idempotency-Key', 'checkout-request-123')
      .send(payload);

    expect(response.status).toBe(401);
    expect(checkoutService.createSession).not.toHaveBeenCalled();
  });

  test('passes the merchant identity to checkout creation', async () => {
    const checkoutService = {
      createSession: jest.fn().mockResolvedValue({ status: 'pending' })
    };
    const app = createApp({
      orderService: { createOrder: jest.fn() },
      checkoutService,
      logger: { warn: jest.fn(), error: jest.fn() }
    });

    await request(app)
      .post('/checkout/sessions')
      .set('X-Merchant-Id', 'merchant-123')
      .set('Idempotency-Key', 'checkout-request-123')
      .send(payload);

    expect(checkoutService.createSession).toHaveBeenCalledWith(
      expect.objectContaining({ merchantId: 'merchant-123' })
    );
  });
});
