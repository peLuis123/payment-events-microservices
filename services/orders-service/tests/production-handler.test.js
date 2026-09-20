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
        SQS_QUEUE_URL: 'https://sqs.us-east-2.amazonaws.com/123/payment-queue',
        PAYMENT_PROCESSOR_CHECKOUT_URL: 'https://processor.example.com'
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

  test('connects the checkout flow to the payment processor', async () => {
    const client = { send: jest.fn().mockResolvedValue({ MessageId: 'message-123' }) };
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        checkoutId: 'checkout-123',
        checkoutUrl: 'https://paypal.test/checkout',
        paymentId: 'payment-123'
      })
    });
    const handler = createProductionHandler({
      environment: {
        AWS_REGION: 'us-east-2',
        SQS_QUEUE_URL: 'https://sqs.us-east-2.amazonaws.com/123/payment-queue',
        PAYMENT_PROCESSOR_CHECKOUT_URL: 'https://processor.example.com'
      },
      client,
      fetchImpl,
      createCheckoutId: () => 'checkout-123',
      createPaymentId: () => 'payment-123'
    });

    const result = await handler({
      httpMethod: 'POST',
      path: '/checkout/sessions',
      headers: {
        'content-type': 'application/json',
        'x-merchant-id': 'merchant-123',
        'idempotency-key': 'checkout-request-123'
      },
      multiValueHeaders: {},
      queryStringParameters: null,
      multiValueQueryStringParameters: null,
      pathParameters: null,
      stageVariables: null,
      requestContext: { requestId: 'request-123' },
      resource: '/checkout/sessions',
      body: JSON.stringify({
        paymentProvider: 'paypal',
        items: [{ productId: 'product-123', quantity: 1, unitAmount: 4999 }],
        currency: 'USD',
        successUrl: 'https://frontend.test/success',
        cancelUrl: 'https://frontend.test/cancel',
        externalReference: 'cart-123'
      }),
      isBase64Encoded: false
    }, {});

    expect(result.statusCode).toBe(201);
    expect(JSON.parse(result.body)).toEqual({
      checkoutId: 'checkout-123',
      checkoutUrl: 'https://paypal.test/checkout',
      paymentId: 'payment-123',
      status: 'pending'
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
