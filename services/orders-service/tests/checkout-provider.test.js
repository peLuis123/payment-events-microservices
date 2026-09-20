const request = require('supertest');
const { createApp } = require('../src/app');

const basePayload = {
  items: [{ productId: 'product-123', quantity: 1, unitAmount: 4999 }],
  currency: 'USD',
  successUrl: 'https://frontend.test/success',
  cancelUrl: 'https://frontend.test/cancel',
  externalReference: 'cart-123'
};

describe('checkout payment provider', () => {
  test.each(['stripe', 'paypal'])('accepts the %s provider', async (paymentProvider) => {
    const checkoutService = {
      createSession: jest.fn().mockResolvedValue({ status: 'pending' })
    };
    const app = createApp({
      orderService: { createOrder: jest.fn() },
      checkoutService,
      logger: { warn: jest.fn(), error: jest.fn() }
    });

    const response = await request(app)
      .post('/checkout/sessions')
      .set('X-Merchant-Id', 'merchant-123')
      .set('Idempotency-Key', `checkout-${paymentProvider}`)
      .send({ ...basePayload, paymentProvider });

    expect(response.status).toBe(201);
    expect(checkoutService.createSession).toHaveBeenCalledWith(
      expect.objectContaining({ paymentProvider })
    );
  });

  test('rejects an unsupported provider', async () => {
    const checkoutService = { createSession: jest.fn() };
    const app = createApp({
      orderService: { createOrder: jest.fn() },
      checkoutService,
      logger: { warn: jest.fn(), error: jest.fn() }
    });

    const response = await request(app)
      .post('/checkout/sessions')
      .set('X-Merchant-Id', 'merchant-123')
      .set('Idempotency-Key', 'checkout-unsupported')
      .send({ ...basePayload, paymentProvider: 'bitcoin' });

    expect(response.status).toBe(400);
    expect(checkoutService.createSession).not.toHaveBeenCalled();
  });
});
