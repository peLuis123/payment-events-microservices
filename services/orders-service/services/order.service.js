const { randomUUID } = require('node:crypto');
const { createPaymentEvent } = require('./payment-event.service');

/**
 * Creates the order application service.
 *
 * @param {{ publishEvent: Function, createEventId?: Function, now?: Function }} dependencies - Service dependencies.
 * @returns {{ createOrder: Function }} Order service.
 */
function createOrderService({
  publishEvent,
  createEventId = randomUUID,
  now = () => new Date()
}) {
  /**
   * Creates and publishes a payment event for a validated order.
   *
   * @param {{ orderId: string, customerId: string, amount: number, currency: string }} order - Validated order.
   * @returns {Promise<{ eventId: string }>} Created event identifier.
   * @throws {Error} When event publication fails.
   */
  async function createOrder(order) {
    const event = createPaymentEvent(order, {
      eventId: createEventId(),
      occurredAt: now().toISOString()
    });

    await publishEvent(event);
    return { eventId: event.eventId };
  }

  return {
    createOrder
  };
}

module.exports = {
  createOrderService
};
