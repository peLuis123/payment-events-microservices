const { loadEnvironment } = require('../validators/env.validator');
const { createLogger } = require('../middlewares/logger');
const {
  createEventErrorHandler,
  WebhookProcessingError
} = require('../middlewares/event-error.wrapper');

describe('webhook foundation', () => {
  test('validates configuration references without provider secrets', () => {
    expect(loadEnvironment({
      AWS_REGION: 'us-east-2',
      NODE_ENV: 'test',
      PAYMENT_EVENTS_TOPIC_ARN: 'arn:aws:sns:us-east-2:123456789012:payment-events',
      STRIPE_WEBHOOK_SECRET_PARAM: '/payment-events/test/stripe/webhook-secret',
      PAYPAL_WEBHOOK_SECRET_PARAM: '/payment-events/test/paypal/webhook-secret'
    })).toMatchObject({
      AWS_REGION: 'us-east-2',
      STRIPE_WEBHOOK_SECRET_PARAM: '/payment-events/test/stripe/webhook-secret'
    });
  });

  test('writes provider event logs without a full payload', () => {
    const write = jest.fn();
    const logger = createLogger({ service: 'webhook-service', write });
    logger.info({ providerEventId: 'provider-event-123' }, 'Webhook received');
    const entry = JSON.parse(write.mock.calls[0][0]);
    expect(entry).toMatchObject({
      providerEventId: 'provider-event-123',
      service: 'webhook-service',
      level: 'info',
      message: 'Webhook received'
    });
    expect(entry).not.toHaveProperty('payload');
  });

  test('logs and rethrows webhook failures for retry', async () => {
    const logger = { warn: jest.fn(), error: jest.fn() };
    const handler = createEventErrorHandler({ logger });
    const error = new WebhookProcessingError('Invalid provider signature');

    await expect(handler({ providerEventId: 'provider-event-123' }, () => {
      throw error;
    })).rejects.toBe(error);
    expect(logger.warn).toHaveBeenCalledWith(
      { providerEventId: 'provider-event-123' },
      'Invalid provider signature'
    );
  });
});
