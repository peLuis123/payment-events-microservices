/**
 * Creates the event published when an order requests payment.
 *
 * The order must already be validated by the input validator before reaching
 * this pure business function.
 *
 * @param {{ orderId: string, customerId: string, amount: number, currency: string }} order - Validated order.
 * @param {{ eventId: string, occurredAt: string }} metadata - Event metadata.
 * @returns {{ eventId: string, eventType: string, source: string, occurredAt: string, data: object }} Payment event.
 */
function createPaymentEvent(order, { eventId, occurredAt }) {
  return {
    eventId,
    eventType: 'payment.requested',
    source: 'orders-service',
    occurredAt,
    data: { ...order }
  };
}

module.exports = {
  createPaymentEvent
};
