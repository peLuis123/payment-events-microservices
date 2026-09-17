const { createSnsHandler } = require('../src/handler');

describe('createSnsHandler', () => {
  test('validates and processes SNS records', async () => {
    const processMessage = jest.fn().mockResolvedValue(undefined);
    const handler = createSnsHandler({ processMessage });
    const message = JSON.stringify({
      eventId: 'event-123', eventType: 'payment.approved', source: 'payment-processor',
      occurredAt: '2026-09-16T23:00:00.000Z',
      data: { orderId: 'order-123', status: 'approved', reason: 'Payment accepted' }
    });

    await expect(handler({ Records: [{ EventSubscriptionArn: 'arn:sub', Sns: { MessageId: 'sns-123', Message: message } }] }))
      .resolves.toEqual({ batchItemFailures: [] });
    expect(processMessage).toHaveBeenCalledTimes(1);
  });

  test('rethrows processing failures for SNS retry', async () => {
    const error = new Error('Notifier unavailable');
    const handler = createSnsHandler({ processMessage: jest.fn().mockRejectedValue(error) });
    const message = JSON.stringify({
      eventId: 'event-123', eventType: 'payment.approved', source: 'payment-processor',
      occurredAt: '2026-09-16T23:00:00.000Z',
      data: { orderId: 'order-123', status: 'approved', reason: 'Payment accepted' }
    });

    await expect(handler({ Records: [{ Sns: { MessageId: 'sns-123', Message: message } }] })).rejects.toBe(error);
  });
});
