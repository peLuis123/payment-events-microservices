const { createLogger } = require('../middlewares/logger');

describe('createLogger', () => {
  test('writes structured JSON with event context', () => {
    const write = jest.fn();
    const logger = createLogger({ service: 'payment-processor', write });

    logger.info({ eventId: 'event-123' }, 'Payment message received');

    const entry = JSON.parse(write.mock.calls[0][0]);
    expect(entry).toMatchObject({
      eventId: 'event-123',
      service: 'payment-processor',
      level: 'info',
      message: 'Payment message received'
    });
    expect(entry.timestamp).toEqual(expect.any(String));
    expect(entry).not.toHaveProperty('payload');
  });
});
