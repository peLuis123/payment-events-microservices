const { validateSqsMessage } = require('../validators/sqs-message.validator');
const { createEventErrorHandler } = require('../middlewares/event-error.wrapper');
const { createPaymentProcessor } = require('../services/paymentProcessing.service');
const { decidePayment } = require('../services/paymentValidation.service');
const { createPaymentResultEvent } = require('../services/paymentResult.service');
const { createOrderRepository } = require('../repositories/order.repository');
const { createSnsRepository } = require('../repositories/sns.repository');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { SNSClient } = require('@aws-sdk/client-sns');
const { loadEnvironment } = require('../validators/env.validator');

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

/**
 * Creates the production payment processor handler.
 *
 * @param {{ environment?: NodeJS.ProcessEnv, dynamodbClient?: object, snsClient?: object, logger?: object, now?: Function }} dependencies - Runtime dependencies.
 * @returns {Function} Configured SQS Lambda handler.
 */
function createProductionHandler({
  environment = process.env,
  dynamodbClient,
  snsClient,
  logger,
  now = () => new Date()
} = {}) {
  const config = loadEnvironment(environment);
  const dynamodb = dynamodbClient || DynamoDBDocumentClient.from(
    new DynamoDBClient({ region: config.AWS_REGION })
  );
  const sns = snsClient || new SNSClient({ region: config.AWS_REGION });
  const orderRepository = createOrderRepository({
    client: dynamodb,
    tableName: config.DYNAMODB_TABLE
  });
  const snsRepository = createSnsRepository({
    client: sns,
    topicArn: config.SNS_TOPIC_ARN
  });
  const processor = createPaymentProcessor({
    hasProcessed: orderRepository.hasProcessed,
    processPayment: decidePayment,
    persistResult: orderRepository.savePaymentResult
  });

  return createSqsHandler({
    logger,
    processMessage: async (event) => {
      const payment = await processor.process(event);
      if (payment.status === 'duplicate') {
        return payment;
      }

      return snsRepository.publish(createPaymentResultEvent({
        eventId: event.eventId,
        order: event.data,
        payment,
        occurredAt: now().toISOString()
      }));
    }
  });
}

module.exports.createProductionHandler = createProductionHandler;
