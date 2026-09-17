const { createPaymentResultEvent } = require('../services/paymentResult.service');

describe('createPaymentResultEvent', () => {
  test.each([
    ['approved', 'payment.approved'],
    ['rejected', 'payment.rejected']
  ])('creates a %s payment result event', (status, eventType) => {
    expect(createPaymentResultEvent({
      eventId: 'event-123',
      order: { orderId: 'order-123', customerId: 'customer-456', amount: 10, currency: 'USD' },
      payment: { status, reason: 'Payment result' },
      occurredAt: '2026-09-16T23:00:00.000Z'
    })).toEqual({
      eventId: 'event-123',
      eventType,
      source: 'payment-processor',
      occurredAt: '2026-09-16T23:00:00.000Z',
      data: { orderId: 'order-123', status, reason: 'Payment result' }
    });
  });
});
