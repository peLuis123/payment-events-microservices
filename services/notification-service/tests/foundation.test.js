const { loadEnvironment } = require('../validators/env.validator');
const { createLogger } = require('../middlewares/logger');
const {
  createEventErrorHandler,
  NotificationProcessingError
} = require('../middlewares/event-error.wrapper');

describe('notification foundation', () => {
  test('validates the required environment', () => {
    expect(loadEnvironment({
      AWS_REGION: 'us-east-2',
      SNS_TOPIC_ARN: 'arn:aws:sns:us-east-2:123456789012:payment-events'
    })).toEqual({
      AWS_REGION: 'us-east-2',
      SNS_TOPIC_ARN: 'arn:aws:sns:us-east-2:123456789012:payment-events'
    });
  });

  test('writes structured event logs', () => {
    const write = jest.fn();
    const logger = createLogger({ service: 'notification-service', write });
    logger.info({ eventId: 'event-123' }, 'Notification received');
    const entry = JSON.parse(write.mock.calls[0][0]);
    expect(entry).toMatchObject({
      eventId: 'event-123',
      service: 'notification-service',
      level: 'info',
      message: 'Notification received'
    });
  });

  test('logs and rethrows errors for SNS retries', async () => {
    const logger = { warn: jest.fn(), error: jest.fn() };
    const handler = createEventErrorHandler({ logger });
    const error = new NotificationProcessingError('Invalid notification');
    await expect(handler({ eventId: 'event-123' }, () => { throw error; }))
      .rejects.toBe(error);
    expect(logger.warn).toHaveBeenCalledWith(
      { eventId: 'event-123' },
      'Invalid notification'
    );
  });
});
