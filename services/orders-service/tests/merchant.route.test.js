const request = require('supertest');
const { createApp } = require('../src/app');

describe('merchant routes', () => {
  test('single-store deployment rejects creating additional merchants', async () => {
    const merchantService = {
      create: jest.fn().mockResolvedValue({
        merchantId: 'merchant-123',
        name: 'Main Store',
        status: 'active',
      }),
    };
    const sessionAuth = (request, response, next) => {
      request.user = { userId: 'admin-1', role: 'admin' };
      next();
    };
    const app = createApp({
      orderService: { createOrder: jest.fn() },
      merchantService,
      sessionAuth,
      logger: { warn: jest.fn(), error: jest.fn() },
    });

    const response = await request(app)
      .post('/merchants')
      .set('X-Merchant-Id', 'merchant-123')
      .send({ name: 'Main Store', defaultCurrency: 'USD' });

    expect(response.status).toBe(409);
    expect(merchantService.create).not.toHaveBeenCalled();
  });
});
