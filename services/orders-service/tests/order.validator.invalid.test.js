const { validateOrderPayload } = require('../validators/order.validator');

const validOrder = {
  orderId: 'order-123',
  customerId: 'customer-456',
  amount: 49.99,
  currency: 'USD'
};

describe('validateOrderPayload', () => {
  test.each([
    ['rejects a negative amount', { amount: -1 }],
    ['rejects a zero amount', { amount: 0 }],
    ['rejects a currency with the wrong format', { currency: 'dollars' }],
    ['rejects a missing order identifier', { orderId: undefined }]
  ])('%s', (_, override) => {
    expect(() =>
      validateOrderPayload({ ...validOrder, ...override })
    ).toThrow();
  });
});
