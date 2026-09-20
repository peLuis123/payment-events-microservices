const request = require('supertest');
const express = require('express');
const { createPaymentInternalRoute } = require('../routes/payment.internal.route');

describe('GET /internal/payments/:paymentId', () => {
  test('returns a payment by id for orders-service', async () => {
    const getPayment = jest.fn().mockResolvedValue({
      paymentId: 'payment-123',
      status: 'approved',
      provider: 'paypal'
    });
    const app = express();
    app.use(createPaymentInternalRoute({ getPayment }));

    const response = await request(app)
      .get('/internal/payments/payment-123')
      .set('X-Internal-Service', 'orders-service');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      paymentId: 'payment-123',
      status: 'approved',
      provider: 'paypal'
    });
    expect(getPayment).toHaveBeenCalledWith('payment-123');
  });

  test('returns not found when the payment does not exist', async () => {
    const app = express();
    app.use(createPaymentInternalRoute({ getPayment: jest.fn().mockResolvedValue(undefined) }));

    const response = await request(app)
      .get('/internal/payments/missing')
      .set('X-Internal-Service', 'orders-service');

    expect(response.status).toBe(404);
  });
});
