const { PutCommand } = require('@aws-sdk/lib-dynamodb');
const { createOrderRepository } = require('../repositories/order.repository');

describe('createOrderRepository', () => {
  test('persists a payment result with sanitized keys', async () => {
    const client = { send: jest.fn().mockResolvedValue({}) };
    const repository = createOrderRepository({ client, tableName: 'Orders' });
    const result = await repository.savePaymentResult({
      eventId: 'event-123',
      order: {
        orderId: 'order-123',
        customerId: 'customer-456',
        amount: 49.99,
        currency: 'USD'
      },
      payment: { status: 'approved', reason: 'Payment accepted' }
    });

    expect(result).toEqual({ status: 'saved', eventId: 'event-123' });
    expect(client.send).toHaveBeenCalledWith(expect.any(PutCommand));
    expect(client.send.mock.calls[0][0].input.Item).toMatchObject({
      eventId: 'event-123',
      orderId: 'order-123',
      customerId: 'customer-456',
      status: 'approved'
    });
  });
});
