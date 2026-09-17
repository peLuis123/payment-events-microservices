const {
  decidePayment
} = require('../services/paymentValidation.service');

describe('decidePayment', () => {
  test('approves a payment at or below the simulated limit', () => {
    expect(
      decidePayment({
        orderId: 'order-123',
        customerId: 'customer-456',
        amount: 1000,
        currency: 'USD'
      })
    ).toEqual({
      status: 'approved',
      reason: 'Payment accepted'
    });
  });

  test('rejects a payment above the simulated limit', () => {
    expect(
      decidePayment({
        orderId: 'order-123',
        customerId: 'customer-456',
        amount: 1000.01,
        currency: 'USD'
      })
    ).toEqual({
      status: 'rejected',
      reason: 'Amount exceeds simulated payment limit'
    });
  });
});
