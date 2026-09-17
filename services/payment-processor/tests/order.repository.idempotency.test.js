const { ConditionalCheckFailedException } = require('@aws-sdk/client-dynamodb');
const { createOrderRepository } = require('../repositories/order.repository');

describe('order repository idempotency', () => {
  test('returns a duplicate result when DynamoDB rejects a repeated event', async () => {
    const client = {
      send: jest.fn().mockRejectedValue(
        new ConditionalCheckFailedException({ message: 'duplicate' })
      )
    };
    const repository = createOrderRepository({ client, tableName: 'Orders' });

    await expect(repository.savePaymentResult({
      eventId: 'event-123',
      order: { orderId: 'order-123', customerId: 'customer-456', amount: 10, currency: 'USD' },
      payment: { status: 'approved', reason: 'Payment accepted' }
    })).resolves.toEqual({ status: 'duplicate', eventId: 'event-123' });
  });
});
