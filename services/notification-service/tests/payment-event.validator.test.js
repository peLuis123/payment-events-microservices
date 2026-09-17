const { validatePaymentEvent } = require('../validators/payment-event.validator');

describe('validatePaymentEvent', () => {
  const event = {
    eventId: 'event-123',
    eventType: 'payment.approved',
    source: 'payment-processor',
    occurredAt: '2026-09-16T23:00:00.000Z',
    data: { orderId: 'order-123', status: 'approved', reason: 'Payment accepted' }
  };

  test('accepts approved and rejected payment events', () => {
    expect(validatePaymentEvent(JSON.stringify(event))).toEqual(event);
    expect(validatePaymentEvent(JSON.stringify({
      ...event,
      eventType: 'payment.rejected',
      data: { ...event.data, status: 'rejected' }
    })).data.status).toBe('rejected');
  });

  test('rejects malformed or unsupported payment events', () => {
    expect(() => validatePaymentEvent('{invalid-json')).toThrow();
    expect(() => validatePaymentEvent(JSON.stringify({ ...event, eventType: 'payment.unknown' }))).toThrow();
  });
});
