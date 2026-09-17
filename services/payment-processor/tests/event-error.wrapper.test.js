const {
  createEventErrorHandler,
  EventProcessingError
} = require('../middlewares/event-error.wrapper');

describe('createEventErrorHandler', () => {
  test('logs and rethrows an unexpected error for retry', async () => {
    const logger = { warn: jest.fn(), error: jest.fn() };
    const handler = createEventErrorHandler({ logger });
    const error = new Error('DynamoDB unavailable');

    await expect(
      handler({ eventId: 'event-123' }, () => {
        throw error;
      })
    ).rejects.toBe(error);

    expect(logger.error).toHaveBeenCalledWith(
      { eventId: 'event-123' },
      error.stack
    );
  });

  test('logs expected processing errors as warnings and rethrows them', async () => {
    const logger = { warn: jest.fn(), error: jest.fn() };
    const handler = createEventErrorHandler({ logger });
    const error = new EventProcessingError('Invalid payment event');

    await expect(
      handler({ eventId: 'event-456' }, () => {
        throw error;
      })
    ).rejects.toBe(error);

    expect(logger.warn).toHaveBeenCalledWith(
      { eventId: 'event-456' },
      'Invalid payment event'
    );
    expect(logger.error).not.toHaveBeenCalled();
  });
});
