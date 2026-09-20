const serverless = require('serverless-http');
const { createApp } = require('./app');
const { createLogger } = require('../middlewares/logger');
const { verifyStripeSignature, mapStripeEvent } = require('../services/stripe.webhook');
const { verifyPayPalWebhook, mapPayPalEvent } = require('../services/paypal.webhook');
const { verifyPayPalWebhookWithApi } = require('../services/paypal.webhook');
const { createProviderEventProcessor } = require('../services/provider-event.processor');
const { createProviderEventRepository } = require('../repositories/provider-event.repository');
const { requireProviderSecrets } = require('../services/provider-secrets');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');

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
 * Provider secrets are read from the Lambda environment for this sandbox MVP.
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
  stripeSecret = process.env.STRIPE_WEBHOOK_SECRET,
  logger = createLogger({ service: 'webhook-service' })
} = {}) {
  const stripeVerifier = stripeSecret
    ? (payload, signature) => verifyStripeSignature(payload, signature, stripeSecret)
    : verifyStripe;

  return createHandler({
    app: createApp({
      verifyStripe: stripeVerifier,
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
  if (!productionHandler) {
    const secrets = requireProviderSecrets();
    const region = process.env.AWS_REGION;
    const snsClient = new SNSClient({ region });
    const dynamodbClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));
    const repository = createProviderEventRepository({
      client: dynamodbClient,
      tableName: process.env.PROVIDER_EVENTS_TABLE || 'ProviderEvents'
    });
    const processor = createProviderEventProcessor({
      claim: repository.claim,
      publish: async (event) => snsClient.send(new PublishCommand({
        TopicArn: process.env.PAYMENT_EVENTS_TOPIC_ARN,
        Message: JSON.stringify(event)
      }))
    });
    productionHandler = createProductionHandler({
      stripeSecret: secrets.stripeWebhookSecret,
      verifyPayPal: (request) => verifyPayPalWebhookWithApi(request, {
        clientId: secrets.paypalClientId,
        clientSecret: secrets.paypalClientSecret,
        webhookId: secrets.paypalWebhookId,
        apiBaseUrl: secrets.paypalEnvironment === 'production'
          ? 'https://api-m.paypal.com'
          : 'https://api-m.sandbox.paypal.com'
      }),
      processWebhook: (event) => processor.process(event)
    });
  }
  return productionHandler(event, context);
}

module.exports = { createHandler, createProductionHandler, handler };
