const { createPaymentEvent } = require('../services/payment-event.service');

describe('createPaymentEvent', () => {
  test('creates a payment requested event from a valid order', () => {
    const order = {
      orderId: 'order-123',
      customerId: 'customer-456',
      amount: 49.99,
      currency: 'USD'
    };

    expect(
      createPaymentEvent(order, {
        eventId: 'event-123',
        occurredAt: '2026-09-16T23:00:00.000Z'
      })
    ).toEqual({
      eventId: 'event-123',
      eventType: 'payment.requested',
      source: 'orders-service',
      occurredAt: '2026-09-16T23:00:00.000Z',
      data: order
    });
  });
});
