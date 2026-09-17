const { validateSnsEnvelope } = require('../validators/sns-envelope.validator');
const { validatePaymentEvent } = require('../validators/payment-event.validator');
const { createEventErrorHandler } = require('../middlewares/event-error.wrapper');
const { createLogger } = require('../middlewares/logger');
const { createLogNotifier } = require('../notifiers/log.notifier');
const { createNotificationProcessor } = require('../services/notification.service');

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

/**
 * Creates the production SNS handler.
 *
 * @param {{ logger?: object }} dependencies - Runtime dependencies.
 * @returns {Function} Configured SNS Lambda handler.
 */
function createProductionHandler({ logger = createLogger({ service: 'notification-service' }) } = {}) {
  const notifiedEventIds = new Set();
  const notifier = createLogNotifier({ logger });
  const processor = createNotificationProcessor({
    notify: notifier.notify,
    hasNotified: async (eventId) => notifiedEventIds.has(eventId),
    markNotified: async (eventId) => notifiedEventIds.add(eventId)
  });

  return createSnsHandler({
    logger,
    processMessage: (event) => processor.process(event)
  });
}

let productionHandler;

/**
 * AWS Lambda entry point for SNS notifications.
 *
 * @param {object} event - SNS Lambda event.
 * @param {object} context - Lambda execution context.
 * @returns {Promise<object>} SNS processing result.
 */
async function handler(event, context) {
  productionHandler ??= createProductionHandler();
  return productionHandler(event, context);
}

module.exports = { createSnsHandler, createProductionHandler, handler };
