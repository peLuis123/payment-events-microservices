const { createProviderEventProcessor } = require('../services/provider-event.processor');

describe('provider event processing', () => {
  test('claims and publishes an event once', async () => {
    const claim = jest.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    const publish = jest.fn().mockResolvedValue({ MessageId: 'message-123' });
    const processor = createProviderEventProcessor({ claim, publish });
    const event = { provider: 'paypal', providerEventId: 'WH-123', eventType: 'payment.approved' };

    await expect(processor.process(event)).resolves.toEqual({ status: 'published', providerEventId: 'WH-123' });
    await expect(processor.process(event)).resolves.toEqual({ status: 'duplicate', providerEventId: 'WH-123' });
    expect(publish).toHaveBeenCalledTimes(1);
  });
});
