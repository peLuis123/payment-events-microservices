const { createPaymentEventPublisher } = require('../services/event.publisher');

describe('payment event publisher', () => {
  test('publishes mapped provider state changes', async () => {
    const publish = jest.fn().mockResolvedValue({ MessageId: 'message-123' });
    const publisher = createPaymentEventPublisher({ publish });
    const event = { eventId: 'evt_123', eventType: 'payment.approved' };
    await expect(publisher.publish(event)).resolves.toEqual({ MessageId: 'message-123' });
    expect(publish).toHaveBeenCalledWith(event);
  });
});
