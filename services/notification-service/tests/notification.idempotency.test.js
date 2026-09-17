const { createNotificationProcessor } = require('../services/notification.service');

describe('createNotificationProcessor', () => {
  test('does not notify the same event twice', async () => {
    const notify = jest.fn().mockResolvedValue(undefined);
    const ids = new Set();
    const processor = createNotificationProcessor({
      notify,
      hasNotified: async (id) => ids.has(id),
      markNotified: async (id) => ids.add(id)
    });
    const event = { eventId: 'event-123', data: { status: 'approved' } };

    await expect(processor.process(event)).resolves.toEqual({ status: 'notified', eventId: 'event-123' });
    await expect(processor.process(event)).resolves.toEqual({ status: 'duplicate', eventId: 'event-123' });
    expect(notify).toHaveBeenCalledTimes(1);
  });
});
