const { createSqsHandler } = require('../src/handler');

describe('createSqsHandler', () => {
  const eventBody = (eventId) => JSON.stringify({
    eventId,
    eventType: 'payment.requested',
    source: 'orders-service',
    occurredAt: '2026-09-16T23:00:00.000Z',
    data: {
      orderId: 'order-123',
      customerId: 'customer-456',
      amount: 10,
      currency: 'USD'
    }
  });

  test('processes every valid SQS record', async () => {
    const processMessage = jest.fn().mockResolvedValue(undefined);
    const handler = createSqsHandler({ processMessage });
    const event = { Records: [{ messageId: 'message-1', body: eventBody('event-1') }, { messageId: 'message-2', body: eventBody('event-2') }] };

    await expect(handler(event)).resolves.toEqual({ batchItemFailures: [] });
    expect(processMessage).toHaveBeenCalledTimes(2);
  });

  test('rethrows processing failures so SQS can retry', async () => {
    const error = new Error('DynamoDB unavailable');
    const processMessage = jest.fn().mockRejectedValue(error);
    const handler = createSqsHandler({ processMessage });

    await expect(handler({ Records: [{ messageId: 'message-1', body: eventBody('event-1') }] })).rejects.toBe(error);
  });
});
