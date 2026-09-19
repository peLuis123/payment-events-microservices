class WebhookProcessingError extends Error {
  /**
   * Creates an expected webhook processing error.
   *
   * @param {string} message - Safe diagnostic message.
   */
  constructor(message) {
    super(message);
    this.name = 'WebhookProcessingError';
    this.isOperational = true;
  }
}

/**
 * Creates a retry-preserving wrapper for webhook processing.
 *
 * @param {{ logger: { warn: Function, error: Function } }} dependencies - Wrapper dependencies.
 * @returns {Function} Webhook processing wrapper.
 */
function createEventErrorHandler({ logger }) {
  return async function handleEvent(event, processEvent) {
    const context = { providerEventId: event.providerEventId };

    try {
      return await processEvent(event);
    } catch (error) {
      if (error.isOperational) {
        logger.warn(context, error.message);
      } else {
        logger.error(context, error.stack || error.message);
      }
      throw error;
    }
  };
}

module.exports = { WebhookProcessingError, createEventErrorHandler };
