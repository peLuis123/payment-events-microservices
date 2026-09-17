const { createSnsHandler } = require('../src/handler');
const { createNotificationProcessor } = require('../services/notification.service');
const { createLogNotifier } = require('../notifiers/log.notifier');

function snsRecord(eventId, status = 'approved') {
  return {
    Sns: {
      MessageId: `sns-${eventId}`,
      Message: JSON.stringify({
        eventId,
        eventType: `payment.${status}`,
        source: 'payment-processor',
        occurredAt: '2026-09-16T23:00:00.000Z',
        data: {
          orderId: `order-${eventId}`,
          status,
          reason: `Payment ${status}`
        }
      })
    }
  };
}

describe('local SNS flow', () => {
  test('notifies a valid event and skips a duplicate', async () => {
    const ids = new Set();
    const logger = { info: jest.fn() };
    const notifier = createLogNotifier({ logger });
    const processor = createNotificationProcessor({
      notify: notifier.notify,
      hasNotified: async (eventId) => ids.has(eventId),
      markNotified: async (eventId) => ids.add(eventId)
    });
    const handler = createSnsHandler({
      processMessage: (event) => processor.process(event)
    });
    const record = snsRecord('event-1');

    await expect(handler({ Records: [record] })).resolves.toEqual({
      batchItemFailures: []
    });
    await expect(handler({ Records: [record] })).resolves.toEqual({
      batchItemFailures: []
    });

    expect(logger.info).toHaveBeenCalledTimes(1);
  });

  test('rejects malformed SNS messages before notifying', async () => {
    const processMessage = jest.fn();
    const handler = createSnsHandler({ processMessage });

    await expect(handler({
      Records: [{ Sns: { MessageId: 'sns-invalid', Message: '{invalid-json' } }]
    })).rejects.toThrow();
    expect(processMessage).not.toHaveBeenCalled();
  });

  test('processes rejected payment events locally', async () => {
    const processMessage = jest.fn().mockResolvedValue(undefined);
    const handler = createSnsHandler({ processMessage });

    await expect(handler({ Records: [snsRecord('event-2', 'rejected')] }))
      .resolves.toEqual({ batchItemFailures: [] });
    expect(processMessage.mock.calls[0][0].data.status).toBe('rejected');
  });
});
