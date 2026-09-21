const request = require('supertest');
const { createApp } = require('../src/app');

describe('POST /payouts', () => {
  test('creates a merchant payout', async () => {
    const paymentClient = {
      createPayout: jest.fn().mockResolvedValue({ payoutId: 'payout-123', status: 'paid' })
    };
    const app = createApp({
      orderService: { createOrder: jest.fn() },
      paymentClient,
      logger: { warn: jest.fn(), error: jest.fn() }
    });

    const response = await request(app)
      .post('/payouts')
      .set('X-Merchant-Id', 'merchant-123')
      .set('Idempotency-Key', 'payout-123')
      .send({
        payoutId: 'payout-123',
        provider: 'stripe',
        merchantAccountId: 'acct_123',
        amount: 5000,
        currency: 'USD'
      });

    expect(response.status).toBe(201);
    expect(paymentClient.createPayout).toHaveBeenCalledWith({
      payoutId: 'payout-123',
      merchantId: 'merchant-123',
      provider: 'stripe',
      merchantAccountId: 'acct_123',
      amount: 5000,
      currency: 'USD',
      idempotencyKey: 'payout-123'
    });
  });
});
