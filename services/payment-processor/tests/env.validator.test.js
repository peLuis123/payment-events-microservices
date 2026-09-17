const { loadEnvironment } = require('../validators/env.validator');

describe('loadEnvironment', () => {
  test('accepts the required processor variables', () => {
    expect(
      loadEnvironment({
        AWS_REGION: 'us-east-2',
        SQS_QUEUE_URL: 'https://sqs.us-east-2.amazonaws.com/123/payment-queue',
        DYNAMODB_TABLE: 'Orders',
        SNS_TOPIC_ARN: 'arn:aws:sns:us-east-2:123456789012:payment-events'
      })
    ).toEqual({
      AWS_REGION: 'us-east-2',
      SQS_QUEUE_URL: 'https://sqs.us-east-2.amazonaws.com/123/payment-queue',
      DYNAMODB_TABLE: 'Orders',
      SNS_TOPIC_ARN: 'arn:aws:sns:us-east-2:123456789012:payment-events'
    });
  });

  test('fails fast when a critical variable is missing', () => {
    expect(() =>
      loadEnvironment({
        AWS_REGION: 'us-east-2',
        SQS_QUEUE_URL: 'https://sqs.us-east-2.amazonaws.com/123/payment-queue',
        SNS_TOPIC_ARN: 'arn:aws:sns:us-east-2:123456789012:payment-events'
      })
    ).toThrow();
  });
});
