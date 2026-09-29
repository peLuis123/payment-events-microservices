const request = require('supertest');
const { createApp } = require('../src/app');

describe('POST /payouts', () => {
  test('creates a merchant payout', async () => {
    const paymentClient = {
      getPayment: jest.fn().mockResolvedValue({ merchantId: 'merchant-123' }),
      createPayout: jest
        .fn()
        .mockResolvedValue({ payoutId: 'payout-123', status: 'paid' }),
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
      .post('/payouts')
      .query({ merchantId: 'merchant-123' })
      .set('Idempotency-Key', 'payout-123')
      .send({
        payoutId: 'payout-123',
        provider: 'stripe',
        merchantAccountId: 'acct_123',
        amount: 5000,
        currency: 'USD',
      });

    expect(response.status).toBe(201);
    expect(paymentClient.createPayout).toHaveBeenCalledWith({
      payoutId: 'payout-123',
      merchantId: 'merchant-123',
      provider: 'stripe',
      merchantAccountId: 'acct_123',
      amount: 5000,
      currency: 'USD',
      idempotencyKey: 'payout-123',
    });
  });
});
