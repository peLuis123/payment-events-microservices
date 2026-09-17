const SIMULATED_PAYMENT_LIMIT = 1000;

/**
 * Decides whether a validated payment is approved by the simulator.
 *
 * @param {{ orderId: string, customerId: string, amount: number, currency: string }} payment - Validated payment.
 * @returns {{ status: 'approved'|'rejected', reason: string }} Payment decision.
 */
function decidePayment(payment) {
  if (payment.amount <= SIMULATED_PAYMENT_LIMIT) {
    return {
      status: 'approved',
      reason: 'Payment accepted'
    };
  }

  return {
    status: 'rejected',
    reason: 'Amount exceeds simulated payment limit'
  };
}

module.exports = {
  SIMULATED_PAYMENT_LIMIT,
  decidePayment
};
