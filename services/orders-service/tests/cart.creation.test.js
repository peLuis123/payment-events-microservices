const request = require('supertest');
const { createApp } = require('../src/app');

describe('POST /carts', () => {
  test('creates a cart for the authenticated buyer', async () => {
    const cartService = {
      create: jest
        .fn()
        .mockResolvedValue({
          cartId: 'cart-123',
          userId: 'user-123',
          merchantId: 'merchant-123',
          status: 'active',
        }),
    };
    const sessionAuth = (req, res, next) => {
      req.user = { userId: 'user-123', role: 'buyer' };
      next();
    };
    const app = createApp({
      storefrontMerchantId: 'merchant-123',
      getMerchant: async (merchantId) => ({ merchantId, status: 'active' }),
      orderService: { createOrder: jest.fn() },
      cartService,
      sessionAuth,
      logger: { warn: jest.fn(), error: jest.fn() },
    });

    const response = await request(app)
      .post('/carts')
      .send({ merchantId: 'merchant-123', currency: 'USD' });
    expect(response.status).toBe(201);
    expect(cartService.create).toHaveBeenCalledWith({
      userId: 'user-123',
      merchantId: 'merchant-123',
      currency: 'USD',
    });
  });
});
