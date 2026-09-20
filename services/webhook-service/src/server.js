require('dotenv').config();

const { createApp } = require('./app');
const { createLogger } = require('../middlewares/logger');
const { verifyStripeSignature, mapStripeEvent } = require('../services/stripe.webhook');
const { verifyPayPalWebhook, mapPayPalEvent } = require('../services/paypal.webhook');

const port = Number(process.env.PORT) || 3000;
const logger = createLogger({ service: 'webhook-service', pretty: true });

const app = createApp({
  verifyStripe: (payload, signature) => verifyStripeSignature(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  ),
  mapStripeEvent,
  verifyPayPal: (request) => verifyPayPalWebhook(request, async () => true),
  mapPayPalEvent,
  processWebhook: async (event) => {
    logger.info({
      providerEventId: event.providerEventId,
      eventType: event.eventType
    }, 'Webhook processed locally');
  },
  logger
});

app.listen(port, () => {
  logger.info({ port }, 'Webhook API is running');
});
