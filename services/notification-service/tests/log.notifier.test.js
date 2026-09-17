const { createLogNotifier } = require('../notifiers/log.notifier');

describe('createLogNotifier', () => {
  test('logs a safe payment notification without the full payload', async () => {
    const logger = { info: jest.fn() };
    const notifier = createLogNotifier({ logger });
    const event = {
      eventId: 'event-123',
      data: { orderId: 'order-123', status: 'approved', reason: 'Payment accepted' }
    };

    await notifier.notify(event);

    expect(logger.info).toHaveBeenCalledWith(
      { eventId: 'event-123', status: 'approved' },
      'Payment notification sent'
    );
    expect(logger.info.mock.calls[0][0]).not.toHaveProperty('data');
  });
});
