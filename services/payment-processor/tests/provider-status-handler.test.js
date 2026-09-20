const { createProviderStatusHandler } = require('../src/provider-status-handler');

describe('provider status handler', () => {
  test('processes a payment status event from SNS', async () => {
    const processStatus = jest.fn().mockResolvedValue({
      status: 'saved',
      providerEventId: 'WH-123'
    });
    const handler = createProviderStatusHandler({ processStatus });
    const message = JSON.stringify({
      eventId: 'event-123',
      provider: 'paypal',
      providerEventId: 'WH-123',
      eventType: 'payment.approved',
      data: { orderId: 'order-123', providerPaymentId: 'capture-123' }
    });

    await expect(handler({
      Records: [{ Sns: { MessageId: 'sns-123', Message: message } }]
    })).resolves.toEqual({ batchItemFailures: [] });
    expect(processStatus).toHaveBeenCalledWith(JSON.parse(message));
  });
});
