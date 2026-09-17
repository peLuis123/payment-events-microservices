const {
  createPaymentProcessor
} = require('../services/paymentProcessing.service');

describe('createPaymentProcessor', () => {
  test('does not process the same event twice', async () => {
    const processPayment = jest.fn().mockResolvedValue({
      status: 'approved',
      reason: 'Payment accepted'
    });
    const processedEventIds = new Set();
    const processor = createPaymentProcessor({
      processPayment,
      hasProcessed: async (eventId) => processedEventIds.has(eventId),
      markProcessed: async (eventId) => processedEventIds.add(eventId)
    });
    const event = {
      eventId: 'event-123',
      data: {
        orderId: 'order-123',
        customerId: 'customer-456',
        amount: 49.99,
        currency: 'USD'
      }
    };

    const firstResult = await processor.process(event);
    const duplicateResult = await processor.process(event);

    expect(firstResult).toEqual({
      status: 'approved',
      reason: 'Payment accepted'
    });
    expect(duplicateResult).toEqual({
      status: 'duplicate',
      eventId: 'event-123'
    });
    expect(processPayment).toHaveBeenCalledTimes(1);
  });
});
