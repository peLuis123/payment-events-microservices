const request = require('supertest');
const express = require('express');
const { createBalanceInternalRoute } = require('../routes/balance.internal.route');

describe('GET /internal/balances/:merchantId', () => {
  test('returns a merchant balance for orders-service', async () => {
    const getBalance = jest.fn().mockResolvedValue({
      merchantId: 'merchant-123',
      available: 5799,
      pending: 0,
      currency: 'USD'
    });
    const app = express();
    app.use(createBalanceInternalRoute({ getBalance }));

    const response = await request(app)
      .get('/internal/balances/merchant-123')
      .set('X-Internal-Service', 'orders-service');

    expect(response.status).toBe(200);
    expect(response.body.available).toBe(5799);
    expect(getBalance).toHaveBeenCalledWith('merchant-123');
  });
});
