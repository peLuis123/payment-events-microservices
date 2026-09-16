const { loadEnvironment } = require('../validators/env.validator');

describe('loadEnvironment', () => {
  test('accepts the required orders service variables', () => {
    expect(
      loadEnvironment({
        AWS_REGION: 'us-east-2',
        SQS_QUEUE_URL: 'https://sqs.us-east-2.amazonaws.com/123/payment-queue'
      })
    ).toEqual({
      AWS_REGION: 'us-east-2',
      SQS_QUEUE_URL: 'https://sqs.us-east-2.amazonaws.com/123/payment-queue'
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
