const { loadEnvironment } = require('../validators/env.validator');

describe('loadEnvironment', () => {
  test('accepts the required orders service variables', () => {
    expect(
      loadEnvironment({
        AWS_REGION: 'us-east-2',
        SQS_QUEUE_URL: 'https://sqs.us-east-2.amazonaws.com/123/payment-queue',
        PAYMENT_PROCESSOR_CHECKOUT_URL: 'https://processor.example.com'
      })
    ).toEqual({
      AWS_REGION: 'us-east-2',
      SQS_QUEUE_URL: 'https://sqs.us-east-2.amazonaws.com/123/payment-queue',
      PAYMENT_PROCESSOR_CHECKOUT_URL: 'https://processor.example.com'
    });
  });

  test('rejects startup when a critical variable is missing', () => {
    expect(() =>
      loadEnvironment({
        AWS_REGION: 'us-east-2'
      })
    ).toThrow();
  });
});
