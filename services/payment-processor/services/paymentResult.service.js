/**
 * Creates an event describing a processed payment result.
 *
 * @param {{ eventId: string, order: object, payment: { status: string, reason: string }, occurredAt: string }} input - Result data.
 * @returns {object} Payment result event.
 */
function createPaymentResultEvent({ eventId, order, payment, occurredAt }) {
  return {
    eventId,
    eventType: `payment.${payment.status}`,
    source: 'payment-processor',
    occurredAt,
    data: {
      orderId: order.orderId,
      status: payment.status,
      reason: payment.reason
    }
  };
}

module.exports = { createPaymentResultEvent };
