const { validateOrderPayload } = require('../validators/order.validator');

describe('validateOrderPayload', () => {
  test('accepts a complete payment order', () => {
    const order = {
      orderId: 'order-123',
      customerId: 'customer-456',
      amount: 49.99,
      currency: 'USD'
    };

    expect(validateOrderPayload(order)).toEqual(order);
  });
});
