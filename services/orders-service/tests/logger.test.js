const { createLogger } = require('../middlewares/logger');

describe('createLogger', () => {
  test('writes structured JSON with request context', () => {
    const write = jest.fn();
    const logger = createLogger({ service: 'orders-service', write });

    logger.info({ requestId: 'request-123' }, 'Order received');

    expect(write).toHaveBeenCalledTimes(1);

    const entry = JSON.parse(write.mock.calls[0][0]);
    expect(entry).toMatchObject({
      requestId: 'request-123',
      service: 'orders-service',
      level: 'info',
      message: 'Order received'
    });
    expect(entry.timestamp).toEqual(expect.any(String));
  });

  test('supports event context for asynchronous processing', () => {
    const write = jest.fn();
    const logger = createLogger({ service: 'orders-service', write });

    logger.error({ eventId: 'event-456' }, 'Payment event failed');

    const entry = JSON.parse(write.mock.calls[0][0]);
    expect(entry).toMatchObject({
      eventId: 'event-456',
      service: 'orders-service',
      level: 'error',
      message: 'Payment event failed'
    });
  });

  test('writes a friendly local message when pretty mode is enabled', () => {
    const write = jest.fn();
    const logger = createLogger({
      service: 'orders-service',
      pretty: true,
      write
    });

    logger.info({ port: 3000 }, 'Orders service is running');

    expect(write).toHaveBeenCalledWith(
      '[orders-service] Orders service is running on http://localhost:3000'
    );
  });
});
