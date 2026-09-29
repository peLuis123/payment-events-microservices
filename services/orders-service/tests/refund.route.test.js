const request = require('supertest');
const { createApp } = require('../src/app');

describe('POST /refunds', () => {
  test('creates a refund through the payment processor', async () => {
    const paymentClient = {
      getPayment: jest.fn().mockResolvedValue({ merchantId: 'merchant-123' }),
      createRefund: jest.fn().mockResolvedValue({
        refundId: 'refund-123',
        providerRefundId: 'provider-refund-123',
        status: 'COMPLETED',
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
      .post('/refunds')
      .query({ merchantId: 'merchant-123' })
      .set('Idempotency-Key', 'refund-123')
      .send({ paymentId: 'capture-123', amount: 5799, currency: 'USD' });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe('COMPLETED');
    expect(paymentClient.createRefund).toHaveBeenCalledWith({
      paymentId: 'capture-123',
      amount: 5799,
      currency: 'USD',
      idempotencyKey: 'refund-123',
    });
  });
});
