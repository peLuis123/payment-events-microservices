const { SQSClient } = require('@aws-sdk/client-sqs');
const serverless = require('serverless-http');
const { createApp } = require('./app');
const { createLogger } = require('../middlewares/logger');
const { createOrderService } = require('../services/order.service');
const { createSqsRepository } = require('../repositories/sqs.repository');
const { loadEnvironment } = require('../validators/env.validator');

/**
 * Creates a Lambda handler from an Express application.
 *
 * @param {{ app: import('express').Express }} dependencies - Express application.
 * @returns {Function} Lambda-compatible handler.
 */
function createHandler({ app }) {
  return serverless(app);
}

/**
 * Composes the production handler and its AWS dependencies.
 *
 * @param {{ environment?: NodeJS.ProcessEnv, client?: object, logger?: object, createEventId?: Function, now?: Function }} dependencies - Runtime dependencies.
 * @returns {Function} Lambda-compatible production handler.
 */
function createProductionHandler({
  environment = process.env,
  client,
  logger = createLogger({ service: 'orders-service' }),
  createEventId,
  now
} = {}) {
  const config = loadEnvironment(environment);
  const sqsClient = client || new SQSClient({ region: config.AWS_REGION });
  const repository = createSqsRepository({
    client: sqsClient,
    queueUrl: config.SQS_QUEUE_URL
  });
  const orderService = createOrderService({
    publishEvent: repository.publish,
    createEventId,
    now
  });
  const app = createApp({ orderService, logger });

  return createHandler({ app });
}

let productionHandler;

async function handler(event, context, callback) {
  productionHandler ??= createProductionHandler();
  return productionHandler(event, context, callback);
}

module.exports = {
  createHandler,
  createProductionHandler,
  handler
};
