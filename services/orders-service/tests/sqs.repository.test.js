const { SendMessageCommand } = require('@aws-sdk/client-sqs');
const { createSqsRepository } = require('../repositories/sqs.repository');

describe('createSqsRepository', () => {
  test('publishes a payment event to the configured queue', async () => {
    const client = {
      send: jest.fn().mockResolvedValue({ MessageId: 'message-123' })
    };
    const repository = createSqsRepository({
      client,
      queueUrl: 'https://sqs.us-east-2.amazonaws.com/123/payment-queue'
    });
    const event = {
      eventId: 'event-123',
      eventType: 'payment.requested',
      source: 'orders-service',
      occurredAt: '2026-09-16T23:00:00.000Z',
      data: {
        orderId: 'order-123',
        customerId: 'customer-456',
        amount: 49.99,
        currency: 'USD'
      }
    };

    const result = await repository.publish(event);

    expect(result).toEqual({ MessageId: 'message-123' });
    expect(client.send).toHaveBeenCalledTimes(1);
    expect(client.send).toHaveBeenCalledWith(expect.any(SendMessageCommand));
    expect(client.send.mock.calls[0][0].input).toEqual({
      QueueUrl: 'https://sqs.us-east-2.amazonaws.com/123/payment-queue',
      MessageBody: JSON.stringify(event)
    });
  });
});
