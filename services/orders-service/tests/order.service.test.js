const { createOrderService } = require('../services/order.service');

describe('createOrderService', () => {
  test('creates and publishes a payment event for a validated order', async () => {
    const publishEvent = jest.fn().mockResolvedValue({
      MessageId: 'message-123'
    });
    const service = createOrderService({
      publishEvent,
      createEventId: () => 'event-123',
      now: () => new Date('2026-09-16T23:00:00.000Z')
    });
    const order = {
      orderId: 'order-123',
      customerId: 'customer-456',
      amount: 49.99,
      currency: 'USD'
    };

    const result = await service.createOrder(order);

    expect(result).toEqual({ eventId: 'event-123' });
    expect(publishEvent).toHaveBeenCalledWith({
      eventId: 'event-123',
      eventType: 'payment.requested',
      source: 'orders-service',
      occurredAt: '2026-09-16T23:00:00.000Z',
      data: order
    });
  });
});
