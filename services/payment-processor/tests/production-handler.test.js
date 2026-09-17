const { createProductionHandler } = require('../src/handler');

function eventBody() {
  return JSON.stringify({
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
  });
}

describe('createProductionHandler', () => {
  test('processes SQS events, persists results, and publishes SNS events', async () => {
    const dynamodbClient = { send: jest.fn()
      .mockResolvedValueOnce({ Item: undefined })
      .mockResolvedValueOnce({}) };
    const snsClient = { send: jest.fn().mockResolvedValue({ MessageId: 'sns-123' }) };
    const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
    const handler = createProductionHandler({
      environment: {
        AWS_REGION: 'us-east-2',
        SQS_QUEUE_URL: 'https://sqs.us-east-2.amazonaws.com/123/payment-queue',
        DYNAMODB_TABLE: 'Orders',
        SNS_TOPIC_ARN: 'arn:aws:sns:us-east-2:123456789012:payment-events'
      },
      dynamodbClient,
      snsClient,
      logger,
      now: () => new Date('2026-09-16T23:00:00.000Z')
    });

    const result = await handler({
      Records: [{ messageId: 'message-123', body: eventBody() }]
    });

    expect(result).toEqual({ batchItemFailures: [] });
    expect(dynamodbClient.send).toHaveBeenCalledTimes(2);
    expect(snsClient.send).toHaveBeenCalledTimes(1);
  });
});
