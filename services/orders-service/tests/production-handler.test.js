const { createProductionHandler } = require('../src/handler');

describe('createProductionHandler', () => {
  test('connects the HTTP order flow to the SQS publisher', async () => {
    const client = {
      send: jest.fn().mockResolvedValue({ MessageId: 'message-123' })
    };
    const logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };
    const handler = createProductionHandler({
      environment: {
        AWS_REGION: 'us-east-2',
        SQS_QUEUE_URL: 'https://sqs.us-east-2.amazonaws.com/123/payment-queue'
      },
      client,
      logger,
      createEventId: () => 'event-123',
      now: () => new Date('2026-09-16T23:00:00.000Z')
    });

    const result = await handler(
      {
        httpMethod: 'POST',
        path: '/orders',
        headers: { 'content-type': 'application/json' },
        multiValueHeaders: {},
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        pathParameters: null,
        stageVariables: null,
        requestContext: { requestId: 'request-123' },
        resource: '/orders',
        body: JSON.stringify({
          orderId: 'order-123',
          customerId: 'customer-456',
          amount: 49.99,
          currency: 'USD'
        }),
        isBase64Encoded: false
      },
      {}
    );

    expect(result.statusCode).toBe(202);
    expect(JSON.parse(result.body)).toEqual({
      message: 'Order accepted',
      eventId: 'event-123'
    });
    expect(client.send).toHaveBeenCalledTimes(1);
  });
});
