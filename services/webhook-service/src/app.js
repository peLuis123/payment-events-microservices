const express = require('express');
const { createStripeRoute } = require('../routes/stripe.route');
const { createPayPalRoute } = require('../routes/paypal.route');

/**
 * Creates the webhook HTTP application.
 *
 * @param {{ verifyStripe: Function, mapStripeEvent: Function, verifyPayPal: Function, mapPayPalEvent: Function, processWebhook: Function, logger: object }} dependencies - Application dependencies.
 * @returns {import('express').Express} Webhook application.
 */
function createApp({
  verifyStripe,
  mapStripeEvent,
  verifyPayPal,
  mapPayPalEvent,
  processWebhook,
  logger
}) {
  const app = express();

  app.use('/webhooks/stripe', createStripeRoute({
    verifyStripe,
    mapStripeEvent,
    processWebhook
  }));
  app.use('/webhooks/paypal', createPayPalRoute({
    verifyPayPal,
    mapPayPalEvent,
    processWebhook
  }));
  app.use((error, request, response, next) => {
    if (response.headersSent) {
      next(error);
      return;
    }
    logger.error({}, error.stack || error.message);
    response.status(400).json({ error: 'Invalid webhook' });
  });

  return app;
}

module.exports = { createApp };
