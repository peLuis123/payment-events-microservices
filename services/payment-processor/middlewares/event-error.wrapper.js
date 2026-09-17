class EventProcessingError extends Error {
  /**
   * Creates an expected event processing error.
   *
   * @param {string} message - Safe diagnostic message.
   */
  constructor(message) {
    super(message);
    this.name = 'EventProcessingError';
    this.isOperational = true;
  }
}

/**
 * Creates a consistent wrapper for SQS and SNS event processing.
 *
 * Errors are rethrown so AWS can retry the message and eventually route it to
 * the configured dead-letter queue.
 *
 * @param {{ logger: { warn: Function, error: Function } }} dependencies - Wrapper dependencies.
 * @returns {Function} Event processing wrapper.
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

module.exports = {
  EventProcessingError,
  createEventErrorHandler
};
