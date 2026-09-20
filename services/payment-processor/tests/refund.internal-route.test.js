const request = require('supertest');
const express = require('express');
const { createRefundInternalRoute } = require('../routes/refund.internal.route');

describe('POST /internal/refunds', () => {
  test('creates a refund for orders-service', async () => {
    const refund = jest.fn().mockResolvedValue({
      refundId: 'refund-123',
      providerRefundId: 'provider-refund-123',
      status: 'COMPLETED'
    });
    const app = express();
    app.use(express.json());
    app.use(createRefundInternalRoute({ refund }));

    const response = await request(app)
      .post('/internal/refunds')
      .set('X-Internal-Service', 'orders-service')
      .set('Idempotency-Key', 'refund-123')
      .send({ paymentId: 'capture-123', amount: 5799, currency: 'USD' });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      refundId: 'refund-123',
      providerRefundId: 'provider-refund-123',
      status: 'COMPLETED'
    });
    expect(refund).toHaveBeenCalledWith({
      paymentId: 'capture-123',
      amount: 5799,
      currency: 'USD',
      idempotencyKey: 'refund-123'
    });
  });
});
