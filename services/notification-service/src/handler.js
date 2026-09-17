const { validateSnsEnvelope } = require('../validators/sns-envelope.validator');
const { validatePaymentEvent } = require('../validators/payment-event.validator');
const { createEventErrorHandler } = require('../middlewares/event-error.wrapper');

/**
 * Creates the SNS Lambda handler.
 *
 * @param {{ processMessage: Function, logger?: object }} dependencies - Message processor and logger.
 * @returns {Function} SNS Lambda handler.
 */
function createSnsHandler({ processMessage, logger }) {
  const handleError = logger ? createEventErrorHandler({ logger }) : null;

  return async function handleSnsEvent(event) {
    for (const record of event.Records || []) {
      const processRecord = async () => {
        const envelope = validateSnsEnvelope(record);
        return processMessage(validatePaymentEvent(envelope.message));
      };
      if (handleError) {
        await handleError({ eventId: record.Sns?.MessageId }, processRecord);
      } else {
        await processRecord();
      }
    }

    return { batchItemFailures: [] };
  };
}

module.exports = { createSnsHandler };
