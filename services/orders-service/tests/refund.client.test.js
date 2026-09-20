const { createPaymentProcessorClient } = require('../clients/payment-processor.client');

describe('payment processor refund client', () => {
  test('creates a refund through the processor', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ refundId: 'refund-123', status: 'COMPLETED' })
    });
    const client = createPaymentProcessorClient({
      baseUrl: 'https://processor.example.com',
      fetchImpl
    });

    await expect(client.createRefund({
      paymentId: 'capture-123',
      amount: 5799,
      currency: 'USD',
      idempotencyKey: 'refund-123'
    })).resolves.toEqual({ refundId: 'refund-123', status: 'COMPLETED' });
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://processor.example.com/internal/refunds',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'X-Internal-Service': 'orders-service',
          'Idempotency-Key': 'refund-123'
        })
      })
    );
  });
});
