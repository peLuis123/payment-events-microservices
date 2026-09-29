const request = require('supertest');
const { createApp } = require('../src/app');

describe('GET /merchants/:merchantId/balance', () => {
  test('returns the merchant balance', async () => {
    const paymentClient = {
      getPayment: jest.fn().mockResolvedValue({ merchantId: 'merchant-123' }),
      getBalance: jest.fn().mockResolvedValue({
        merchantId: 'merchant-123',
        available: 5799,
        pending: 0,
        currency: 'USD',
      }),
    };
    const app = createApp({
      sessionAuth: (req, res, next) => {
        req.user = { userId: 'admin-1', role: 'admin' };
        next();
      },
      getMembership: async () => ({ role: 'admin', status: 'active' }),
      getMerchant: async (merchantId) => ({ merchantId, status: 'active' }),
      listMemberships: async () => [{ merchantId: 'merchant-123' }],
      orderService: { createOrder: jest.fn() },
      paymentClient,
      logger: { warn: jest.fn(), error: jest.fn() },
    });

    const response = await request(app)
      .get('/merchants/merchant-123/balance')
      .query({ merchantId: 'merchant-123' });

    expect(response.status).toBe(200);
    expect(response.body.available).toBe(5799);
    expect(paymentClient.getBalance).toHaveBeenCalledWith('merchant-123');
  });
});
