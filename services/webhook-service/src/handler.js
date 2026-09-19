const serverless = require('serverless-http');
const { createApp } = require('./app');
const { createLogger } = require('../middlewares/logger');
const { verifyStripeSignature, mapStripeEvent } = require('../services/stripe.webhook');
const { verifyPayPalWebhook, mapPayPalEvent } = require('../services/paypal.webhook');

/**
 * Creates a Lambda-compatible handler from an Express app.
 *
 * @param {{ app: import('express').Express }} dependencies - Express app.
 * @returns {Function} Lambda handler.
 */
function createHandler({ app }) {
  return serverless(app);
}

/**
 * Creates the production webhook handler.
 *
 * Provider secret retrieval and durable event persistence are injected until
 * SSM/Secrets Manager and the event repository are connected.
 *
 * @param {{ verifyStripe?: Function, mapStripeEvent?: Function, verifyPayPal?: Function, mapPayPalEvent?: Function, processWebhook?: Function, logger?: object }} dependencies - Runtime dependencies.
 * @returns {Function} Lambda handler.
 */
function createProductionHandler({
  verifyStripe = (payload, signature, secret) => verifyStripeSignature(payload, signature, secret),
  mapStripeEvent: mapStripe = mapStripeEvent,
  verifyPayPal = (request) => verifyPayPalWebhook(request, async () => true),
  mapPayPalEvent: mapPayPal = mapPayPalEvent,
  processWebhook = async () => undefined,
  logger = createLogger({ service: 'webhook-service' })
} = {}) {
  return createHandler({
    app: createApp({
      verifyStripe,
      mapStripeEvent: mapStripe,
      verifyPayPal,
      mapPayPalEvent: mapPayPal,
      processWebhook,
      logger
    })
  });
}

let productionHandler;

/**
 * AWS Lambda entry point for provider webhooks.
 *
 * @param {object} event - API Gateway or Function URL event.
 * @param {object} context - Lambda execution context.
 * @returns {Promise<object>} HTTP response.
 */
async function handler(event, context) {
  productionHandler ??= createProductionHandler();
  return productionHandler(event, context);
}

module.exports = { createHandler, createProductionHandler, handler };
