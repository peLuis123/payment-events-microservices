/**
 * Creates an idempotent payment processor.
 *
 * The persistence implementation is injected so production can use DynamoDB
 * while tests can use an in-memory or mocked repository.
 *
 * @param {{ processPayment: Function, hasProcessed: Function, markProcessed: Function }} dependencies - Processing dependencies.
 * @returns {{ process: Function }} Idempotent processor.
 */
function createPaymentProcessor({
  processPayment,
  hasProcessed,
  markProcessed
}) {
  /**
   * Processes an event once and skips duplicate deliveries.
   *
   * @param {{ eventId: string, data: object }} event - Validated payment event.
   * @returns {Promise<object>} Payment result or duplicate marker.
   * @throws {Error} When payment processing fails.
   */
  async function process(event) {
    if (await hasProcessed(event.eventId)) {
      return {
        status: 'duplicate',
        eventId: event.eventId
      };
    }

    const result = await processPayment(event.data);
    await markProcessed(event.eventId);
    return result;
  }

  return {
    process
  };
}

module.exports = {
  createPaymentProcessor
};
