const request = require('supertest');
const { createApp } = require('../src/app');

describe('GET /payments/:paymentId', () => {
  test('returns the payment status from the processor', async () => {
    const paymentClient = {
      getPayment: jest.fn().mockResolvedValue({
        paymentId: 'payment-123',
        status: 'approved',
        provider: 'paypal'
      })
    };
    const app = createApp({
      orderService: { createOrder: jest.fn() },
      paymentClient,
      logger: { warn: jest.fn(), error: jest.fn() }
    });

    const response = await request(app)
      .get('/payments/payment-123')
      .set('X-Merchant-Id', 'merchant-123');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      paymentId: 'payment-123',
      status: 'approved',
      provider: 'paypal'
    });
    expect(paymentClient.getPayment).toHaveBeenCalledWith('payment-123');
  });
});
