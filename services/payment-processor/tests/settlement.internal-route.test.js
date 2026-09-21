const request = require('supertest');
const express = require('express');
const { createSettlementInternalRoute } = require('../routes/settlement.internal.route');

describe('POST /internal/settlements', () => {
  test('settles a merchant amount for an internal caller', async () => {
    const settle = jest.fn().mockResolvedValue({ status: 'settled', settlementId: 'settlement-123' });
    const app = express();
    app.use(express.json());
    app.use(createSettlementInternalRoute({ settle }));

    const response = await request(app)
      .post('/internal/settlements')
      .set('X-Internal-Service', 'orders-service')
      .send({ settlementId: 'settlement-123', merchantId: 'merchant-123', amount: 9400, currency: 'USD' });

    expect(response.status).toBe(201);
    expect(settle).toHaveBeenCalledWith(expect.objectContaining({ amount: 9400 }));
  });
});
