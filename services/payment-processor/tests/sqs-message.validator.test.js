const { validateSqsMessage } = require('../validators/sqs-message.validator');

const validEvent = {
  eventId: 'event-123',
  eventType: 'payment.requested',
  source: 'orders-service',
  occurredAt: '2026-09-16T23:00:00.000Z',
  data: {
    orderId: 'order-123',
    customerId: 'customer-456',
    amount: 49.99,
    currency: 'USD'
  }
};

describe('validateSqsMessage', () => {
  test('parses and validates a payment message from SQS', () => {
    expect(validateSqsMessage({ body: JSON.stringify(validEvent) })).toEqual(
      validEvent
    );
  });

  test('rejects a malformed JSON message', () => {
    expect(() => validateSqsMessage({ body: '{invalid-json' })).toThrow();
  });

  test('rejects an event with an invalid payment payload', () => {
    const invalidEvent = {
      ...validEvent,
      data: { ...validEvent.data, amount: -10 }
    };

    expect(() =>
      validateSqsMessage({ body: JSON.stringify(invalidEvent) })
    ).toThrow();
  });
});
