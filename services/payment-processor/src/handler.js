const { validateSqsMessage } = require('../validators/sqs-message.validator');
const { createEventErrorHandler } = require('../middlewares/event-error.wrapper');

/**
 * Creates the SQS Lambda handler.
 *
 * @param {{ processMessage: Function, logger?: object }} dependencies - Message processor and logger.
 * @returns {Function} SQS Lambda handler.
 */
function createSqsHandler({ processMessage, logger }) {
  const handleError = logger ? createEventErrorHandler({ logger }) : null;

  return async function handleSqsEvent(event) {
    for (const record of event.Records || []) {
      const processRecord = async () => processMessage(validateSqsMessage(record));
      if (handleError) {
        await handleError({ eventId: record.messageId }, processRecord);
      } else {
        await processRecord();
      }
    }

    return { batchItemFailures: [] };
  };
}

module.exports = { createSqsHandler };
