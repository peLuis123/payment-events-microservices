const request = require('supertest');
const { createApp } = require('../src/app');

describe('GET /merchants/:merchantId/balance', () => {
  test('returns the merchant balance', async () => {
    const paymentClient = {
      getBalance: jest.fn().mockResolvedValue({
        merchantId: 'merchant-123',
        available: 5799,
        pending: 0,
        currency: 'USD'
      })
    };
    const app = createApp({
      orderService: { createOrder: jest.fn() },
      paymentClient,
      logger: { warn: jest.fn(), error: jest.fn() }
    });

    const response = await request(app)
      .get('/merchants/merchant-123/balance')
      .set('X-Merchant-Id', 'merchant-123');

    expect(response.status).toBe(200);
    expect(response.body.available).toBe(5799);
    expect(paymentClient.getBalance).toHaveBeenCalledWith('merchant-123');
  });
});
