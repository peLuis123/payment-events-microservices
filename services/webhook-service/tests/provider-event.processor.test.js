const {
  createProviderEventProcessor
} = require('../services/provider-event.processor');

describe('createProviderEventProcessor', () => {
  test('claims and publishes a provider event only once', async () => {
    const claim = jest.fn()
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    const publish = jest.fn().mockResolvedValue({ MessageId: 'message-123' });
    const processor = createProviderEventProcessor({ claim, publish });
    const event = {
      provider: 'paypal',
      providerEventId: 'WH-123',
      eventType: 'payment.approved'
    };

    await expect(processor.process(event)).resolves.toEqual({
      status: 'published',
      providerEventId: 'WH-123'
    });
    await expect(processor.process(event)).resolves.toEqual({
      status: 'duplicate',
      providerEventId: 'WH-123'
    });

    expect(claim).toHaveBeenCalledTimes(2);
    expect(publish).toHaveBeenCalledTimes(1);
  });
});
