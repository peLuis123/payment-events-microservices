/**
 * Creates a structured log notifier.
 *
 * @param {{ logger: { info: Function } }} dependencies - Logger dependency.
 * @returns {{ notify: Function }} Notification adapter.
 */
function createLogNotifier({ logger }) {
  /**
   * Logs only safe notification fields.
   *
   * @param {{ eventId: string, data: { status: string } }} event - Validated event.
   * @returns {Promise<void>} Completed notification promise.
   */
  async function notify(event) {
    logger.info(
      { eventId: event.eventId, status: event.data.status },
      'Payment notification sent'
    );
  }

  return { notify };
}

module.exports = { createLogNotifier };
