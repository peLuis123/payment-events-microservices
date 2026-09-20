const { createPaymentStatusService } = require('../services/paymentStatus.service');
const { createPaymentRepository } = require('../repositories/payment.repository');

describe('payment status persistence', () => {
  test('persists webhook status changes through the Payments repository', async () => {
    const client = { send: jest.fn().mockResolvedValue({}) };
    const repository = createPaymentRepository({ client, tableName: 'Payments' });
    const service = createPaymentStatusService({ savePayment: repository.save });

    const result = await service.process({
      eventId: 'evt-paypal-123',
      provider: 'paypal',
      providerEventId: 'WH-paypal-123',
      eventType: 'payment.approved',
      data: {
        orderId: 'order-123',
        providerPaymentId: 'capture-123'
      }
    });

    expect(result).toEqual({ status: 'saved', providerEventId: 'WH-paypal-123' });
    expect(client.send).toHaveBeenCalledTimes(1);
  });
});
