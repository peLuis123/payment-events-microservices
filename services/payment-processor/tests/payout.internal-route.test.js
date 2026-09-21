const request = require('supertest');
const express = require('express');
const { createPayoutInternalRoute } = require('../routes/payout.internal.route');

describe('POST /internal/payouts', () => {
  test('creates a payout for orders-service', async () => {
    const create = jest.fn().mockResolvedValue({ payoutId: 'payout-123', status: 'paid' });
    const app = express();
    app.use(express.json());
    app.use(createPayoutInternalRoute({ create }));

    const response = await request(app)
      .post('/internal/payouts')
      .set('X-Internal-Service', 'orders-service')
      .send({
        payoutId: 'payout-123',
        merchantId: 'merchant-123',
        provider: 'stripe',
        merchantAccountId: 'acct_123',
        amount: 5000,
        currency: 'USD'
      });

    expect(response.status).toBe(201);
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ payoutId: 'payout-123' }));
  });
});
