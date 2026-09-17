class NotificationProcessingError extends Error {
  /**
   * Creates an expected notification processing error.
   *
   * @param {string} message - Safe diagnostic message.
   */
  constructor(message) {
    super(message);
    this.name = 'NotificationProcessingError';
    this.isOperational = true;
  }
}

/**
 * Creates an SNS event error wrapper that preserves retries.
 *
 * @param {{ logger: { warn: Function, error: Function } }} dependencies - Wrapper dependencies.
 * @returns {Function} Event wrapper.
 */
function createEventErrorHandler({ logger }) {
  return async function handleEvent(event, processEvent) {
    const context = { eventId: event.eventId };

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

module.exports = { NotificationProcessingError, createEventErrorHandler };
